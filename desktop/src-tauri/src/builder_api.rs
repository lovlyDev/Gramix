/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE and LICENSING.md for details.
 */

use serde_json::Value;
use std::io::{Read, Write};
use std::path::PathBuf;
use std::process::{Command, Stdio};
use std::thread;
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};
use tauri::Manager;

fn runner_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let bundled = app.path().resource_dir()
        .map(|dir| dir.join("runtime").join("tolk-build.cjs"))
        .map_err(|_| "Не удалось найти Tolk-компилятор")?;
    if bundled.is_file() { return Ok(bundled); }
    let development = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../runtime/bundle/tolk-build.cjs");
    if development.is_file() { return Ok(development); }
    Err("Tolk-компилятор не включён в сборку".into())
}

fn node_path(app: &tauri::AppHandle) -> PathBuf {
    app.path().resource_dir().map(|dir| dir.join("runtime").join("node.exe"))
        .ok().filter(|path| path.is_file()).unwrap_or_else(|| PathBuf::from("node"))
}

fn compile_fixed(node: PathBuf, path: PathBuf, source: String) -> Result<Value, String> {
    let runtime_dir = path.parent().ok_or("Не найден каталог Tolk-компилятора")?;
    let unique = SystemTime::now().duration_since(UNIX_EPOCH)
        .map_err(|_| "Не удалось создать временный файл")?.as_nanos();
    let output_path = std::env::temp_dir().join(format!("gramix-tolk-{}-{unique}.json", std::process::id()));
    let file = std::fs::OpenOptions::new().write(true).create_new(true)
        .open(&output_path).map_err(|_| "Не удалось создать временный файл компиляции")?;
    let result = (|| {
        let mut command = Command::new(node);
        command.current_dir(runtime_dir)
            .arg("--max-old-space-size=256").arg("./tolk-build.cjs")
            .stdin(Stdio::piped()).stdout(Stdio::from(file))
            .stderr(Stdio::piped()).env_remove("NODE_OPTIONS").env_remove("NODE_PATH");
        #[cfg(windows)]
        {
            use std::os::windows::process::CommandExt;
            command.creation_flags(0x08000000);
        }
        let mut child = command.spawn()
            .map_err(|_| "Node.js не найден: для Tolk нужен Node.js 22+".to_string())?;
        child.stdin.take().ok_or("Не удалось передать исходный код")?
            .write_all(source.as_bytes()).map_err(|_| "Не удалось передать исходный код")?;
        let started = Instant::now();
        loop {
            if let Some(status) = child.try_wait().map_err(|_| "Ошибка ожидания Tolk")? {
                if !status.success() {
                    let mut stderr = String::new();
                    child.stderr.take().ok_or("Нет диагностики Tolk")?
                        .take(8193).read_to_string(&mut stderr)
                        .map_err(|_| "Не удалось прочитать ошибку Tolk")?;
                    return Err(format!("Tolk завершился с ошибкой: {}", stderr.trim()));
                }
                let bytes = std::fs::read(&output_path)
                    .map_err(|_| "Не удалось прочитать результат Tolk")?;
                if bytes.len() > 1024 * 1024 { return Err("Результат Tolk превышает 1 МиБ".into()); }
                let value: Value = serde_json::from_slice(&bytes)
                    .map_err(|_| "Tolk вернул некорректный JSON")?;
                if !matches!(value.get("status").and_then(Value::as_str), Some("ok" | "error")) {
                    return Err("Tolk вернул неизвестный статус".into());
                }
                return Ok(value);
            }
            if started.elapsed() > Duration::from_secs(20) {
                let _ = child.kill();
                let _ = child.wait();
                return Err("Tolk превысил лимит времени 20 секунд".into());
            }
            thread::sleep(Duration::from_millis(50));
        }
    })();
    let _ = std::fs::remove_file(output_path);
    result
}

#[tauri::command]
pub async fn compile_tolk(app: tauri::AppHandle, source: String) -> Result<Value, String> {
    if source.is_empty() || source.len() > 128 * 1024 {
        return Err("Исходный код Tolk должен быть размером от 1 байта до 128 КиБ".into());
    }
    let path = runner_path(&app)?;
    let node = node_path(&app);
    tauri::async_runtime::spawn_blocking(move || compile_fixed(node, path, source))
        .await.map_err(|_| "Не удалось запустить Tolk-компилятор".to_string())?
}
