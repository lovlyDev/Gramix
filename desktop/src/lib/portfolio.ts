/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

// Токены (jettons) адреса и стоимость портфеля: GRAM + токены по курсу OpenTonAPI.
import { platform } from "@platform";
import type { Fiat, Rates } from "./market";

export type Verification = "whitelist" | "none" | "blacklist";
export type Token = {
  master: string; name: string; symbol: string; decimals: number; image: string | null;
  balance: string; price: Record<Fiat, number> | null; diff24h: string; verification: Verification;
};

const obj = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const str = (value: unknown, max = 120) => typeof value === "string" ? value.slice(0, max) : "";
const num = (value: unknown) => typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
const safeImage = (url: string) => /^https:\/\/cache\.tonapi\.io\/imgproxy\/[A-Za-z0-9_\-/:.=]+$/.test(url) ? url : null;

export function normalizeJettons(value: unknown): Token[] {
  const balances = obj(value).balances;
  return (Array.isArray(balances) ? balances : []).map(obj).flatMap((item): Token[] => {
    const jetton = obj(item.jetton); const price = obj(obj(item.price).prices);
    const balance = String(item.balance ?? "0");
    if (!/^\d{1,80}$/.test(balance) || balance === "0") return [];
    const decimals = Number(jetton.decimals);
    const usd = num(price.USD); const rub = num(price.RUB);
    const verification = str(jetton.verification);
    return [{
      master: str(jetton.address), name: str(jetton.name) || "Токен", symbol: str(jetton.symbol, 16) || "?",
      decimals: Number.isInteger(decimals) && decimals >= 0 && decimals <= 30 ? decimals : 9,
      image: safeImage(str(jetton.image, 600)), balance,
      price: usd !== null && rub !== null ? { usd, rub } : null,
      diff24h: str(obj(obj(item.price).diff_24h).USD, 12).replace(/^(?:\u0432\u20ac\u2019|\u2212|-)/, "\u2212"),
      verification: verification === "whitelist" || verification === "blacklist" ? verification : "none",
    }];
  });
}

/** Количество токена в обычных единицах (с учётом decimals), как число для расчётов. */
export function tokenAmount(token: Token): number {
  const digits = token.balance.padStart(token.decimals + 1, "0");
  return Number(`${digits.slice(0, digits.length - token.decimals)}.${digits.slice(digits.length - token.decimals)}`);
}

export const tokenValue = (token: Token, fiat: Fiat) => token.price ? tokenAmount(token) * token.price[fiat] : 0;

const cache = new Map<string, { at: number; tokens: Token[] }>();
export async function getTokens(raw: string, testnet: boolean, force = false): Promise<Token[]> {
  const key = `${testnet}:${raw.toLowerCase()}`; const cached = cache.get(key);
  if (!force && cached && Date.now() - cached.at < 2 * 60_000) return cached.tokens;
  const tokens = normalizeJettons(await platform.fetchJettonsRaw(raw, testnet));
  cache.set(key, { at: Date.now(), tokens });
  return tokens;
}

/** Стоимость портфеля: GRAM по курсу + проверенные и обычные токены (спам не считается). */
export function portfolioValue(gramNano: string | null, tokens: Token[], rates: Rates | null, fiat: Fiat): number | null {
  if (!rates) return null;
  let total = 0;
  if (gramNano) { try { total += Number(BigInt(gramNano) / 1_000_000n) / 1000 * rates[fiat]; } catch { /* нет баланса */ } }
  for (const token of tokens) if (token.verification !== "blacklist") total += tokenValue(token, fiat);
  return total;
}
