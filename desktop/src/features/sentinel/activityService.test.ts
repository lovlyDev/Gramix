/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

import { describe, expect, it, vi } from "vitest";
import { getHistory, type HistoryEvent } from "../../lib/market";
import { readActivity } from "./activityService";

vi.mock("../../lib/market", () => ({ getHistory: vi.fn() }));
const fetchPage = vi.mocked(getHistory);
const event = (id: string, time: number, pending = false): HistoryEvent => ({
  id,
  time,
  pending,
  lt: id,
  scam: false,
  tx: null,
  actions: [],
});
describe("Sentinel activity polling", () => {
  it("reuses confirmed history, removes expired events and keeps new ones", async () => {
    const old = [event("4", 40), event("3", 30), event("2", 20)];
    fetchPage.mockReset().mockResolvedValueOnce({ events: [event("5", 50), old[0]], next: "4" });
    expect((await readActivity("addr", 25, old, () => true)).map((e) => e.id)).toEqual(["5", "4", "3"]);
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });
  it("fetches older pages while a cached transaction is pending", async () => {
    const first = event("4", 40),
      pending = event("3", 30, true);
    fetchPage
      .mockReset()
      .mockResolvedValueOnce({ events: [first], next: "4" })
      .mockResolvedValueOnce({ events: [event("3", 30)], next: null });
    const rows = await readActivity("addr", 25, [first, pending], () => true);
    expect(rows.map((e) => e.pending)).toEqual([false, false]);
    expect(fetchPage).toHaveBeenCalledTimes(2);
  });
});
