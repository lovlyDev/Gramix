/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

mod account_api;
mod transaction_api;
mod contract_api;
mod sandbox_api;
mod builder_api;
mod export_api;
mod market_api;

#[tauri::command]
fn supports_self_update(app: tauri::AppHandle) -> bool {
    !app.package_info().version.to_string().contains("-dev.") &&
        (cfg!(target_os = "windows") || std::env::var_os("APPIMAGE").is_some())
}

/// До переименования приложение называлось VANTIX (app.vantix.desktop).
/// При первом запуске Gramix копирует оттуда сохранённые кошельки и найденные адреса.
fn migrate_legacy_data(app: &tauri::AppHandle) {
    use tauri::Manager;
    let Ok(current) = app.path().app_data_dir() else { return; };
    if current.exists() { return; }
    let Some(parent) = current.parent() else { return; };
    let legacy = parent.join("app.vantix.desktop");
    if legacy.is_dir() {
        if let Err(error) = copy_dir(&legacy, &current) {
            eprintln!("Gramix: не удалось перенести данные VANTIX: {error}");
        }
    }
}

fn copy_dir(from: &std::path::Path, to: &std::path::Path) -> std::io::Result<()> {
    std::fs::create_dir_all(to)?;
    for entry in std::fs::read_dir(from)? {
        let entry = entry?;
        let target = to.join(entry.file_name());
        if entry.file_type()?.is_dir() { copy_dir(&entry.path(), &target)?; }
        else { std::fs::copy(entry.path(), target)?; }
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| { migrate_legacy_data(app.handle()); Ok(()) })
        .manage(sandbox_api::SandboxControl::default())
        .manage(export_api::ExportState::default())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            supports_self_update,
            account_api::fetch_account,
            transaction_api::fetch_transaction,
            contract_api::fetch_contract,
            contract_api::inspect_contract_code,
            contract_api::run_get_method,
            sandbox_api::run_sandbox_demo,
            sandbox_api::cancel_sandbox,
            builder_api::compile_tolk,
            export_api::save_export,
            export_api::get_export_dir,
            export_api::choose_export_dir,
            export_api::clear_export_dir,
            export_api::reveal_export,
            market_api::fetch_rates,
            market_api::fetch_rates_chart,
            market_api::fetch_account_events,
            market_api::fetch_accounts_bulk,
            market_api::fetch_nft,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Gramix");
}
