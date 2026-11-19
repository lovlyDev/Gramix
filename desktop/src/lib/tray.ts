/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

// Трей в приложении: закрытие окна прячет Gramix, поиск и наблюдение за адресами продолжаются.
import { t } from "./i18n";
import { systemNotify } from "./system-notify";

export const TRAY_KEY = "gramix.ui.closeToTray";
const NOTICE_KEY = "gramix.ui.trayNoticeShown";

export function closeToTrayEnabled() {
  try { return localStorage.getItem(TRAY_KEY) !== "false"; } catch { return true; }
}

export async function configureTray(enabled = closeToTrayEnabled()) {
  if (__WEB__) return;
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("configure_tray", { closeToTray: enabled, openLabel: t("Открыть Gramix"), quitLabel: t("Выход") });
  } catch { /* не в приложении */ }
}

export function setCloseToTray(enabled: boolean) {
  try { localStorage.setItem(TRAY_KEY, String(enabled)); } catch { /* приватный режим */ }
  void configureTray(enabled);
}

/** Один раз подсказать, что приложение не закрылось, а ушло в трей. */
export async function watchTrayHide() {
  if (__WEB__) return () => undefined;
  try {
    const { listen } = await import("@tauri-apps/api/event");
    return await listen("gramix://hidden-to-tray", () => {
      try { if (localStorage.getItem(NOTICE_KEY) === "true") return; localStorage.setItem(NOTICE_KEY, "true"); } catch { /* приватный режим */ }
      void systemNotify(t("Gramix работает в трее"), t("Поиск адреса и наблюдение за балансами продолжаются. Выйти можно через значок в трее."), { force: true });
    });
  } catch { return () => undefined; }
}
