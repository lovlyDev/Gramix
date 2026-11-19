/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

// Экспорт файлов. WebView не скачивает blob-ссылки, поэтому файл пишет приложение:
// в выбранную в настройках папку или по пути из окна «Сохранить как».
// Папку выбирает только системный диалог, а «Показать в папке» работает лишь для файлов,
// которые записал сам Gramix.
use std::collections::HashSet;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use tauri::Manager;
use tauri_plugin_dialog::DialogExt;

const MAX_EXPORT_BYTES: usize = 64 * 1024 * 1024;
const SETTINGS_FILE: &str = "export.json";

#[derive(Default)]
pub struct ExportState {
    written: Mutex<HashSet<PathBuf>>,
}

fn safe_name(name: &str) -> String {
    let cleaned: String = name.chars()
        .map(|c| if c.is_control() || r#"<>:"/\|?*"#.contains(c) { '_' } else { c })
        .collect();
    let trimmed = cleaned.trim().trim_matches('.');
    if trimmed.is_empty() { "gramix-export".into() } else { trimmed.chars().take(120).collect() }
}

fn settings_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = app.path().app_data_dir().map_err(|error| error.to_string())?;
    Ok(dir.join(SETTINGS_FILE))
}

fn stored_dir(app: &tauri::AppHandle) -> Option<PathBuf> {
    let text = std::fs::read_to_string(settings_path(app).ok()?).ok()?;
    let value: serde_json::Value = serde_json::from_str(&text).ok()?;
    let dir = PathBuf::from(value.get("export_dir")?.as_str()?);
    dir.is_dir().then_some(dir)
}

fn store_dir(app: &tauri::AppHandle, dir: Option<&Path>) -> Result<(), String> {
    let path = settings_path(app)?;
    if let Some(parent) = path.parent() { std::fs::create_dir_all(parent).map_err(|error| error.to_string())?; }
    let value = serde_json::json!({ "export_dir": dir.map(|item| item.display().to_string()) });
    std::fs::write(path, value.to_string()).map_err(|error| error.to_string())
}

// «file.json» → «file (1).json», «file (2).json»… — существующие файлы не перезаписываются.
fn unique_path(dir: &Path, name: &str) -> PathBuf {
    let candidate = dir.join(name);
    if !candidate.exists() { return candidate; }
    let path = Path::new(name);
    let stem = path.file_stem().and_then(|value| value.to_str()).unwrap_or("gramix-export");
    let extension = path.extension().and_then(|value| value.to_str());
    for index in 1..10_000 {
        let next = match extension { Some(ext) => format!("{stem} ({index}).{ext}"), None => format!("{stem} ({index})") };
        let candidate = dir.join(next);
        if !candidate.exists() { return candidate; }
    }
    dir.join(format!("{stem}-{}", std::process::id()))
}

fn filter_label(extension: &str) -> &'static str {
    match extension { "json" => "JSON", "csv" => "CSV", "txt" => "Text", "svg" => "SVG",
        "boc" => "BOC", "tolk" => "Tolk", _ => "File" }
}

#[tauri::command]
pub async fn save_export(app: tauri::AppHandle, state: tauri::State<'_, ExportState>, name: String, data: Vec<u8>,
    ask: Option<bool>) -> Result<Option<serde_json::Value>, String> {
    if data.len() > MAX_EXPORT_BYTES { return Err("Файл слишком большой для экспорта.".into()); }
    let name = safe_name(&name);
    let path = match stored_dir(&app).filter(|_| !ask.unwrap_or(false)) {
        Some(dir) => unique_path(&dir, &name),
        None => {
            let mut dialog = app.dialog().file().set_title("Сохранить файл").set_file_name(&name);
            if let Some(extension) = Path::new(&name).extension().and_then(|value| value.to_str()) {
                dialog = dialog.add_filter(filter_label(extension), &[extension]);
            }
            let Some(target) = dialog.blocking_save_file() else { return Ok(None) };
            target.into_path().map_err(|error| format!("Недопустимый путь: {error}"))?
        }
    };
    let target = path.clone();
    tauri::async_runtime::spawn_blocking(move || std::fs::write(&target, data))
        .await
        .map_err(|error| error.to_string())?
        .map_err(|error| format!("Не удалось сохранить файл: {error}"))?;
    state.written.lock().map_err(|_| "Состояние экспорта недоступно.")?.insert(path.clone());
    let folder = path.parent().map(|item| item.display().to_string()).unwrap_or_default();
    Ok(Some(serde_json::json!({ "path": path.display().to_string(), "folder": folder })))
}

#[tauri::command]
pub fn get_export_dir(app: tauri::AppHandle) -> Option<String> {
    stored_dir(&app).map(|dir| dir.display().to_string())
}

#[tauri::command]
pub async fn choose_export_dir(app: tauri::AppHandle) -> Result<Option<String>, String> {
    let Some(folder) = app.dialog().file().set_title("Папка для сохранения файлов").blocking_pick_folder()
        else { return Ok(None) };
    let dir = folder.into_path().map_err(|error| format!("Недопустимый путь: {error}"))?;
    if !dir.is_dir() { return Err("Папка не найдена.".into()); }
    store_dir(&app, Some(&dir))?;
    Ok(Some(dir.display().to_string()))
}

#[tauri::command]
pub fn clear_export_dir(app: tauri::AppHandle) -> Result<(), String> {
    store_dir(&app, None)
}

// Открыть проводник и выделить файл. Сам файл не запускается.
#[tauri::command]
pub fn reveal_export(state: tauri::State<'_, ExportState>, path: String) -> Result<(), String> {
    let path = PathBuf::from(path);
    if !state.written.lock().map_err(|_| "Состояние экспорта недоступно.")?.contains(&path) {
        return Err("Показать можно только файл, сохранённый Gramix.".into());
    }
    #[cfg(target_os = "windows")]
    {
        let mut select = std::ffi::OsString::from("/select,");
        select.push(path.as_os_str());
        std::process::Command::new("explorer").arg(select).spawn().map_err(|error| error.to_string())?;
    }
    #[cfg(not(target_os = "windows"))]
    {
        let folder = path.parent().ok_or("Папка не найдена.")?;
        std::process::Command::new("xdg-open").arg(folder).spawn().map_err(|error| error.to_string())?;
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn names_are_sanitized() {
        assert_eq!(safe_name("../a:b?.json"), "_a_b_.json");
        assert_eq!(safe_name("   "), "gramix-export");
    }

    #[test]
    fn existing_files_get_suffix() {
        let dir = std::env::temp_dir().join(format!("gramix-export-test-{}", std::process::id()));
        std::fs::create_dir_all(&dir).unwrap();
        std::fs::write(dir.join("a.json"), b"1").unwrap();
        assert_eq!(unique_path(&dir, "a.json"), dir.join("a (1).json"));
        assert_eq!(unique_path(&dir, "b.json"), dir.join("b.json"));
        std::fs::remove_dir_all(dir).unwrap();
    }
}
