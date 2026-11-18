/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

// Общий экспорт файлов. Сайт скачивает файл браузером; приложение открывает
// системное окно «Сохранить как» (WebView не скачивает blob-ссылки).
import { errorText } from "./errors";

export type Notice = { kind: "ok" | "error"; text: string };
export const NOTICE_EVENT = "gramix:notice";
export function notify(notice: Notice) {
  window.dispatchEvent(new CustomEvent<Notice>(NOTICE_EVENT, { detail: notice }));
}

const encoder = new TextEncoder();

export async function saveFile(name: string, content: string | Uint8Array | ArrayBuffer,
  type = "application/octet-stream"): Promise<boolean> {
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
    const { invoke } = await import("@tauri-apps/api/core");
    const path = await invoke<string | null>("save_export", { name, data: Array.from(bytes) });
    if (!path) return false;
    notify({ kind: "ok", text: `Сохранено: ${path}` });
    return true;
  } catch (error) {
    notify({ kind: "error", text: errorText(error) });
    return false;
  }
}

export const saveJson = (name: string, value: unknown) =>
  saveFile(name, JSON.stringify(value, null, 2), "application/json");
