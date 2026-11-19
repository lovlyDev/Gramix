/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

// Курс GRAM, история адреса и балансы списка адресов. Ответы OpenTonAPI разбираются здесь
// одинаково для сайта и приложения; курс кешируется, чтобы не упираться в лимит запросов.
import { useEffect, useState } from "react";
import { platform } from "@platform";
import { locale } from "./i18n";

export type Fiat = "usd" | "rub";
export type Rates = { usd: number; rub: number; diff24h: Record<Fiat, string>; receivedAt: number };
export type PricePoint = { time: number; price: number };

const obj = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const num = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? value : null;
const str = (value: unknown) => typeof value === "string" ? value : "";

export function normalizeRates(value: unknown): Rates {
  const ton = obj(obj(obj(value).rates).TON);
  const prices = obj(ton.prices); const diff = obj(ton.diff_24h);
  const usd = num(prices.USD); const rub = num(prices.RUB);
  if (usd === null || rub === null || usd <= 0 || rub <= 0) throw new Error("OpenTonAPI не вернул курс GRAM.");
  return { usd, rub, diff24h: { usd: str(diff.USD), rub: str(diff.RUB) }, receivedAt: Date.now() };
}

export function normalizeChart(value: unknown): PricePoint[] {
  const points = obj(value).points;
  if (!Array.isArray(points)) throw new Error("OpenTonAPI не вернул график цены.");
  return points.flatMap((point) => Array.isArray(point) && num(point[0]) !== null && num(point[1]) !== null
    ? [{ time: point[0] as number, price: point[1] as number }] : []).sort((a, b) => a.time - b.time);
}

// Кеш курса: 5 минут, один общий запрос для всех экранов.
const RATE_TTL = 5 * 60_000;
let ratesCache: Rates | null = null;
let ratesPending: Promise<Rates> | null = null;
const listeners = new Set<(rates: Rates) => void>();
export function getRates(force = false): Promise<Rates> {
  if (!force && ratesCache && Date.now() - ratesCache.receivedAt < RATE_TTL) return Promise.resolve(ratesCache);
  ratesPending ??= platform.fetchRatesRaw().then(normalizeRates).then((rates) => {
    ratesCache = rates; listeners.forEach((listener) => listener(rates)); return rates;
  }).finally(() => { ratesPending = null; });
  return ratesPending;
}

const chartCache = new Map<string, { at: number; points: PricePoint[] }>();
export async function getPriceChart(currency: Fiat, days: number): Promise<PricePoint[]> {
  const key = `${currency}:${days}`; const cached = chartCache.get(key);
  if (cached && Date.now() - cached.at < RATE_TTL) return cached.points;
  const points = normalizeChart(await platform.fetchRatesChartRaw(currency, days));
  chartCache.set(key, { at: Date.now(), points });
  return points;
}

export const FIAT_KEY = "gramix.ui.fiat";
export function readFiat(): Fiat {
  try { return localStorage.getItem(FIAT_KEY) === "usd" ? "usd" : "rub"; } catch { return "rub"; }
}

/** Курс для подписи у баланса. Пока курс не загружен — null, интерфейс просто не показывает пересчёт. */
export function useRates(enabled = true) {
  const [rates, setRates] = useState<Rates | null>(ratesCache);
  const [fiat, setFiat] = useState<Fiat>(readFiat);
  useEffect(() => {
    const onRates = (value: Rates) => setRates(value);
    const onFiat = () => setFiat(readFiat());
    listeners.add(onRates);
    window.addEventListener("gramix:fiat", onFiat);
    if (enabled) void getRates().then(setRates).catch(() => undefined);
    return () => { listeners.delete(onRates); window.removeEventListener("gramix:fiat", onFiat); };
  }, [enabled]);
  return { rates, fiat };
}

export function setFiat(fiat: Fiat) {
  try { localStorage.setItem(FIAT_KEY, fiat); } catch { /* приватный режим */ }
  window.dispatchEvent(new Event("gramix:fiat"));
}

const fiatFormat = { usd: new Intl.NumberFormat(locale, { style: "currency", currency: "USD", maximumFractionDigits: 2 }),
  rub: new Intl.NumberFormat(locale, { style: "currency", currency: "RUB", maximumFractionDigits: 2 }) };
export const formatFiatValue = (value: number, fiat: Fiat) => fiatFormat[fiat].format(value);

/** «≈ 1 234,56 ₽» для суммы в нанограммах. */
export function fiatOf(nano: string | bigint | null | undefined, rates: Rates | null, fiat: Fiat): string {
  if (!rates || nano === null || nano === undefined || nano === "") return "";
  let value: bigint;
  try { value = BigInt(nano); } catch { return ""; }
  const grams = Number(value / 1_000_000n) / 1000;
  const amount = Math.abs(grams * rates[fiat]);
  if (amount < 0.01) return "";
  return `≈ ${formatFiatValue(grams * rates[fiat], fiat)}`;
}

// ───── История адреса ─────

export type Party = { raw: string; name: string };
export type HistoryAction = {
  type: string; ok: boolean; title: string; value: string;
  direction: "in" | "out" | "self" | "other"; amountNano: string | null; counterparty: Party | null; comment: string;
  /** raw-адрес NFT для переводов и покупок NFT. */
  nft: string | null;
};
export type HistoryEvent = { id: string; time: number; lt: string; pending: boolean; scam: boolean; tx: string | null; actions: HistoryAction[] };
export type HistoryPage = { events: HistoryEvent[]; next: string | null };

const party = (value: unknown): Party | null => {
  const item = obj(value); const raw = str(item.address);
  return raw ? { raw, name: str(item.name) } : null;
};

export function normalizeEvents(value: unknown, account: string): HistoryPage {
  const data = obj(value);
  const events = Array.isArray(data.events) ? data.events : [];
  const self = account.toLowerCase();
  return {
    events: events.map((entry) => {
      const event = obj(entry);
      const actions = (Array.isArray(event.actions) ? event.actions : []).map((raw): HistoryAction => {
        const action = obj(raw); const type = str(action.type); const body = obj(action[type]);
        const preview = obj(action.simple_preview);
        const sender = party(body.sender); const recipient = party(body.recipient);
        const from = sender?.raw.toLowerCase(); const to = recipient?.raw.toLowerCase();
        const direction = from === self && to === self ? "self" : to === self ? "in" : from === self ? "out" : "other";
        const amount = typeof body.amount === "number" || typeof body.amount === "string" ? String(body.amount) : null;
        return {
          type, ok: str(action.status) !== "failed", title: str(preview.description) || type, value: str(preview.value),
          direction, amountNano: type === "TonTransfer" ? amount : null,
          counterparty: direction === "in" ? sender : direction === "out" ? recipient : sender ?? recipient,
          comment: str(body.comment).slice(0, 500),
          nft: type.startsWith("Nft") ? (typeof body.nft === "string" ? body.nft : str(obj(body.nft).address)) || null : null,
        };
      });
      const firstAction = obj(Array.isArray(event.actions) ? event.actions[0] : null);
      const base = Array.isArray(firstAction.base_transactions) ? str(firstAction.base_transactions[0]) : "";
      return { id: str(event.event_id), time: num(event.timestamp) ?? 0, lt: String(event.lt ?? ""),
        pending: event.in_progress === true, scam: event.is_scam === true, tx: /^[0-9a-f]{64}$/i.test(base) ? base : null, actions };
    }).filter((event) => event.id),
    next: data.next_from ? String(data.next_from) : null,
  };
}

export async function getHistory(raw: string, testnet: boolean, beforeLt?: string): Promise<HistoryPage> {
  return normalizeEvents(await platform.fetchAccountEventsRaw(raw, testnet, beforeLt, 20), raw);
}

// ───── Балансы списка адресов ─────

export type BulkAccount = { raw: string; balance: string; status: string };
export async function getBalances(raws: string[], testnet: boolean): Promise<Map<string, BulkAccount>> {
  const result = new Map<string, BulkAccount>();
  for (let index = 0; index < raws.length; index += 100) {
    const data = obj(await platform.fetchAccountsBulkRaw(raws.slice(index, index + 100), testnet));
    for (const item of Array.isArray(data.accounts) ? data.accounts : []) {
      const account = obj(item); const raw = str(account.address).toLowerCase();
      if (raw) result.set(raw, { raw, balance: String(account.balance ?? "0"), status: str(account.status) });
    }
  }
  return result;
}

/** Короткая запись адреса для списков: имя, если есть, иначе UQ…/EQ… с многоточием. */
export async function shortAddress(raw: string, testnet: boolean): Promise<string> {
  try {
    const { Address } = await import("@ton/core");
    const friendly = Address.parseRaw(raw).toString({ bounceable: false, testOnly: testnet });
    return `${friendly.slice(0, 6)}…${friendly.slice(-6)}`;
  } catch { return `${raw.slice(0, 8)}…${raw.slice(-6)}`; }
}
