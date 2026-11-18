/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

import { useEffect, useRef } from "react";
import uPlot from "uplot";
import "uplot/dist/uPlot.min.css";

export type BenchmarkSample = { seconds: number; rates: Record<string, number> };
export type BenchmarkSeries = { key: string; label: string; color: string };

export default function BenchmarkChart({ samples, series }: {
  samples: BenchmarkSample[]; series: BenchmarkSeries[];
}) {
  const host = useRef<HTMLDivElement>(null);
  const plot = useRef<uPlot | null>(null);
  const signature = series.map((item) => item.key).join("|");
  useEffect(() => {
    if (!host.current) return;
    const css = getComputedStyle(document.documentElement);
    const muted = css.getPropertyValue("--text-muted").trim() || "#aaaaaa";
    const divider = css.getPropertyValue("--divider").trim() || "rgba(255,255,255,.06)";
    const chart = new uPlot({
      width: Math.max(320, host.current.clientWidth), height: 290,
      title: "Полный GRAM-пайплайн · проверенных адресов/с",
      cursor: { show: true }, legend: { show: true },
      scales: { x: { time: false }, y: { auto: true,
        range: (_chart, _min, max) => [0, Math.max(1, max * 1.12)] } },
      axes: [{ label: "Время, с", stroke: muted, grid: { stroke: divider }, ticks: { stroke: divider } },
        { label: "Адресов/с", stroke: muted, grid: { stroke: divider }, ticks: { stroke: divider } }],
      series: [{}, ...series.map((item) => ({ label: item.label, stroke: item.color, width: 2,
        points: { show: samples.length < 40 } }))],
    }, [samples.map((sample) => sample.seconds), ...series.map((item) =>
      samples.map((sample) => sample.rates[item.key] ?? null))], host.current);
    plot.current = chart;
    const resize = new ResizeObserver(([entry]) => {
      const width = Math.round(entry.contentRect.width);
      if (width > 0) chart.setSize({ width, height: 290 });
    });
    resize.observe(host.current);
    return () => { resize.disconnect(); chart.destroy(); plot.current = null; };
  }, [signature]);
  useEffect(() => {
    plot.current?.setData([samples.map((sample) => sample.seconds), ...series.map((item) =>
      samples.map((sample) => sample.rates[item.key] ?? null))]);
  }, [samples, signature]);
  return <div className="benchmark-chart" ref={host} role="img"
    aria-label="Измеренная скорость полного GRAM-пайплайна по времени" />;
}
