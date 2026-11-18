/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

/** Текст ошибки для интерфейса: без префикса «Error:», в том числе для строк от Tauri. */
export function errorText(cause: unknown): string {
  const text = cause instanceof Error ? cause.message : String(cause);
  return text.replace(/^(Error|TypeError|RangeError):\s*/, "");
}
