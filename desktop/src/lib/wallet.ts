/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE and LICENSING.md for details.
 */

// Браузерная реализация той же схемы, что и src/ton.cpp ядра:
// 12 слов — BIP39 + SLIP-0010 m/44'/607'/0', 24 слова — нативная схема сети.
import { Buffer } from "buffer";
import { deriveEd25519Path, getSecureRandomBytes, keyPairFromSeed, mnemonicNew,
  mnemonicToPrivateKey, mnemonicValidate, mnemonicWordList, pbkdf2_sha512, sha256 } from "@ton/crypto";
import { WalletContractV4, WalletContractV5R1 } from "@ton/ton";

export type Scheme = "12" | "24";
export type WalletVersion = "v4" | "v5";
export type GeneratedWallet = {
  phrase: string; publicKey: string; address: string; raw: string;
  wallet: "Wallet V4R2" | "Wallet V5R1"; scheme: Scheme;
};

export async function newMnemonic(scheme: Scheme): Promise<string[]> {
  if (scheme === "24") return await mnemonicNew(24);
  const entropy = await getSecureRandomBytes(16);
  const digest = await sha256(entropy);
  const bits = [...entropy].map((byte) => byte.toString(2).padStart(8, "0")).join("") +
    digest[0].toString(2).padStart(8, "0").slice(0, 4);
  const words = Array.from({ length: 12 }, (_, index) =>
    mnemonicWordList[parseInt(bits.slice(index * 11, index * 11 + 11), 2)]);
  entropy.fill(0);
  return words;
}

export async function validBip39(words: string[]): Promise<boolean> {
  if (words.length !== 12) return false;
  const indexes = words.map((word) => mnemonicWordList.indexOf(word));
  if (indexes.some((index) => index < 0)) return false;
  const bits = indexes.map((index) => index.toString(2).padStart(11, "0")).join("");
  const entropy = Buffer.from(Array.from({ length: 16 }, (_, index) =>
    parseInt(bits.slice(index * 8, index * 8 + 8), 2)));
  const digest = await sha256(entropy);
  return parseInt(bits.slice(128), 2) === digest[0] >> 4;
}

export async function keyPair(words: string[], scheme: Scheme) {
  if (scheme === "24") {
    if (!await mnemonicValidate(words)) throw new Error("Фраза из 24 слов не прошла проверку.");
    return await mnemonicToPrivateKey(words);
  }
  if (!await validBip39(words)) throw new Error("Фраза из 12 слов не прошла проверку BIP39.");
  const seed = await pbkdf2_sha512(Buffer.from(words.join(" "), "utf8"), "mnemonic", 2048, 64);
  const derived = await deriveEd25519Path(seed, [44, 607, 0]);
  return keyPairFromSeed(derived);
}

export function walletAddress(publicKey: Buffer, version: WalletVersion) {
  const contract = version === "v4"
    ? WalletContractV4.create({ workchain: 0, publicKey })
    : WalletContractV5R1.create({ workchain: 0, publicKey });
  return {
    address: contract.address.toString({ urlSafe: true, bounceable: false }),
    raw: contract.address.toRawString(),
  };
}

export async function walletFromWords(words: string[], scheme: Scheme,
  version: WalletVersion): Promise<GeneratedWallet> {
  const keys = await keyPair(words, scheme);
  const { address, raw } = walletAddress(keys.publicKey, version);
  return { phrase: words.join(" "), publicKey: keys.publicKey.toString("hex"), address, raw,
    wallet: version === "v4" ? "Wallet V4R2" : "Wallet V5R1", scheme };
}

export async function generateWallet(scheme: Scheme, version: WalletVersion) {
  return await walletFromWords(await newMnemonic(scheme), scheme, version);
}
