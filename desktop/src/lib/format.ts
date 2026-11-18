/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

// Суммы в нано-единицах (1 GRAM = 10^9) → «1 334 408 278,8129 GRAM».
const groups = new Intl.NumberFormat("ru-RU", { useGrouping: true });

export function formatGram(nano: string | bigint | null | undefined, maxFraction = 4): string {
  if (nano === null || nano === undefined || nano === "") return "—";
  let value: bigint;
  try { value = BigInt(nano); } catch { return String(nano); }
  const negative = value < 0n;
  if (negative) value = -value;
  const whole = value / 1_000_000_000n;
  const fraction = (value % 1_000_000_000n).toString().padStart(9, "0");
  let shown = fraction.slice(0, maxFraction).replace(/0+$/, "");
  // Очень маленькая ненулевая сумма не превращается в «0».
  if (!shown && whole === 0n && value > 0n) return `${negative ? "−" : ""}<0,${"0".repeat(maxFraction - 1)}1 GRAM`;
  if (shown && fraction.slice(maxFraction).replace(/0+$/, "")) shown = shown || "0";
  return `${negative ? "−" : ""}${groups.format(whole)}${shown ? `,${shown}` : ""} GRAM`;
}

/** Точное значение для подсказки: все 9 знаков после запятой. */
export function exactGram(nano: string | bigint | null | undefined): string {
  if (nano === null || nano === undefined || nano === "") return "";
  try {
    const value = BigInt(nano); const sign = value < 0n ? "−" : ""; const abs = value < 0n ? -value : value;
    const fraction = (abs % 1_000_000_000n).toString().padStart(9, "0").replace(/0+$/, "");
    return `${sign}${groups.format(abs / 1_000_000_000n)}${fraction ? `,${fraction}` : ""} GRAM`;
  } catch { return String(nano); }
}
