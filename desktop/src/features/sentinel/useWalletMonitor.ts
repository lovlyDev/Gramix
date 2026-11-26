/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

import { useState, useEffect, useRef } from "react";
import { getBalances, getRates, type HistoryEvent } from "../../lib/market";
import { getTokens, tokenValue, type Token } from "../../lib/portfolio";
import { getAccountNfts, type NftInfo } from "../../lib/nft";
import { errorText } from "../../lib/errors";
import { readActivity, request } from "./activityService";

export type Holding = { raw: string; balance: string | null; tokens: Token[]; nfts: NftInfo[] };
export type Entry = { raw: string; event: HistoryEvent };
export type Sample = { time: number; usd: number };
const sampleKey = "gramix.sentinel.valuations.v1";
function series(group: string, now: Sample) {
  let history: Record<string, Sample[]> = {};
  try {
    history = JSON.parse(localStorage.getItem(sampleKey) ?? "{}") ?? {};
  } catch {}
  const points = (Array.isArray(history[group]) ? history[group] : []).filter(
    (p) => p.time > now.time - 30 * 86400000 && Number.isFinite(p.usd),
  );
  if (points.length && now.time - points.at(-1)!.time < 60000) points.pop();
  points.push(now);
  history[group] = points.slice(-2500);
  try {
    localStorage.setItem(sampleKey, JSON.stringify(history));
  } catch {}
  return points;
}

export function useWalletMonitor(
  keys: string,
  isPortfolio: boolean,
  enabled: boolean,
  days: string,
  refresh: number,
  visible: boolean,
) {
  const visibleRef = useRef(visible);
  useEffect(() => { visibleRef.current = visible; }, [visible]);
  const [error, fail] = useState("");
  const [busy, setBusy] = useState(false),
    [hold, setHold] = useState<Holding[]>([]),
    [feed, setFeed] = useState<Entry[]>([]);
  const [price, setPrice] = useState(0),
    [points, setPoints] = useState<Sample[]>([]);
  useEffect(() => {
    let live = true;
    let timer: ReturnType<typeof setTimeout>;
    setHold([]);
    setFeed([]);
    fail("");
    setPoints([]);
    setBusy(false);
    if (!enabled || !keys) return;
    const historyByAddress = new Map<string, HistoryEvent[]>();
    const active = () => live;
    async function update() {
      if (!visibleRef.current) {
        timer = setTimeout(update, 60000);
        return;
      }
      setBusy(true);
      fail("");
      try {
        const raws = keys.split(","),
          rows: Holding[] = [],
          entries: Entry[] = [];
        const start = Date.now() / 1000 - Number(days) * 86400;
        const balances = await request(() => getBalances(raws, false), active);
        const rate = isPortfolio ? await request(() => getRates(), active) : null;
        for (const raw of raws) {
          if (!live) return;
          const tokens = isPortfolio ? await request(() => getTokens(raw, false), active) : [];
          const nfts: NftInfo[] = [];
          if (isPortfolio) {
            let offset: number | null = 0;
            while (offset !== null && live) {
              const index: number = offset;
              if (index > 10000) throw Error("Список NFT превышает лимит API.");
              const p = await request(() => getAccountNfts(raw, false, index), active);
              nfts.push(...p.items);
              offset = p.next;
            }
          }
          rows.push({
            raw,
            balance: balances.get(raw)?.balance ?? null,
            tokens: tokens.filter((t) => t.verification !== "blacklist"),
            nfts,
          });
          if (isPortfolio) continue;
          const previous = historyByAddress.get(raw) ?? [];
          const history = await readActivity(raw, start, previous, active);
          if (!live) return;
          historyByAddress.set(raw, history);
          for (const event of history) entries.push({ raw, event });
        }
        if (!live) return;
        setHold(rows);
        setFeed(entries.sort((a, b) => b.event.time - a.event.time));
        if (rows.some((r) => r.balance === null)) setPoints([]);
        if (!rate && rows.every((r) => r.balance !== null))
          setPoints(
            series("GRAM:" + keys, {
              time: Date.now(),
              usd: rows.reduce((n, r) => n + Number(r.balance) / 1e9, 0),
            }),
          );
        if (rate) {
          setPrice(rate.usd);
          if (rows.every((r) => r.balance !== null)) {
            const usd = rows.reduce(
              (n, r) =>
                n +
                (Number(r.balance) / 1e9) * rate.usd +
                r.tokens.reduce((s, t) => s + tokenValue(t, "usd"), 0),
              0,
            );
            setPoints(series(keys, { time: Date.now(), usd }));
          }
        }
      } catch (e) {
        if (live) fail(errorText(e));
      } finally {
        if (live) {
          setBusy(false);
          timer = setTimeout(update, 60000);
        }
      }
    }
    void update();
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [keys, isPortfolio, enabled, days, refresh]);
  return { hold, feed, points, price, busy, error };
}
