/*
 * Copyright (C) 2026 [COPYRIGHT HOLDER].
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of VANTIX.
 *
 * VANTIX is dual-licensed under the GNU Affero General
 * Public License v3.0 and a separate commercial license.
 *
 * See LICENSE and LICENSING.md for details.
 */

import { Buffer } from "buffer";
import { decodeBocText, parseBocBytes } from "../boc-explorer/bocService";
import type { Cell } from "@ton/core";

export type ContractInput = { code: Cell; data: Cell };
export type ContractCandidate = {
  nonce: string;
  raw: string;
  bounceable: string;
  nonBounceable: string;
  codeBocBase64: string;
  dataBocBase64: string;
  stateInitBocBase64: string;
};

export async function parseContractInput(codeHex: string, dataHex: string,
  format: "hex" | "base64" = "hex"): Promise<ContractInput> {
  const codeBytes = decodeBocText(codeHex, format);
  const dataBytes = decodeBocText(dataHex, format);
  const [codeDocument, dataDocument] = await Promise.all([
    parseBocBytes(codeBytes), parseBocBytes(dataBytes),
  ]);
  if (codeDocument.roots.length !== 1 || dataDocument.roots.length !== 1)
    throw new Error("Код и данные должны содержать ровно по одной корневой ячейке.");
  (globalThis as typeof globalThis & { Buffer: typeof Buffer }).Buffer = Buffer;
  const { Cell } = await import("@ton/core");
  const code = Cell.fromBoc(Buffer.from(codeBytes))[0];
  const data = Cell.fromBoc(Buffer.from(dataBytes))[0];
  if (data.isExotic || data.bits.length < 64)
    throw new Error("Корневая ячейка данных должна иметь обычный 64-битный параметр в начале.");
  return { code, data };
}

export async function deriveContractCandidate(input: ContractInput, nonce: bigint): Promise<ContractCandidate> {
  if (nonce < 0n || nonce > 0xffffffffffffffffn) throw new Error("Nonce вне диапазона uint64.");
  (globalThis as typeof globalThis & { Buffer: typeof Buffer }).Buffer = Buffer;
  const { beginCell, contractAddress, storeStateInit } = await import("@ton/core");
  const rest = input.data.beginParse();
  rest.skip(64);
  const data = beginCell().storeUint(nonce, 64).storeSlice(rest).endCell();
  const init = { code: input.code, data };
  const address = contractAddress(0, init);
  const stateInit = beginCell().store(storeStateInit(init)).endCell();
  return {
    nonce: nonce.toString(), raw: address.toRawString(),
    bounceable: address.toString({ bounceable: true, urlSafe: true }),
    nonBounceable: address.toString({ bounceable: false, urlSafe: true }),
    codeBocBase64: input.code.toBoc().toString("base64"),
    dataBocBase64: data.toBoc().toString("base64"),
    stateInitBocBase64: stateInit.toBoc().toString("base64"),
  };
}

export async function verifyContractCandidate(input: ContractInput, candidate: ContractCandidate): Promise<boolean> {
  const derived = await deriveContractCandidate(input, BigInt(candidate.nonce));
  return derived.raw === candidate.raw && derived.bounceable === candidate.bounceable &&
    derived.nonBounceable === candidate.nonBounceable &&
    derived.dataBocBase64 === candidate.dataBocBase64 &&
    derived.stateInitBocBase64 === candidate.stateInitBocBase64;
}
