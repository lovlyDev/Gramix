/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

import { describe, expect, it } from "vitest";
import fixture from "./fixtures/reference-transaction.b64?raw";
import { decodeBocText } from "../boc-explorer/bocService";
import { decodeTransactionBoc } from "./transactionService";

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
    const { beginCell } = await import("@ton/core");
    await expect(decodeTransactionBoc(beginCell().endCell().toBoc())).rejects.toThrow(
      "корректную GRAM-транзакцию");
  });
});
