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

import { describe, expect, it } from "vitest";
import { normalizeBenchmarkHistory } from "./benchmarkHistory";

const measured = { source: "local", metric: "verified_ton_addresses_per_second",
  warmup: true, measuredAt: "2026-09-29T00:00:00.000Z", os: "Windows",
  version: "0.2.0-dev", results: [{ api: "cpu", device_id: "cpu:0",
    name: "CPU", addresses_per_second: 1234.5 }] };

describe("benchmark history", () => {
  it("keeps measured full-pipeline results and discards malformed records", () => {
    expect(normalizeBenchmarkHistory([measured, { ...measured, results: [null] },
      { ...measured, results: [{ ...measured.results[0], addresses_per_second: Infinity }] },
      { ...measured, metric: "pbkdf2_only" }])).toEqual([measured]);
  });

  it("bounds the number of saved passes", () => {
    expect(normalizeBenchmarkHistory(Array.from({ length: 100 }, (_, index) => ({
      ...measured, measuredAt: new Date(2026, 8, 29, 0, index).toISOString(),
    })))).toHaveLength(80);
  });
});
