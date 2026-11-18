/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

import { describe, expect, it } from "vitest";
import { newMnemonic, validBip39, walletFromWords } from "./wallet";

// Эталонные векторы совпадают с tests/core_tests.cpp ядра.
const ton24 = ("tag couch guilt honey garden illegal injury harsh battle elder donor hidden " +
  "forget imitate suffer apology check hedgehog ability window clip romance correct jacket").split(" ");
const bip39 = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about".split(" ");

describe("браузерная деривация кошелька", () => {
  it("24 слова, V4R2 и V5R1", async () => {
    const v4 = await walletFromWords(ton24, "24", "v4");
    expect(v4.publicKey).toBe("9e315b6568d2b9e7e353b73b70a64b5b028d0dd36a4457854d1dd9f69959feb8");
    expect(v4.address).toBe("UQB8bN7tL9Zyet9jvvzkllhUnQAuGe3T6-PiRZsF5mq8__D8");
    expect((await walletFromWords(ton24, "24", "v5")).address)
      .toBe("UQBXB_8fB0iAE1pf3seahie7sM6HZSoWh9xq5_oqYK44x3Br");
  }, 20_000);
  it("12 слов BIP39, SLIP-0010, V5R1", async () => {
    const wallet = await walletFromWords(bip39, "12", "v5");
    expect(wallet.publicKey).toBe("7952e94118f34607c75e23258dd9220d66ccac5a3ee074125c25068e8107bfbf");
    expect(wallet.address).toBe("UQBHyu-oZVDHRYQ1-rKlGqpHy5yAqanPBirEQNMNOmfHLtaT");
  });
  it("новая фраза из 12 слов проходит контрольную сумму", async () => {
    const words = await newMnemonic("12");
    expect(words).toHaveLength(12);
    expect(await validBip39(words)).toBe(true);
    expect(await validBip39(bip39.slice(0, 11).concat("abandon"))).toBe(false);
  });
});
