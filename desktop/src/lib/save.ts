/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

// Общий экспорт файлов. Сайт скачивает файл браузером. Приложение пишет файл в папку
// из настроек или спрашивает путь в окне «Сохранить как» (WebView не скачивает blob-ссылки).
import { errorText } from "./errors";
import { notify } from "./notify";

export { notify } from "./notify";
type Saved = { path: string; folder: string };
const encoder = new TextEncoder();

async function tauriInvoke<T>(command: string, args?: Record<string, unknown>) {
  const { invoke } = await import("@tauri-apps/api/core");
  return await invoke<T>(command, args);
}

export async function revealFile(path: string) {
  try { await tauriInvoke("reveal_export", { path }); }
  catch (error) { notify({ kind: "error", text: errorText(error) }); }
}

export async function saveFile(name: string, content: string | Uint8Array | ArrayBuffer,
  type = "application/octet-stream", options: { ask?: boolean } = {}): Promise<boolean> {
  const bytes = typeof content === "string" ? encoder.encode(content)
    : content instanceof Uint8Array ? content : new Uint8Array(content);
  if (__WEB__) {
    const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type }));
    const link = document.createElement("a");
    link.href = url; link.download = name; link.style.display = "none";
    document.body.append(link); link.click(); link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
    return true;
  }
  try {
    const saved = await tauriInvoke<Saved | null>("save_export", { name, data: Array.from(bytes), ask: options.ask ?? false });
    if (!saved) return false;
    const fileName = saved.path.split(/[\\/]/).pop() ?? name;
    notify({ kind: "ok", title: "Файл сохранён", text: `${fileName} · ${saved.folder}`,
      actions: [{ label: "Показать в папке", run: () => void revealFile(saved.path) }] });
    return true;
  } catch (error) {
    notify({ kind: "error", title: "Файл не сохранён", text: errorText(error) });
    return false;
  }
}

export const saveJson = (name: string, value: unknown) =>
  saveFile(name, JSON.stringify(value, null, 2), "application/json");

export const exportFolder = {
  get: () => tauriInvoke<string | null>("get_export_dir"),
  choose: () => tauriInvoke<string | null>("choose_export_dir"),
  clear: () => tauriInvoke<void>("clear_export_dir"),
};
