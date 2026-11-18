/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

// Буфер обмена: Clipboard API есть только на защищённых страницах (HTTPS, приложение).
// На HTTP копирование идёт через скрытое поле и execCommand.
export async function copyText(value: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    try { await navigator.clipboard.writeText(value); return; } catch { /* запасной способ ниже */ }
  }
  const area = document.createElement("textarea");
  area.value = value;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.append(area);
  area.select();
  const ok = document.execCommand("copy");
  area.remove();
  if (!ok) throw new Error("Браузер не разрешил копирование.");
}

export async function pasteText(): Promise<string> {
  if (!navigator.clipboard || !window.isSecureContext)
    throw new Error("Вставка из буфера доступна только по HTTPS. Вставьте адрес сочетанием Ctrl+V.");
  return await navigator.clipboard.readText();
}
