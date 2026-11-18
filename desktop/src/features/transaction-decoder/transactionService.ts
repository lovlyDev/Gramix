/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE and LICENSING.md for details.
 */

import { Buffer } from "buffer";
import type { Message } from "@ton/core";
import { parseBocBytes } from "../boc-explorer/bocService";

export type DecodedMessage = {
  type: string;
  source: string | null;
  destination: string | null;
  valueNanoton: string | null;
  opcode: string | null;
  knownOperation: string | null;
  comment: string | null;
  jettonAmount: string | null;
  jettonDestination: string | null;
  bodyBocBase64: string;
};

export type DecodedTransaction = {
  hash: string;
  accountHash: string;
  logicalTime: string;
  unixTime: number;
  oldStatus: string;
  endStatus: string;
  type: string;
  aborted: boolean | null;
  computeSuccess: boolean | null;
  computeExitCode: number | null;
  gasUsed: string | null;
  gasFeesNanoton: string | null;
  actionResultCode: number | null;
  totalFeesNanoton: string;
  inMessage: DecodedMessage | null;
  outMessages: DecodedMessage[];
  rawBocBase64: string;
};

function decodeMessage(message: Message): DecodedMessage {
  const info = message.info;
  const output: DecodedMessage = {
    type: info.type,
    source: info.src?.toString() ?? null,
    destination: info.dest?.toString() ?? null,
    valueNanoton: info.type === "internal" ? info.value.coins.toString() : null,
    opcode: null,
    knownOperation: null,
    comment: null,
    jettonAmount: null,
    jettonDestination: null,
    bodyBocBase64: message.body.toBoc().toString("base64"),
  };
  try {
    const slice = message.body.beginParse();
    if (slice.remainingBits < 32) return output;
    const opcode = slice.loadUint(32);
    output.opcode = `0x${opcode.toString(16).padStart(8, "0")}`;
    if (opcode === 0) {
      output.knownOperation = "Текстовый комментарий";
      output.comment = slice.loadStringTail();
    } else if (opcode === 0x0f8a7ea5) {
      // TEP-74 transfer. Amount uses Jetton base units; decimals require token metadata.
      slice.loadUintBig(64);
      const amount = slice.loadCoins();
      const destination = slice.loadAddress();
      slice.loadAddress();
      slice.loadMaybeRef();
      slice.loadCoins();
      if (slice.loadBit()) slice.loadRef();
      output.knownOperation = "Jetton transfer (TEP-74)";
      output.jettonAmount = amount.toString();
      output.jettonDestination = destination?.toString() ?? null;
    } else if (opcode === 0x7362d09c) {
      slice.loadUintBig(64);
      const amount = slice.loadCoins();
      const sender = slice.loadAddress();
      if (slice.loadBit()) slice.loadRef();
      output.knownOperation = "Jetton transfer notification (TEP-74)";
      output.jettonAmount = amount.toString();
      output.jettonDestination = sender?.toString() ?? null;
    }
  } catch {
    // Preserve raw body and opcode when a claimed standard payload is malformed.
    output.knownOperation = null;
    output.comment = null;
    output.jettonAmount = null;
    output.jettonDestination = null;
  }
  return output;
}

export async function decodeTransactionBoc(bytes: Uint8Array): Promise<DecodedTransaction> {
  await parseBocBytes(bytes);
  const { Cell, loadTransaction } = await import("@ton/core");
  let root;
  try {
    const roots = Cell.fromBoc(Buffer.from(bytes));
    if (roots.length !== 1) throw new Error("multiple roots");
    root = roots[0];
    const tx = loadTransaction(root.beginParse());
    const compute = "computePhase" in tx.description ? tx.description.computePhase : null;
    const action = "actionPhase" in tx.description ? tx.description.actionPhase : null;
    return {
      hash: tx.hash().toString("hex"),
      accountHash: tx.address.toString(16).padStart(64, "0"),
      logicalTime: tx.lt.toString(),
      unixTime: tx.now,
      oldStatus: tx.oldStatus,
      endStatus: tx.endStatus,
      type: tx.description.type,
      aborted: "aborted" in tx.description ? tx.description.aborted : null,
      computeSuccess: compute?.type === "vm" ? compute.success : null,
      computeExitCode: compute?.type === "vm" ? compute.exitCode : null,
      gasUsed: compute?.type === "vm" ? compute.gasUsed.toString() : null,
      gasFeesNanoton: compute?.type === "vm" ? compute.gasFees.toString() : null,
      actionResultCode: action?.resultCode ?? null,
      totalFeesNanoton: tx.totalFees.coins.toString(),
      inMessage: tx.inMessage ? decodeMessage(tx.inMessage) : null,
      outMessages: tx.outMessages.values().map(decodeMessage),
      rawBocBase64: Buffer.from(bytes).toString("base64"),
    };
  } catch {
    throw new Error("BOC не содержит корректную TON-транзакцию.");
  }
}
