/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

import { describe, expect, it } from "vitest";
import { beginCell } from "@ton/core";
import { Buffer } from "buffer";
import { decodeBocText, MAX_BOC_BYTES, parseBocBytes } from "./bocService";

describe("BOC Explorer", () => {
  it("parses a root and referenced cell using the TON SDK", async () => {
    const child = beginCell().storeUint(0xab, 8).endCell();
    const root = beginCell().storeUint(7, 3).storeRef(child).endCell();
    const boc = root.toBoc();
    const document = await parseBocBytes(boc);
    expect(document.byteLength).toBe(boc.length);
    expect(document.bocBase64).toBe(boc.toString("base64"));
    expect(document.roots).toEqual([root.hash().toString("hex")]);
    expect(document.nodes.map((node) => node.path)).toEqual(["0", "0.0"]);
    expect(document.nodes[0].refCount).toBe(1);
    expect(document.nodes[0].refs).toEqual(["0.0"]);
    expect(document.nodes[0].hex).toBe("e0");
    expect(document.nodes[1].hex).toBe("ab");
    expect(document.nodes[1].hash).toBe(child.hash().toString("hex"));
    expect(decodeBocText(boc.toString("base64"), "base64")).toEqual(boc);
    expect(decodeBocText(boc.toString("hex"), "hex")).toEqual(boc);
  });

  it("rejects corrupted and oversized input", async () => {
    const boc = beginCell().endCell().toBoc();
    const corrupted = Buffer.from(boc);
    corrupted[corrupted.length - 1] ^= 0xff;
    await expect(parseBocBytes(corrupted)).rejects.toThrow();
    await expect(parseBocBytes(new Uint8Array(MAX_BOC_BYTES + 1))).rejects.toThrow();
    expect(() => decodeBocText("xyz", "hex")).toThrow();
    expect(() => decodeBocText("AAAA=", "base64")).toThrow();
  });
});
