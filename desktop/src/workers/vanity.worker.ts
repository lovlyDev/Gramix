/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

// Один поток поиска адреса. Фраза найденного кошелька передаётся только в окно сайта.
import "../lib/buffer-shim";
import { keyPair, newMnemonic, walletAddress, type Scheme, type WalletVersion } from "../lib/wallet";

type Start = { type: "start"; pattern: string; mode: "contains" | "prefix" | "suffix";
  ignoreCase: boolean; scheme: Scheme; version: WalletVersion; maxSeconds?: number };
type Control = { type: "pause" | "resume" | "stop" };
let running = false;
let paused = false;

function matches(address: string, needle: string, mode: Start["mode"], ignoreCase: boolean) {
  // Правила совпадают с SearchPattern ядра (include/gramix/compute.hpp).
  const body = ignoreCase ? address.toLowerCase() : address;
  if (mode === "prefix") return body.startsWith(needle);
  if (mode === "suffix") return body.endsWith(needle);
  return body.includes(needle);
}

async function search(options: Start) {
  const needle = options.ignoreCase ? options.pattern.toLowerCase() : options.pattern;
  const deadline = options.maxSeconds ? performance.now() + options.maxSeconds * 1000 : Infinity;
  let checked = 0;
  let lastReport = performance.now();
  let windowStart = lastReport;
  let windowCount = 0;
  running = true;
  while (running && performance.now() < deadline) {
    if (paused) { await new Promise((resolve) => setTimeout(resolve, 150)); continue; }
    const words = await newMnemonic(options.scheme);
    const keys = await keyPair(words, options.scheme);
    const { address, raw } = walletAddress(keys.publicKey, options.version);
    checked++; windowCount++;
    if (needle && matches(address, needle, options.mode, options.ignoreCase)) {
      self.postMessage({ type: "found", checked, wallet: { phrase: words.join(" "), publicKey: keys.publicKey.toString("hex"),
        address, raw, wallet: options.version === "v4" ? "Wallet V4R2" : "Wallet V5R1", scheme: options.scheme } });
      running = false;
    }
    keys.secretKey.fill(0);
    const time = performance.now();
    if (time - lastReport > 500) {
      self.postMessage({ type: "progress", checked, rate: windowCount / ((time - windowStart) / 1000) });
      lastReport = time; windowStart = time; windowCount = 0;
    }
  }
  self.postMessage({ type: "done", checked });
}

self.onmessage = (event: MessageEvent<Start | Control>) => {
  const message = event.data;
  if (message.type === "start") void search(message).catch((cause) =>
    self.postMessage({ type: "error", message: cause instanceof Error ? cause.message : String(cause) }));
  else if (message.type === "pause") paused = true;
  else if (message.type === "resume") paused = false;
  else running = false;
};
