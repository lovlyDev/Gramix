/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

use serde_json::Value;
use std::io::{Read, Write};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::path::PathBuf;
use std::process::{Command, Stdio};
use std::thread;
use std::time::{Duration, Instant};
use tauri::Manager;

const MAX_OUTPUT_BYTES: usize = 64 * 1024;

#[derive(Default)]
pub struct SandboxControl {
    running: AtomicBool,
    cancelled: Arc<AtomicBool>,
}

fn scenario_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let bundled = app.path().resource_dir()
        .map(|dir| dir.join("runtime").join("sandbox-scenario.cjs"))
        .map_err(|_| "Не удалось найти сценарий Sandbox")?;
    if bundled.is_file() { return Ok(bundled); }
    let development = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../runtime/bundle/sandbox-scenario.cjs");
    if development.is_file() { return Ok(development); }
    Err("Сценарий Sandbox не включён в сборку".into())
}

fn node_path(app: &tauri::AppHandle) -> PathBuf {
    app.path().resource_dir().map(|dir| dir.join("runtime").join("node.exe"))
        .ok().filter(|path| path.is_file()).unwrap_or_else(|| PathBuf::from("node"))
}

fn run_fixed_scenario(node: PathBuf, path: PathBuf, scenario: Option<String>,
    cancelled: Arc<AtomicBool>) -> Result<Value, String> {
    let runtime_dir = path.parent().ok_or("Не найден каталог сценария Sandbox")?;
    let mut command = Command::new(node);
    command.current_dir(runtime_dir)
        .arg("--max-old-space-size=256").arg("./sandbox-scenario.cjs")
        .stdin(Stdio::piped()).stdout(Stdio::piped()).stderr(Stdio::piped())
        .env_remove("NODE_OPTIONS").env_remove("NODE_PATH");
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        command.creation_flags(0x08000000);
    }
    let mut child = command.spawn().map_err(|_| "Node.js не найден: для Sandbox нужен Node.js 22+".to_string())?;
    if let Some(input) = scenario {
        child.stdin.take().ok_or("Не удалось передать сценарий")?
            .write_all(input.as_bytes()).map_err(|_| "Не удалось передать сценарий")?;
    } else {
        child.stdin.take();
    }
    let started = Instant::now();
    loop {
        if cancelled.load(Ordering::SeqCst) {
            let _ = child.kill();
            let _ = child.wait();
            return Err("Сценарий остановлен пользователем".into());
        }
        if let Some(status) = child.try_wait().map_err(|_| "Не удалось дождаться Sandbox")? {
            let mut stdout = Vec::new();
            let mut stderr = Vec::new();
            child.stdout.take().ok_or("Нет вывода Sandbox")?.take((MAX_OUTPUT_BYTES + 1) as u64)
                .read_to_end(&mut stdout).map_err(|_| "Не удалось прочитать Sandbox")?;
            child.stderr.take().ok_or("Нет ошибок Sandbox")?.take((MAX_OUTPUT_BYTES + 1) as u64)
                .read_to_end(&mut stderr).map_err(|_| "Не удалось прочитать ошибку Sandbox")?;
            if stdout.len() > MAX_OUTPUT_BYTES || stderr.len() > MAX_OUTPUT_BYTES {
                return Err("Вывод Sandbox слишком велик".into());
            }
            if !status.success() {
                return Err(format!("Sandbox завершился с ошибкой: {}",
                    String::from_utf8_lossy(&stderr).trim()));
            }
            let value: Value = serde_json::from_slice(&stdout)
                .map_err(|_| "Sandbox вернул некорректный JSON")?;
            if value.get("network").and_then(Value::as_str) != Some("simulation") ||
                value.get("snapshotsRestored").and_then(Value::as_bool) != Some(true) {
                return Err("Sandbox не подтвердил локальный сценарий".into());
            }
            return Ok(value);
        }
        if started.elapsed() > Duration::from_secs(15) {
            let _ = child.kill();
            let _ = child.wait();
            return Err("Sandbox превысил лимит времени 15 секунд".into());
        }
        thread::sleep(Duration::from_millis(50));
    }
}

#[tauri::command]
pub async fn run_sandbox_demo(app: tauri::AppHandle,
    control: tauri::State<'_, SandboxControl>, scenario: Option<Value>) -> Result<Value, String> {
    let path = scenario_path(&app)?;
    let node = node_path(&app);
    let input = scenario.map(|value| serde_json::to_string(&value))
        .transpose().map_err(|_| "Некорректный сценарий")?;
    if input.as_ref().is_some_and(|text| text.len() > 32 * 1024) {
        return Err("Сценарий превышает 32 КиБ".into());
    }
    if control.running.swap(true, Ordering::SeqCst) {
        return Err("Sandbox уже выполняет сценарий".into());
    }
    control.cancelled.store(false, Ordering::SeqCst);
    let cancelled = control.cancelled.clone();
    let result = tauri::async_runtime::spawn_blocking(move ||
        run_fixed_scenario(node, path, input, cancelled))
        .await.map_err(|_| "Не удалось запустить Sandbox".to_string())?;
    control.running.store(false, Ordering::SeqCst);
    result
}

#[tauri::command]
pub fn cancel_sandbox(control: tauri::State<'_, SandboxControl>) -> bool {
    if !control.running.load(Ordering::SeqCst) { return false; }
    control.cancelled.store(true, Ordering::SeqCst);
    true
}

#[cfg(test)]
mod tests {
    use super::run_fixed_scenario;
    use std::path::PathBuf;
    use std::sync::{atomic::AtomicBool, Arc};

    #[test]
    fn fixed_scenario_runs_from_path_with_spaces() {
        let desktop = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("..");
        let result = run_fixed_scenario(
            desktop.join("runtime/bin/node.exe"),
            desktop.join("runtime/bundle/sandbox-scenario.cjs"),
            None,
            Arc::new(AtomicBool::new(false)),
        ).expect("bundled sandbox scenario must run from the desktop workspace");
        assert_eq!(result["network"], "simulation");
        assert_eq!(result["snapshotsRestored"], true);
    }
}
