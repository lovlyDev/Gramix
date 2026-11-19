/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

// Домены .ton и юзернеймы Telegram (@name, name.t.me, t.me/name) → адрес кошелька.
// Сначала берётся DNS-запись wallet; если её нет, — владелец NFT домена.
import { platform } from "@platform";

export type ResolvedDomain = { domain: string; raw: string; via: "wallet" | "owner"; name: string };

const obj = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const rawPattern = /^-?\d{1,3}:[0-9a-f]{64}$/i;

/** Привести ввод к имени домена или вернуть null, если это не домен. */
export function domainFromInput(input: string): string | null {
  const value = input.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const telegram = /^(?:@|t\.me\/)([a-z0-9_]{4,32})$/.exec(value);
  if (telegram) return `${telegram[1]}.t.me`;
  if (/^(?:[a-z0-9_-]+\.)*[a-z0-9_-]+\.(?:ton|t\.me)$/.test(value) && value.length <= 127) return value;
  return null;
}

const cache = new Map<string, Promise<ResolvedDomain>>();
export function resolveDomain(input: string, testnet = false): Promise<ResolvedDomain> {
  const domain = domainFromInput(input);
  if (!domain) return Promise.reject(new Error("Это не домен .ton и не юзернейм Telegram."));
  const key = `${testnet}:${domain}`;
  let pending = cache.get(key);
  if (!pending) {
    pending = platform.resolveDomainRaw(domain, testnet).then((value) => {
      const data = obj(value);
      const wallet = obj(obj(data.resolve).wallet);
      const walletRaw = String(wallet.address ?? "");
      const name = String(obj(wallet.account).name ?? "");
      if (rawPattern.test(walletRaw)) return { domain, raw: walletRaw.toLowerCase(), via: "wallet" as const, name };
      const owner = obj(obj(obj(data.info).item).owner);
      const ownerRaw = String(owner.address ?? "");
      if (rawPattern.test(ownerRaw)) return { domain, raw: ownerRaw.toLowerCase(), via: "owner" as const, name: String(owner.name ?? "") };
      throw new Error(`У ${domain} нет привязанного кошелька и владельца.`);
    });
    pending.catch(() => cache.delete(key));
    cache.set(key, pending);
  }
  return pending;
}
