/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

// Экспорт файлов: WebView не умеет скачивать blob-ссылки, поэтому приложение
// спрашивает путь в системном окне «Сохранить как» и пишет файл только туда.
use tauri_plugin_dialog::DialogExt;

const MAX_EXPORT_BYTES: usize = 64 * 1024 * 1024;

fn safe_name(name: &str) -> String {
    let cleaned: String = name.chars()
        .map(|c| if c.is_control() || r#"<>:"/\|?*"#.contains(c) { '_' } else { c })
        .collect();
    let trimmed = cleaned.trim().trim_matches('.');
    if trimmed.is_empty() { "gramix-export".into() } else { trimmed.chars().take(120).collect() }
}

#[tauri::command]
pub async fn save_export(app: tauri::AppHandle, name: String, data: Vec<u8>) -> Result<Option<String>, String> {
    if data.len() > MAX_EXPORT_BYTES { return Err("Файл слишком большой для экспорта.".into()); }
    let name = safe_name(&name);
    let mut dialog = app.dialog().file().set_title("Сохранить файл").set_file_name(&name);
    if let Some(extension) = std::path::Path::new(&name).extension().and_then(|value| value.to_str()) {
        let label = match extension { "json" => "JSON", "csv" => "CSV", "txt" => "Текст", "svg" => "SVG",
            "boc" => "BOC", "tolk" => "Tolk", _ => "Файл" };
        dialog = dialog.add_filter(label, &[extension]);
    }
    let Some(target) = dialog.blocking_save_file() else { return Ok(None) };
    let path = target.into_path().map_err(|error| format!("Недопустимый путь: {error}"))?;
    let saved = path.clone();
    tauri::async_runtime::spawn_blocking(move || std::fs::write(&path, data))
        .await
        .map_err(|error| error.to_string())?
        .map_err(|error| format!("Не удалось сохранить файл: {error}"))?;
    Ok(Some(saved.display().to_string()))
}
