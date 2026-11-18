/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

import SmoothChart from "./components/SmoothChart";

// Скорость поиска за последние 60 секунд, по одному значению в секунду.
export default function RateChart({ values }: { values: number[] }) {
  const labels = values.map((_, index) => {
    const ago = values.length - 1 - index;
    return ago === 0 ? "сейчас" : `−${ago} с`;
  });
  return <div className="rate-chart">
    <SmoothChart series={[{ key: "rate", label: "Скорость", color: "var(--accent)", values }]} labels={labels}
      height={170} unit="адр/с" ariaLabel="График скорости поиска адресов" />
  </div>;
}
