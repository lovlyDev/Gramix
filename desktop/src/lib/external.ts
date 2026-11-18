/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

// Внешние ссылки: на сайте — новая вкладка, в приложении — системный браузер.
export function openExternal(url: string) {
  if (!/^(https?:|mailto:)/i.test(url)) return;
  if (__WEB__) { window.open(url, "_blank", "noopener,noreferrer"); return; }
  void import("@tauri-apps/plugin-shell").then(({ open }) => open(url)).catch(() => undefined);
}
