/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

import { describe, expect, it } from "vitest";
import { beginCell, internal, storeMessageRelaxed, toNano, Address } from "@ton/core";
import { NotTransactionError, decodeTransactionBoc } from "./transactionService";
import { decodeBocText } from "../boc-explorer/bocService";
import fixture from "./fixtures/reference-transaction.b64?raw";

// Файл gramix.boc, сохранённый на сайте из BOC Explorer: корректный BOC, но не транзакция.
const exportedBoc = "b5ee9c720101030100ba00015eb508e342c591f4e3caddf325dfbe3940abd0139ca011e78f4821d6bb95cadd5e00000001400000001abf4fb840012c010105b64f100200ff04" + "00".repeat(127) + "01";

describe("Transaction Decoder", () => {
  it("decodes a public reference transaction from ton-core", async () => {
    const tx = await decodeTransactionBoc(decodeBocText(fixture, "base64"));
    expect(tx.hash).toBe("e9fb666fd65e2d70479c5a2c2ec412ad08d68fcdf57676b3baa34aada3c95db8");
    expect(tx.logicalTime).toBe("22901965000001");
    expect(tx.rawBocBase64).toBe(fixture);
    expect(tx.totalFeesNanoton).toBe("4891331");
    expect(tx.computeExitCode).toBe(0);
    expect(tx.gasUsed).toBe("2994");
    expect(tx.gasFeesNanoton).toBe("2994000");
    expect(tx.actionResultCode).toBe(0);
    expect(tx.outMessages).toBeInstanceOf(Array);
  });

  it("rejects a valid BOC that is not a transaction", async () => {
    await expect(decodeTransactionBoc(beginCell().endCell().toBoc())).rejects.toThrow("не транзакция");
  });
});

describe("BOC в разборе транзакций", () => {
  it("BOC не транзакции даёт подсказку и сохраняет байты для BOC Explorer", async () => {
    const bytes = decodeBocText(exportedBoc, "hex");
    const error = await decodeTransactionBoc(bytes).catch((cause) => cause);
    expect(error).toBeInstanceOf(NotTransactionError);
    expect(error.message).toMatch(/не транзакция/);
    expect(Buffer.from(error.base64, "base64").toString("hex")).toBe(exportedBoc);
  });

  it("для сообщения предлагает поиск транзакции по хешу сообщения", async () => {
    const message = beginCell().store(storeMessageRelaxed(internal({
      to: Address.parse("EQBvW8Z5huBkMJYdnfAEM5JqTNkuWX3diqYENkWsIL0XggGG"), value: toNano("1"), bounce: false,
    }))).endCell();
    const error = await decodeTransactionBoc(new Uint8Array(message.toBoc())).catch((cause) => cause);
    expect(error).toBeInstanceOf(NotTransactionError);
    expect(error.message).toMatch(/сообщение/);
    expect(error.messageHash).toBe(message.hash().toString("hex"));
  });
});
