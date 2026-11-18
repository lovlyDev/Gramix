/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

// Схема событий сайта. В ней намеренно нет полей для фраз, ключей, паролей и файлов:
// передать секрет через track() нельзя даже по ошибке — такие поля не пройдут проверку типов.
export type TrackEvent =
  | { name: "page_view"; path: string; tool: string }
  | { name: "click"; target: string; tool: string; x: number; y: number }
  | { name: "search"; kind: "address" | "transaction" | "boc" | "tool" | "link" | "none"; value?: string }
  | { name: "address_checked"; address: string; network: string }
  | { name: "account_loaded"; address: string; network: string; status: string }
  | { name: "transaction_opened"; hash: string; network: string }
  | { name: "contract_opened"; address: string; network: string }
  | { name: "get_method"; address: string; method: string }
  | { name: "boc_parsed"; bytes: number }
  | { name: "vanity_started"; pattern: string; mode: string; scheme: string; wallet: string; threads: number }
  | { name: "vanity_stopped"; found: boolean; checked: number; seconds: number }
  | { name: "tool_action"; tool: string; action: string };

export type Telemetry = {
  enabled: boolean;
  track(event: TrackEvent): void;
  consent(): "granted" | "denied" | "unknown";
  setConsent(value: boolean): void;
};
