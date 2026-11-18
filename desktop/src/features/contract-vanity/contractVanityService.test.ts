/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE and LICENSING.md for details.
 */

import { describe, expect, it } from "vitest";
import { beginCell } from "@ton/core";
import { deriveContractCandidate, parseContractInput, verifyContractCandidate } from "./contractVanityService";

describe("Contract Vanity StateInit", () => {
  it("changes only the reserved first uint64 and independently verifies the exported StateInit", async () => {
    const code = beginCell().storeUint(0x1234, 16).endCell();
    const data = beginCell().storeUint(0, 64).storeUint(77, 16)
      .storeRef(beginCell().storeBit(1).endCell()).endCell();
    const input = await parseContractInput(code.toBoc().toString("hex"), data.toBoc().toString("hex"));
    const base64Input = await parseContractInput(code.toBoc().toString("base64"),
      data.toBoc().toString("base64"), "base64");
    const first = await deriveContractCandidate(input, 0n);
    const second = await deriveContractCandidate(input, 1n);
    expect(first.raw).not.toBe(second.raw);
    expect((await deriveContractCandidate(base64Input, 0n)).raw).toBe(first.raw);
    expect(await verifyContractCandidate(input, second)).toBe(true);
    expect(await verifyContractCandidate(input, { ...second, raw: first.raw })).toBe(false);
  });
});
