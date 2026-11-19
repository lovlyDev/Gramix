/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

// Плавный SVG-график без сторонних библиотек: monotone cubic-кривая,
// градиентная заливка, подсказка по наведению и анимация появления.
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { locale } from "../lib/i18n";

export type ChartSeries = { key: string; label: string; color: string; values: (number | null)[] };

type Point = { x: number; y: number };
const PAD = { top: 14, right: 64, bottom: 28, left: 6 };
const compact = new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 });

// Кривая Фритча — Карлсона: сглаживает, но не выходит за значения точек.
function monotonePath(points: Point[]) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M${points[0].x},${points[0].y}`;
  const n = points.length;
  const dx = [], slope = [];
  for (let i = 0; i < n - 1; i++) {
    dx.push(points[i + 1].x - points[i].x);
    slope.push(dx[i] === 0 ? 0 : (points[i + 1].y - points[i].y) / dx[i]);
  }
  const tangent = [slope[0]];
  for (let i = 1; i < n - 1; i++) tangent.push(slope[i - 1] * slope[i] <= 0 ? 0 : (slope[i - 1] + slope[i]) / 2);
  tangent.push(slope[n - 2]);
  for (let i = 0; i < n - 1; i++) {
    if (slope[i] === 0) { tangent[i] = 0; tangent[i + 1] = 0; continue; }
    const a = tangent[i] / slope[i], b = tangent[i + 1] / slope[i], h = a * a + b * b;
    if (h > 9) { const t = 3 / Math.sqrt(h); tangent[i] = t * a * slope[i]; tangent[i + 1] = t * b * slope[i]; }
  }
  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 0; i < n - 1; i++) {
    const third = dx[i] / 3;
    d += `C${points[i].x + third},${points[i].y + tangent[i] * third} ${points[i + 1].x - third},${points[i + 1].y - tangent[i + 1] * third} ${points[i + 1].x},${points[i + 1].y}`;
  }
  return d;
}

function niceMax(value: number) {
  if (value <= 0) return 1;
  const power = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((item) => item * power >= value) ?? 10;
  return step * power;
}

export default function SmoothChart({ series, labels, height = 220, unit = "", area = true, zeroBase = true,
  formatValue = (value: number) => compact.format(value), ariaLabel }: {
  series: ChartSeries[]; labels: string[]; height?: number; unit?: string; area?: boolean; zeroBase?: boolean;
  formatValue?: (value: number) => string; ariaLabel: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  const [hover, setHover] = useState<number | null>(null);
  const gradient = useId().replace(/:/g, "");
  useEffect(() => {
    if (!host.current) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(240, Math.round(entry.contentRect.width))));
    observer.observe(host.current);
    return () => observer.disconnect();
  }, []);

  const count = Math.max(...series.map((item) => item.values.length), 1);
  const known = series.flatMap((item) => item.values.filter((v): v is number => v !== null));
  const dataMax = Math.max(0, ...known); const dataMin = known.length ? Math.min(...known) : 0;
  const spread = Math.max(dataMax - dataMin, dataMax * 0.02, 1e-9);
  const min = zeroBase ? 0 : Math.max(0, dataMin - spread * 0.15);
  const max = zeroBase ? niceMax(dataMax * 1.08) : dataMax + spread * 0.15;
  const innerW = width - PAD.left - PAD.right, innerH = height - PAD.top - PAD.bottom;
  const xAt = (index: number) => PAD.left + (count <= 1 ? innerW / 2 : (index / (count - 1)) * innerW);
  const yAt = (value: number) => PAD.top + innerH - ((value - min) / (max - min || 1)) * innerH;
  const paths = useMemo(() => series.map((item) => {
    const points = item.values.map((value, index) => value === null ? null : { x: xAt(index), y: yAt(value) })
      .filter((point): point is Point => point !== null);
    const line = monotonePath(points);
    const fill = points.length > 1
      ? `${line}L${points[points.length - 1].x},${PAD.top + innerH}L${points[0].x},${PAD.top + innerH}Z` : "";
    return { ...item, line, fill, last: points[points.length - 1] };
  }), [series, width, height, min, max, count]);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => min + (max - min) * ratio);
  const labelStep = Math.max(1, Math.ceil(count / Math.max(2, Math.floor(innerW / 90))));

  function move(clientX: number) {
    const rect = host.current?.getBoundingClientRect();
    if (!rect || count === 0) return;
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left - PAD.left) / innerW));
    setHover(Math.round(ratio * (count - 1)));
  }

  return <div className="smooth-chart" ref={host} role="img" aria-label={ariaLabel}
    onMouseMove={(event) => move(event.clientX)} onMouseLeave={() => setHover(null)}>
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        {paths.map((item, index) => <linearGradient key={item.key} id={`${gradient}-${index}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style={{ stopColor: item.color, stopOpacity: .32 }} />
          <stop offset="100%" style={{ stopColor: item.color, stopOpacity: 0 }} />
        </linearGradient>)}
      </defs>
      {ticks.map((tick) => <g key={tick}>
        <line x1={PAD.left} x2={PAD.left + innerW} y1={yAt(tick)} y2={yAt(tick)} className="smooth-grid" />
        <text x={width - 4} y={yAt(tick) + 4} textAnchor="end" className="smooth-axis">{formatValue(tick)}{tick === max && unit ? ` ${unit}` : ""}</text>
      </g>)}
      {labels.map((label, index) => index % labelStep === 0 || index === count - 1
        ? <text key={index} x={xAt(index)} y={height - 8} textAnchor={index === 0 ? "start" : index === count - 1 ? "end" : "middle"}
          className="smooth-axis">{label}</text> : null)}
      {paths.map((item, index) => <g key={item.key} className="smooth-series">
        {area && item.fill && <path d={item.fill} fill={`url(#${gradient}-${index})`} className="smooth-area" />}
        <path d={item.line} fill="none" style={{ stroke: item.color }} strokeWidth="2.4" strokeLinecap="round"
          strokeLinejoin="round" className="smooth-line" pathLength={1} />
        {item.last && hover === null && <circle cx={item.last.x} cy={item.last.y} r="4" style={{ fill: item.color }} className="smooth-dot" />}
      </g>)}
      {hover !== null && <g>
        <line x1={xAt(hover)} x2={xAt(hover)} y1={PAD.top} y2={PAD.top + innerH} className="smooth-cursor" />
        {series.map((item) => item.values[hover] == null ? null
          : <circle key={item.key} cx={xAt(hover)} cy={yAt(item.values[hover]!)} r="4.5" style={{ fill: item.color, stroke: "var(--surface)" }} strokeWidth="2" />)}
      </g>}
    </svg>
    {hover !== null && <div className="smooth-tooltip"
      style={{ left: Math.min(width - 170, Math.max(0, xAt(hover) - 80)) }}>
      <span className="smooth-tooltip-label">{labels[hover] ?? ""}</span>
      {series.map((item) => item.values[hover] == null ? null : <span key={item.key}>
        <i style={{ background: item.color }} />{series.length > 1 ? `${item.label}: ` : ""}
        <b>{formatValue(item.values[hover]!)}</b>{unit ? ` ${unit}` : ""}</span>)}
    </div>}
  </div>;
}
