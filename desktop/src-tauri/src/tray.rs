/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

// Работа в трее: закрытие окна прячет Gramix в область уведомлений, поиск адреса и
// наблюдение за адресами продолжаются. «Выход» в меню значка завершает приложение.
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{Emitter, Manager};

pub struct TrayState {
    close_to_tray: AtomicBool,
    quitting: AtomicBool,
    items: Mutex<Option<(MenuItem<tauri::Wry>, MenuItem<tauri::Wry>)>>,
}

impl Default for TrayState {
    fn default() -> Self {
        Self { close_to_tray: AtomicBool::new(true), quitting: AtomicBool::new(false), items: Mutex::new(None) }
    }
}

pub fn show_main(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

pub fn setup(app: &tauri::App) -> tauri::Result<()> {
    let open = MenuItem::with_id(app, "open", "Открыть Gramix", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Выход", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&open, &quit])?;
    let state = app.state::<TrayState>();
    if let Ok(mut items) = state.items.lock() { *items = Some((open, quit)); }
    let mut builder = TrayIconBuilder::with_id("main").tooltip("Gramix").menu(&menu).show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id().as_ref() {
            "open" => show_main(app),
            "quit" => { app.state::<TrayState>().quitting.store(true, Ordering::SeqCst); app.exit(0); }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click { button: MouseButton::Left, button_state: MouseButtonState::Up, .. } = event {
                show_main(tray.app_handle());
            }
        });
    if let Some(icon) = app.default_window_icon() { builder = builder.icon(icon.clone()); }
    builder.build(app)?;
    Ok(())
}

/// Закрытие окна: если включён трей, окно прячется вместо выхода.
pub fn on_close(window: &tauri::Window, api: &tauri::CloseRequestApi) {
    let state = window.state::<TrayState>();
    if state.quitting.load(Ordering::SeqCst) || !state.close_to_tray.load(Ordering::SeqCst) { return; }
    api.prevent_close();
    let _ = window.hide();
    let _ = window.emit("gramix://hidden-to-tray", ());
}

/// Настройка из интерфейса: включён ли трей и подписи меню на языке интерфейса.
#[tauri::command]
pub fn configure_tray(state: tauri::State<'_, TrayState>, close_to_tray: bool, open_label: String, quit_label: String) {
    state.close_to_tray.store(close_to_tray, Ordering::SeqCst);
    if let Ok(items) = state.items.lock() {
        if let Some((open, quit)) = items.as_ref() {
            let _ = open.set_text(open_label.chars().take(40).collect::<String>());
            let _ = quit.set_text(quit_label.chars().take(40).collect::<String>());
        }
    }
}

#[tauri::command]
pub fn quit_app(app: tauri::AppHandle, state: tauri::State<'_, TrayState>) {
    state.quitting.store(true, Ordering::SeqCst);
    app.exit(0);
}
