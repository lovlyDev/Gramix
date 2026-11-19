/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

// Адресная книга: только публичные адреса и подписи, хранится на этом устройстве.
// Наблюдение проверяет балансы отмеченных адресов одним запросом и сообщает об изменениях.
import { useSyncExternalStore } from "react";
import { getBalances } from "./market";
import { getTokens, tokenValue } from "./portfolio";

export type BookEntry = {
  raw: string; address: string; label: string; testnet: boolean; watch: boolean;
  addedAt: number; balance: string | null; status: string | null; checkedAt: number | null;
  /** Стоимость токенов (без GRAM и спама) на момент последнего полного обновления. */
  tokens: { usd: number; rub: number } | null;
};
const KEY = "gramix.addressBook.v1";
const MAX_ENTRIES = 200;
const rawPattern = /^-?\d{1,3}:[0-9a-f]{64}$/;

function load(): BookEntry[] {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    if (!Array.isArray(value)) return [];
    return value.filter((item) => item && typeof item.raw === "string" && rawPattern.test(item.raw)
      && typeof item.address === "string").slice(0, MAX_ENTRIES).map((item) => ({
      raw: item.raw, address: item.address, label: String(item.label ?? "").slice(0, 80), testnet: item.testnet === true,
      watch: item.watch === true, addedAt: Number(item.addedAt) || Date.now(),
      balance: typeof item.balance === "string" ? item.balance : null, status: typeof item.status === "string" ? item.status : null,
      checkedAt: Number(item.checkedAt) || null,
      tokens: item.tokens && Number.isFinite(item.tokens.usd) && Number.isFinite(item.tokens.rub) ? { usd: item.tokens.usd, rub: item.tokens.rub } : null,
    }));
  } catch { return []; }
}

let entries = load();
const listeners = new Set<() => void>();
function commit(next: BookEntry[]) {
  entries = next;
  try { localStorage.setItem(KEY, JSON.stringify(entries)); } catch { /* приватный режим */ }
  listeners.forEach((listener) => listener());
}
const subscribe = (listener: () => void) => { listeners.add(listener); return () => listeners.delete(listener); };
window.addEventListener("storage", (event) => { if (event.key === KEY) { entries = load(); listeners.forEach((listener) => listener()); } });

export const useAddressBook = () => useSyncExternalStore(subscribe, () => entries);
export const bookEntry = (raw: string, testnet: boolean) =>
  entries.find((item) => item.raw === raw.toLowerCase() && item.testnet === testnet) ?? null;

export const addressBook = {
  add(entry: { raw: string; address: string; label: string; testnet: boolean }) {
    const raw = entry.raw.toLowerCase();
    if (!rawPattern.test(raw)) throw new Error("Некорректный адрес.");
    if (bookEntry(raw, entry.testnet)) throw new Error("Этот адрес уже есть в книге.");
    if (entries.length >= MAX_ENTRIES) throw new Error(`В книге может быть не больше ${MAX_ENTRIES} адресов.`);
    commit([{ raw, address: entry.address, label: entry.label.trim().slice(0, 80), testnet: entry.testnet, watch: false,
      addedAt: Date.now(), balance: null, status: null, checkedAt: null, tokens: null }, ...entries]);
  },
  update(raw: string, testnet: boolean, patch: Partial<Pick<BookEntry, "label" | "watch">>) {
    commit(entries.map((item) => item.raw === raw && item.testnet === testnet
      ? { ...item, ...patch, label: (patch.label ?? item.label).slice(0, 80) } : item));
  },
  hasWatched: () => entries.some((item) => item.watch),
  remove(raw: string, testnet: boolean) { commit(entries.filter((item) => !(item.raw === raw && item.testnet === testnet))); },
  /** Обновить балансы. Возвращает адреса, у которых баланс изменился с прошлой проверки. */
  async refresh(onlyWatched = false): Promise<{ entry: BookEntry; previous: string }[]> {
    const fetched = new Map<string, { balance: string; status: string }>();
    for (const testnet of [false, true]) {
      const targets = entries.filter((item) => item.testnet === testnet && (!onlyWatched || item.watch));
      if (!targets.length) continue;
      const balances = await getBalances(targets.map((item) => item.raw), testnet);
      for (const item of targets) {
        const account = balances.get(item.raw);
        fetched.set(`${testnet}:${item.raw}`, { balance: account?.balance ?? "0", status: account?.status ?? "nonexist" });
      }
    }
    // Полное обновление считает и токены: по запросу на адрес, поэтому не в фоновом наблюдении.
    const tokenValues = new Map<string, { usd: number; rub: number }>();
    if (!onlyWatched) for (const item of entries) {
      try {
        const list = (await getTokens(item.raw, item.testnet, true)).filter((token) => token.verification !== "blacklist");
        tokenValues.set(`${item.testnet}:${item.raw}`, { usd: list.reduce((sum, token) => sum + tokenValue(token, "usd"), 0),
          rub: list.reduce((sum, token) => sum + tokenValue(token, "rub"), 0) });
      } catch { /* токены не загрузились — оставим прошлое значение */ }
    }
    // Сливаем с текущим списком: пока шёл запрос, адреса могли добавить или удалить.
    const changed: { entry: BookEntry; previous: string }[] = [];
    commit(entries.map((item) => {
      const value = fetched.get(`${item.testnet}:${item.raw}`);
      if (!value) return item;
      const updated = { ...item, ...value, checkedAt: Date.now(), tokens: tokenValues.get(`${item.testnet}:${item.raw}`) ?? item.tokens };
      if (item.balance !== null && item.balance !== value.balance) changed.push({ entry: updated, previous: item.balance });
      return updated;
    }));
    return changed;
  },
};
