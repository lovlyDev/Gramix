/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

// Те же правила, что у src/address_inspector.cpp ядра.
import { Address } from "@ton/core";
import type { AddressResult } from "../platform/types";

export function inspectAddressLocal(value: string): AddressResult {
  const input = value.trim();
  let address: Address;
  let friendly: { isBounceable: boolean; isTestOnly: boolean } | null = null;
  if (input.includes(":")) {
    const match = /^(-?\d{1,3}):([0-9a-fA-F]{64})$/.exec(input);
    if (!match || Number(match[1]) < -128 || Number(match[1]) > 127)
      throw new Error("Raw-адрес: workchain от −128 до 127 и 64 hex-символа после двоеточия.");
    address = Address.parseRaw(input);
  } else {
    if (!/^[A-Za-z0-9+/_-]{48}$/.test(input)) throw new Error("Friendly-адрес должен содержать 48 символов.");
    try {
      const parsed = Address.parseFriendly(input);
      address = parsed.address;
      friendly = { isBounceable: parsed.isBounceable, isTestOnly: parsed.isTestOnly };
    } catch { throw new Error("Неверная контрольная сумма или тег адреса."); }
  }
  const testOnly = friendly?.isTestOnly ?? false;
  return {
    source: "local", raw: `${address.workChain}:${address.hash.toString("hex")}`,
    workchain: address.workChain, input_format: friendly ? "friendly" : "raw",
    input_bounceable: friendly ? friendly.isBounceable : null,
    input_testnet: friendly ? friendly.isTestOnly : null,
    bounceable: address.toString({ urlSafe: true, bounceable: true, testOnly }),
    non_bounceable: address.toString({ urlSafe: true, bounceable: false, testOnly }),
  };
}
