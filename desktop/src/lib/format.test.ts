/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE and LICENSING.md for details.
 */

import { describe, expect, it } from "vitest";
import { exactGram, formatGram as raw } from "./format";

// Intl разделяет разряды неразрывным пробелом; для сравнения приводим к обычному.
const formatGram = (value: string) => raw(value).replace(/[  ]/g, " ");

describe("формат сумм GRAM", () => {
  it("группирует разряды и обрезает дробь", () => {
    expect(formatGram("1334408278812921300")).toBe("1 334 408 278,8129 GRAM");
    expect(formatGram("136300573474")).toBe("136,3005 GRAM");
    expect(formatGram("1000000000")).toBe("1 GRAM");
    expect(formatGram("0")).toBe("0 GRAM");
  });
  it("не прячет маленькие и отрицательные суммы", () => {
    expect(formatGram("260156")).toBe("0,0002 GRAM");
    expect(formatGram("12")).toBe("<0,0001 GRAM");
    expect(formatGram("-2070000000")).toBe("−2,07 GRAM");
    expect(exactGram("260156")).toBe("0,000260156 GRAM");
  });
});
