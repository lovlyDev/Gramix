/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

// Уведомления в окне: стек сверху по центру. Показ — через событие, чтобы любой модуль мог вызвать notify().
export type NoticeKind = "ok" | "error" | "info";
export type NoticeAction = { label: string; run: () => void };
export type Notice = { kind: NoticeKind; text: string; title?: string; actions?: NoticeAction[]; duration?: number };
export const NOTICE_EVENT = "gramix:notice";

// Ошибки висят дольше, чтобы их успели прочитать.
export const noticeDuration = (notice: Notice) => notice.duration ?? (notice.kind === "error" ? 9000 : 5000);

export function notify(notice: Notice) {
  window.dispatchEvent(new CustomEvent<Notice>(NOTICE_EVENT, { detail: notice }));
}
export const notifyError = (text: string, title?: string) => notify({ kind: "error", text, title });
export const notifyOk = (text: string, title?: string) => notify({ kind: "ok", text, title });
