/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE and LICENSING.md for details.
 */

// Распознавание адресов, хэшей, BOC и ссылок на эксплореры, а также пути сайта.
import { Address } from "@ton/core";

export type LinkTool = "address-inspector" | "transaction-decoder" | "boc-explorer" | "contract-inspector";
export type LinkTarget = { tool: LinkTool; event: string; detail: unknown; value: string; label: string;
  kind: "address" | "transaction" | "boc" | "contract"; path: string };

const rawAddress = /^-?\d{1,3}:[0-9a-fA-F]{64}$/;
const hexHash = /^[0-9a-fA-F]{64}$/;

export function isAddress(value: string) {
  if (rawAddress.test(value)) return true;
  if (!/^[A-Za-z0-9_+/-]{48}$/.test(value)) return false;
  try { Address.parseFriendly(value); return true; } catch { return false; }
}

/** 64 hex-символа или 32 байта в base64/base64url (так хэши показывают некоторые эксплореры). */
export function normalizeHash(value: string): string | null {
  if (hexHash.test(value)) return value.toLowerCase();
  if (!/^[A-Za-z0-9_+/-]{43}=?$/.test(value)) return null;
  try {
    const binary = atob(value.replace(/-/g, "+").replace(/_/g, "/").padEnd(44, "="));
    if (binary.length !== 32) return null;
    return [...binary].map((char) => char.charCodeAt(0).toString(16).padStart(2, "0")).join("");
  } catch { return null; }
}

const addressTarget = (value: string): LinkTarget => ({ tool: "address-inspector", event: "gramix:inspect-address",
  detail: value, value, label: "Проверить адрес", kind: "address", path: `/address/${value}` });
const contractTarget = (value: string, testnet = false): LinkTarget => ({ tool: "contract-inspector",
  event: "gramix:contract-address", detail: { address: value, testnet }, value, label: "Открыть контракт",
  kind: "contract", path: `/contract/${value}` });
const transactionTarget = (hash: string): LinkTarget => ({ tool: "transaction-decoder", event: "gramix:transaction-id",
  detail: hash, value: hash, label: "Разобрать транзакцию", kind: "transaction", path: `/tx/${hash}` });

function fromUrl(value: string): LinkTarget | null {
  let url: URL;
  try { url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`); } catch { return null; }
  if (!url.hostname.includes(".")) return null;
  const segments = url.pathname.split("/").map((part) => decodeURIComponent(part)).filter(Boolean);
  const params = ["address", "account", "addr", "hash", "tx", "transaction"]
    .map((name) => url.searchParams.get(name)).filter((item): item is string => Boolean(item));
  const kindHint = segments[0]?.toLowerCase() ?? "";
  for (const token of [...segments.slice().reverse(), ...params]) {
    const clean = token.split(/[?#]/)[0];
    if (isAddress(clean)) return /contract|jetton|nft|collection/.test(kindHint)
      ? contractTarget(clean, url.hostname.startsWith("testnet")) : addressTarget(clean);
    // tonscan показывает транзакцию как «lt:hash:account»; берём часть с хэшем.
    for (const part of clean.split(":")) {
      const hash = normalizeHash(part);
      if (hash && (/^(tx|transaction|transactions|tr)$/.test(kindHint) || hexHash.test(part))) return transactionTarget(hash);
    }
  }
  return null;
}

/** Вставленная строка → инструмент. Понимает адрес, хэш, BOC и ссылки на эксплореры. */
export function parseValue(raw: string): LinkTarget | null {
  const value = raw.trim();
  if (!value) return null;
  if (isAddress(value)) return addressTarget(value);
  const hash = normalizeHash(value);
  if (hash) return transactionTarget(hash);
  if (/^te6cc[A-Za-z0-9+/=]+$/.test(value)) return { tool: "boc-explorer", event: "gramix:open-boc", detail: value,
    value, label: "Открыть BOC", kind: "boc", path: "/boc-explorer" };
  if (/^(https?:\/\/)?[a-z0-9.-]+\.[a-z]{2,}\//i.test(value)) return fromUrl(value);
  return null;
}

/** Путь сайта → экран и, если есть, объект для открытия. */
export function parsePath(pathname: string): { workspace: string; target: LinkTarget | null } {
  const segments = pathname.split("/").map((part) => decodeURIComponent(part)).filter(Boolean);
  if (!segments.length) return { workspace: "overview", target: null };
  const [head, value = ""] = segments;
  if (["address", "account", "wallet"].includes(head) && isAddress(value)) return { workspace: "address-inspector", target: addressTarget(value) };
  if (head === "contract" && isAddress(value)) return { workspace: "contract-inspector", target: contractTarget(value) };
  if (["tx", "transaction", "transactions"].includes(head)) {
    const hash = normalizeHash(value);
    return { workspace: "transaction-decoder", target: hash ? transactionTarget(hash) : null };
  }
  if (segments.length === 1 && isAddress(head)) return { workspace: "address-inspector", target: addressTarget(head) };
  return { workspace: head, target: null };
}

export const pathFor = (workspace: string) => workspace === "overview" ? "/" : `/${workspace}`;
