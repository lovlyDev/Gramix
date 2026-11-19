/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

// Системные уведомления Windows/Linux о долгих задачах. Только в приложении и только когда окно
// не в фокусе — иначе хватает уведомления внутри окна. Текст никогда не содержит секретов.
export const SYSTEM_NOTIFY_KEY = "gramix.ui.systemNotifications";

export function systemNotifyEnabled() {
  try { return localStorage.getItem(SYSTEM_NOTIFY_KEY) !== "false"; } catch { return true; }
}

export async function ensureSystemNotifyPermission(): Promise<boolean> {
  if (__WEB__) return false;
  try {
    const plugin = await import("@tauri-apps/plugin-notification");
    if (await plugin.isPermissionGranted()) return true;
    return (await plugin.requestPermission()) === "granted";
  } catch { return false; }
}

export async function systemNotify(title: string, body: string, options: { force?: boolean } = {}) {
  if (__WEB__ || !systemNotifyEnabled()) return;
  if (!options.force && document.hasFocus() && !document.hidden) return;
  try {
    if (!await ensureSystemNotifyPermission()) return;
    const { sendNotification } = await import("@tauri-apps/plugin-notification");
    sendNotification({ title, body });
  } catch { /* уведомления недоступны в системе */ }
}
