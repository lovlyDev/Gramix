/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

export type BenchmarkResult = { api: string; device_id: string; name: string;
  addresses_per_second: number; driver?: string };
export type BenchmarkReport = { source: "local"; metric: "verified_ton_addresses_per_second";
  warmup: boolean; results: BenchmarkResult[]; measuredAt: string; os: string; version: string };

export const BENCHMARK_HISTORY_KEY = "gramix.benchmark.history.v1";
const MAX_REPORTS = 80;

export function normalizeBenchmarkHistory(value: unknown): BenchmarkReport[] {
  if (!Array.isArray(value)) return [];
  return value.slice(-MAX_REPORTS).filter((report): report is BenchmarkReport => {
    if (typeof report !== "object" || report === null) return false;
    const item = report as Partial<BenchmarkReport>;
    return item.source === "local" && item.metric === "verified_ton_addresses_per_second" &&
      typeof item.warmup === "boolean" && typeof item.measuredAt === "string" &&
      Number.isFinite(Date.parse(item.measuredAt)) && typeof item.os === "string" &&
      typeof item.version === "string" && Array.isArray(item.results) &&
      item.results.length > 0 && item.results.length <= 32 &&
      item.results.every((result) => typeof result === "object" && result !== null &&
        typeof result.api === "string" &&
        typeof result.device_id === "string" && typeof result.name === "string" &&
        typeof result.addresses_per_second === "number" &&
        Number.isFinite(result.addresses_per_second) && result.addresses_per_second >= 0);
  });
}

export function readBenchmarkHistory(): BenchmarkReport[] {
  try { return normalizeBenchmarkHistory(JSON.parse(localStorage.getItem(BENCHMARK_HISTORY_KEY) || "[]")); }
  catch { return []; }
}

export function saveBenchmarkHistory(reports: BenchmarkReport[]): void {
  try { localStorage.setItem(BENCHMARK_HISTORY_KEY,
    JSON.stringify(normalizeBenchmarkHistory(reports))); }
  catch { /* Private mode or a full storage quota must not break a benchmark. */ }
}
