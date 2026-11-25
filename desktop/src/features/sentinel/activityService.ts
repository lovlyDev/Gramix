/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

import { getHistory, type HistoryEvent } from "../../lib/market";
import { errorText } from "../../lib/errors";
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
export async function request<T>(fn: () => Promise<T>, active: () => boolean) {
  for (let attempt = 0; ; attempt++) {
    if (!active()) throw new DOMException("Cancelled", "AbortError");
    try {
      return await fn();
    } catch (e) {
      if (
        attempt >= 2 ||
        !(/429/.test(errorText(e)) || errorText(e).includes("\u0447\u0430\u0441\u0442\u043e\u0442"))
      )
        throw e;
      await delay(1500 * (attempt + 1));
    }
  }
}
// Курсор хранится только для текущей сети, выборки и периода. При незавершённых
// событиях перечитываем страницы до конца периода: их результат ещё может измениться.
export async function readActivity(
  raw: string,
  start: number,
  previous: HistoryEvent[],
  active: () => boolean,
) {
  const anchor = previous.some((e) => e.pending) ? undefined : previous[0]?.id;
  const events: HistoryEvent[] = [];
  const ids = new Set<string>(),
    cursors = new Set<string>();
  let cursor: string | undefined;
  function append(event: HistoryEvent) {
    if (event.time < start || ids.has(event.id)) return;
    ids.add(event.id);
    events.push(event);
  }
  while (active()) {
    const page = await request(() => getHistory(raw, false, cursor), active);
    for (const event of page.events) append(event);
    if (anchor && page.events.some((e) => e.id === anchor && !e.pending)) {
      for (const event of previous) append(event);
      break;
    }
    if (!page.next || !page.events.length || page.events.at(-1)!.time < start || cursors.has(page.next))
      break;
    cursor = page.next;
    cursors.add(cursor);
  }
  return events;
}
