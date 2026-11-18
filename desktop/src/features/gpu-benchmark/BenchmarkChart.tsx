/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

import SmoothChart from "../../components/SmoothChart";

export type BenchmarkSample = { seconds: number; rates: Record<string, number> };
export type BenchmarkSeries = { key: string; label: string; color: string };

export default function BenchmarkChart({ samples, series }: {
  samples: BenchmarkSample[]; series: BenchmarkSeries[];
}) {
  return <div className="benchmark-chart">
    <div className="smooth-legend">{series.map((item) => <span key={item.key}>
      <i style={{ background: item.color }} />{item.label}</span>)}</div>
    <SmoothChart height={290} unit="адр/с" area={series.length === 1}
      labels={samples.map((sample) => `${sample.seconds.toFixed(1)} с`)}
      series={series.map((item) => ({ ...item, values: samples.map((sample) => sample.rates[item.key] ?? null) }))}
      ariaLabel="Измеренная скорость полного GRAM-пайплайна по времени" />
  </div>;
}
