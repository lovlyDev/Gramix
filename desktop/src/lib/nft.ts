/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

// Сведения об NFT из OpenTonAPI для карточек в истории адреса. Картинки берутся только из
// прокси cache.tonapi.io (сжатые превью), ссылки и кнопки из метаданных не показываются:
// в спам-NFT это частый способ фишинга.
import { platform } from "@platform";

export type NftTrust = "whitelist" | "graylist" | "blacklist" | "none";
export type NftInfo = {
  raw: string; name: string; collection: string; collectionRaw: string | null; description: string;
  thumb: string | null; image: string | null; trust: NftTrust; verified: boolean;
  attributes: { trait: string; value: string }[]; index: string;
  /** Юзернейм или номер Telegram с Fragment: своя картинка с именем, без голографии. */
  telegram: boolean;
  /** Домен TON DNS: картинки нет, карточка рисуется самим Gramix. */
  dns: boolean;
  /** Ни названия, ни коллекции: почти всегда рассылка мусора, прячется вместе со спамом. */
  junk: boolean;
};

// Коллекции Fragment: Telegram Usernames и Anonymous Telegram Numbers.
const TELEGRAM_COLLECTIONS = new Set([
  "0:80d78a35f955a14b679faa887ff4cd5bfc0f43b4a4eea2a7e6927f3701b273c2",
  "0:0e41dc1dc3c9067ed24248580e12b3359818d83dee0304fabcf80845eafafdb2",
]);
const DNS_COLLECTION = "0:b774d95eb20543f186c06b371ab88ad704f7e256130caf96189368a7d0cb6ccf";

const obj = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const str = (value: unknown, max = 200) => typeof value === "string" ? value.slice(0, max) : "";
const safeImage = (url: string) => /^https:\/\/cache\.tonapi\.io\/imgproxy\/[A-Za-z0-9_\-/:.=]+$/.test(url) ? url : null;

export function normalizeNft(value: unknown, raw: string): NftInfo {
  const data = obj(value); const meta = obj(data.metadata); const collection = obj(data.collection);
  const previews = Array.isArray(data.previews) ? data.previews.map(obj) : [];
  const preview = (resolution: string) => safeImage(str(previews.find((item) => item.resolution === resolution)?.url, 600));
  const trust = str(data.trust) as NftTrust;
  return {
    raw, index: String(data.index ?? ""),
    name: str(meta.name, 120) || "Без названия",
    collection: str(collection.name, 120),
    collectionRaw: str(collection.address) || null,
    description: str(meta.description, 600),
    thumb: preview("100x100"), image: preview("500x500") ?? preview("1500x1500"),
    trust: ["whitelist", "graylist", "blacklist"].includes(trust) ? trust : "none",
    verified: data.verified === true,
    telegram: TELEGRAM_COLLECTIONS.has(str(collection.address).toLowerCase()),
    dns: str(collection.address).toLowerCase() === DNS_COLLECTION,
    junk: !str(meta.name) && !str(collection.name),
    attributes: (Array.isArray(meta.attributes) ? meta.attributes : []).slice(0, 24).map(obj)
      .map((item) => ({ trait: str(item.trait_type, 60), value: str(typeof item.value === "number" ? String(item.value) : item.value, 80) }))
      .filter((item) => item.trait || item.value),
  };
}

// Запросы по одному: у анонимного tonapi строгий лимит, а NFT в истории бывает много.
const cache = new Map<string, Promise<NftInfo>>();
let queue: Promise<unknown> = Promise.resolve();
export function getNft(raw: string, testnet: boolean): Promise<NftInfo> {
  const key = `${testnet}:${raw.toLowerCase()}`;
  let pending = cache.get(key);
  if (!pending) {
    pending = queue.then(() => platform.fetchNftRaw(raw, testnet)).then((value) => normalizeNft(value, raw));
    queue = pending.catch(() => undefined);
    pending.catch(() => cache.delete(key));
    cache.set(key, pending);
  }
  return pending;
}

export type NftPage = { items: NftInfo[]; next: number | null };
/** NFT, которыми владеет адрес, страницами по 48. Заодно заполняет кеш карточек. */
export async function getAccountNfts(raw: string, testnet: boolean, offset = 0): Promise<NftPage> {
  const limit = 48;
  const data = obj(await platform.fetchAccountNftsRaw(raw, testnet, offset, limit));
  const list = Array.isArray(data.nft_items) ? data.nft_items : [];
  const items = list.map((item) => normalizeNft(item, String(obj(item).address ?? ""))).filter((item) => item.raw);
  for (const item of items) cache.set(`${testnet}:${item.raw.toLowerCase()}`, Promise.resolve(item));
  return { items, next: list.length === limit ? offset + limit : null };
}
