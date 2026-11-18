/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE and LICENSING.md for details.
 */

import { Buffer } from "buffer";
import type { Cell } from "@ton/core";

export const MAX_BOC_BYTES = 64 * 1024;
export const MAX_BOC_NODES = 8192;

export type BocNode = {
  path: string;
  hash: string;
  depth: number;
  level: number;
  bitLength: number;
  bits: string;
  hex: string;
  refCount: number;
  refs: string[];
  exotic: boolean;
};

export type BocDocument = {
  roots: string[];
  nodes: BocNode[];
  byteLength: number;
  bocBase64: string;
};

export function decodeBocText(input: string, format: "base64" | "hex"): Uint8Array {
  const compact = input.trim().replace(/\s+/g, "");
  if (!compact) throw new Error("Введите BOC или выберите файл.");
  if (format === "hex") {
    if (compact.length % 2 !== 0 || !/^[0-9a-fA-F]+$/.test(compact))
      throw new Error("Некорректная hex-строка.");
    if (compact.length / 2 > MAX_BOC_BYTES) throw new Error("BOC превышает лимит 64 КиБ.");
    return Buffer.from(compact, "hex");
  }
  if (compact.length % 4 !== 0 ||
      !/^[A-Za-z0-9+/]*={0,2}$/.test(compact) ||
      compact.length * 3 / 4 > MAX_BOC_BYTES + 2)
    throw new Error("Некорректная или слишком большая Base64-строка.");
  const bytes = Buffer.from(compact, "base64");
  if (bytes.length > MAX_BOC_BYTES || bytes.toString("base64") !== compact)
    throw new Error("Некорректная или слишком большая Base64-строка.");
  return bytes;
}

export async function parseBocBytes(input: Uint8Array): Promise<BocDocument> {
  if (input.length === 0 || input.length > MAX_BOC_BYTES)
    throw new Error("BOC должен быть не больше 64 КиБ.");
  // ton-core needs Buffer during module initialization in the browser.
  (globalThis as typeof globalThis & { Buffer: typeof Buffer }).Buffer = Buffer;
  const { Cell } = await import("@ton/core");
  let roots: Cell[];
  try {
    roots = Cell.fromBoc(Buffer.from(input));
  } catch {
    throw new Error("Не удалось разобрать BOC: повреждённая структура или контрольная сумма.");
  }
  if (roots.length === 0 || roots.length > 128)
    throw new Error("Недопустимое количество корневых ячеек.");
  const nodes: BocNode[] = [];
  const pending = roots.map((cell, index) => ({ cell, path: String(index), depth: 0 }));
  for (let index = 0; index < pending.length; ++index) {
    if (index >= MAX_BOC_NODES)
      throw new Error("BOC содержит слишком много отображаемых ячеек.");
    const { cell, path, depth } = pending[index];
    if (depth > 128) throw new Error("Дерево BOC превышает допустимую глубину.");
    nodes.push({
      path,
      hash: cell.hash().toString("hex"),
      depth: cell.depth(),
      level: cell.level(),
      bitLength: cell.bits.length,
      bits: cell.bits.toString(),
      hex: Array.from({ length: Math.ceil(cell.bits.length / 8) }, (_, byteIndex) => {
        let byte = 0;
        for (let bit = 0; bit < 8; bit++) {
          const offset = byteIndex * 8 + bit;
          if (offset < cell.bits.length && cell.bits.at(offset)) byte |= 1 << (7 - bit);
        }
        return byte.toString(16).padStart(2, "0");
      }).join(""),
      refCount: cell.refs.length,
      refs: cell.refs.map((_, refIndex) => `${path}.${refIndex}`),
      exotic: cell.isExotic,
    });
    cell.refs.forEach((ref, refIndex) => pending.push({
      cell: ref, path: `${path}.${refIndex}`, depth: depth + 1,
    }));
  }
  return { roots: roots.map((root) => root.hash().toString("hex")), nodes,
    byteLength: input.length, bocBase64: Buffer.from(input).toString("base64") };
}
