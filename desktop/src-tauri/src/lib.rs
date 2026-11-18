/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE and LICENSING.md for details.
 */

mod account_api;
mod transaction_api;
mod contract_api;
mod sandbox_api;
mod builder_api;

#[tauri::command]
fn supports_self_update(app: tauri::AppHandle) -> bool {
    !app.package_info().version.to_string().contains("-dev.") &&
        (cfg!(target_os = "windows") || std::env::var_os("APPIMAGE").is_some())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(sandbox_api::SandboxControl::default())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
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
        ])
        .run(tauri::generate_context!())
        .expect("error while running VANTIX");
}
