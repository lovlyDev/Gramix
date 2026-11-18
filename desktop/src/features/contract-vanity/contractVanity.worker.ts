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

import { deriveContractCandidate, parseContractInput } from "./contractVanityService";

type Start = { codeHex: string; dataHex: string; suffix: string;
  format: "raw" | "bounceable" | "nonBounceable"; startNonce: string; maxAttempts: number;
  matchMode?: "prefix" | "suffix"; inputFormat?: "hex" | "base64" };

let stopped = false;
let paused = false;
let pausedAt = 0;
let pausedDuration = 0;
self.onmessage = async (event: MessageEvent<{ type: "start"; payload: Start } |
  { type: "stop" } | { type: "pause" } | { type: "resume" }>) => {
  if (event.data.type === "stop") { stopped = true; return; }
  if (event.data.type === "pause") { if (!paused) { paused = true; pausedAt = performance.now(); } return; }
  if (event.data.type === "resume") { if (paused) { pausedDuration += performance.now() - pausedAt; paused = false; } return; }
  stopped = false;
  paused = false; pausedDuration = 0;
  try {
    const { codeHex, dataHex, suffix, format, startNonce, maxAttempts, matchMode, inputFormat } = event.data.payload;
    const input = await parseContractInput(codeHex, dataHex, inputFormat ?? "hex");
    const start = performance.now();
    let attempts = 0;
    while (attempts < maxAttempts && !stopped) {
      if (paused) { await new Promise<void>((resolve) => setTimeout(resolve, 50)); continue; }
      for (let batch = 0; batch < 100 && attempts < maxAttempts && !stopped && !paused; ++batch) {
        const candidate = await deriveContractCandidate(input, BigInt(startNonce) + BigInt(attempts));
        attempts++;
        const addressPart = format === "raw" ? candidate.raw.slice(2) : candidate[format];
        const matched = matchMode === "prefix" ? addressPart.startsWith(suffix)
          : addressPart.endsWith(suffix);
        if (matched) {
          self.postMessage({ type: "found", candidate, attempts,
            elapsedMs: performance.now() - start - pausedDuration });
          return;
        }
      }
      self.postMessage({ type: "progress", attempts,
        elapsedMs: performance.now() - start - pausedDuration - (paused ? performance.now() - pausedAt : 0) });
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
    }
    self.postMessage({ type: stopped ? "stopped" : "exhausted", attempts,
      elapsedMs: performance.now() - start - pausedDuration - (paused ? performance.now() - pausedAt : 0) });
  } catch (cause) {
    self.postMessage({ type: "error", message: String(cause) });
  }
};
