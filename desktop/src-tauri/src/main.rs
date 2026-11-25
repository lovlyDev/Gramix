#![cfg_attr(windows, windows_subsystem = "windows")]
/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */


fn main() {
    #[cfg(windows)]
    if std::env::args_os().nth(1).as_deref() == Some(std::ffi::OsStr::new("--sentinel-bot")) {
        if gramix_desktop_lib::sentinel::worker().is_err() { std::process::exit(1); }
        return;
    }
    gramix_desktop_lib::run();
}
