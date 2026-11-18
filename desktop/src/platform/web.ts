/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

// Сайт: всё считается в браузере, сеть — только запросы к OpenTonAPI.
import "../lib/buffer-shim";
import { inspectAddressLocal } from "../lib/address";
import * as tonapi from "../lib/tonapi";
import { generateWallet } from "../lib/wallet";
import type { BuildFailure, BuildSuccess, Platform, Simulation, VanityHandle } from "./types";

type Reply<T> = { ok: true; value: T } | { ok: false; error: string };
let sandboxWorker: Worker | null = null;
let sandboxReject: ((error: Error) => void) | null = null;

function runOnce<T>(worker: Worker, message: unknown): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    worker.onmessage = (event: MessageEvent<Reply<T>>) => {
      worker.terminate();
      if (event.data.ok) resolve(event.data.value); else reject(new Error(event.data.error));
    };
    worker.onerror = (event) => { worker.terminate(); reject(new Error(event.message || "Ошибка фонового потока.")); };
    worker.postMessage(message);
  });
}

export const platform = {
  kind: "web",
  async inspectAddress(input) { return inspectAddressLocal(input); },
  fetchAccount: tonapi.fetchAccount,
  fetchTransaction: tonapi.fetchTransaction,
  fetchContract: tonapi.fetchContract,
  inspectContractCode: tonapi.inspectContractCode,
  runGetMethod: tonapi.runGetMethod,
  async compileTolk(project) {
    const worker = new Worker(new URL("../workers/tolk.worker.ts", import.meta.url), { type: "module" });
    return await runOnce<BuildSuccess | BuildFailure>(worker, project);
  },
  async runSandbox(scenario) {
    sandboxWorker?.terminate();
    const worker = new Worker(new URL("../workers/sandbox.worker.ts", import.meta.url), { type: "module" });
    sandboxWorker = worker;
    try {
      return await new Promise<Simulation>((resolve, reject) => {
        sandboxReject = reject;
        runOnce<Simulation>(worker, scenario).then(resolve, reject);
      });
    } finally { sandboxWorker = null; sandboxReject = null; }
  },
  async cancelSandbox() {
    sandboxWorker?.terminate();
    sandboxReject?.(new Error("Симуляция остановлена."));
  },
  generateWallet,
  browserThreads: () => Math.max(1, Math.min(16, (navigator.hardwareConcurrency || 2) - 1)),
  startVanity(options, events): VanityHandle {
    const counts = new Map<Worker, { checked: number; rate: number }>();
    let finished = false;
    const workers = Array.from({ length: Math.max(1, options.threads) }, () =>
      new Worker(new URL("../workers/vanity.worker.ts", import.meta.url), { type: "module" }));
    const stopAll = () => { finished = true; for (const worker of workers) worker.terminate(); };
    for (const worker of workers) {
      counts.set(worker, { checked: 0, rate: 0 });
      worker.onmessage = (event: MessageEvent) => {
        if (finished) return;
        const data = event.data as { type: string; checked?: number; rate?: number; message?: string;
          wallet?: Parameters<typeof events.onFound>[0] };
        if (data.type === "progress") {
          counts.set(worker, { checked: data.checked ?? 0, rate: data.rate ?? 0 });
          let checked = 0; let rate = 0;
          for (const item of counts.values()) { checked += item.checked; rate += item.rate; }
          events.onProgress(checked, rate);
        } else if (data.type === "found" && data.wallet) { stopAll(); events.onFound(data.wallet); }
        else if (data.type === "error") { stopAll(); events.onError(data.message ?? "Ошибка поиска."); }
      };
      worker.onerror = (event) => { stopAll(); events.onError(event.message || "Ошибка фонового потока."); };
      worker.postMessage({ type: "start", ...options });
    }
    return {
      pause: () => workers.forEach((worker) => worker.postMessage({ type: "pause" })),
      resume: () => workers.forEach((worker) => worker.postMessage({ type: "resume" })),
      stop: stopAll,
    };
  },
} satisfies Platform as Platform;
