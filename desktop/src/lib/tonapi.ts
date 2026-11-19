/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

// Браузерный клиент OpenTonAPI с теми же проверками, что у команд приложения.
import type { AccountResult, CodeInspection, ContractAccount, MethodResult, RemoteTransaction } from "../platform/types";

const MAX_BYTES = 256 * 1024;
const rawPattern = /^-?\d{1,3}:[0-9a-fA-F]{64}$/;
const cellHex = (value: unknown): value is string => typeof value === "string" &&
  value.length <= 128 * 1024 && value.length % 2 === 0 && /^[0-9a-fA-F]*$/.test(value);
const methodName = (value: string) => /^[A-Za-z_][A-Za-z0-9_]{0,63}$/.test(value);
const statuses = new Set(["nonexist", "uninit", "active", "frozen"]);
let lastAccountRequest = 0;

const host = (testnet: boolean) => testnet ? "https://testnet.tonapi.io" : "https://tonapi.io";
const now = () => Math.floor(Date.now() / 1000);
const network = (testnet: boolean) => testnet ? "testnet" as const : "mainnet" as const;

class NotFound extends Error {
  constructor() { super("Не найдено в OpenTonAPI"); }
}

async function getJson(url: string, limit = MAX_BYTES, init: RequestInit = {}): Promise<Record<string, unknown>> {
  let response: Response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(12_000), redirect: "error",
      credentials: "omit", referrerPolicy: "no-referrer", ...init });
  } catch (cause) {
    throw new Error(cause instanceof DOMException && cause.name === "TimeoutError"
      ? "Время ожидания OpenTonAPI истекло" : "OpenTonAPI недоступен: проверьте подключение");
  }
  if (response.status === 429) throw new Error("OpenTonAPI ограничил частоту запросов");
  if (response.status === 404) throw new NotFound();
  if (!response.ok) throw new Error(`OpenTonAPI вернул HTTP ${response.status}`);
  const text = await response.text();
  if (text.length > limit) throw new Error("Ответ OpenTonAPI слишком велик");
  try { return JSON.parse(text) as Record<string, unknown>; }
  catch { throw new Error("OpenTonAPI вернул некорректный JSON"); }
}

export async function fetchAccount(raw: string, testnet: boolean): Promise<AccountResult> {
  if (!rawPattern.test(raw)) throw new Error("Некорректный raw-адрес");
  if (Date.now() - lastAccountRequest < 2000) throw new Error("Повторите запрос через две секунды");
  lastAccountRequest = Date.now();
  const data = await getJson(`${host(testnet)}/v2/accounts/${raw}`).catch((cause) => {
    if (cause instanceof NotFound) throw new Error("Аккаунт не найден в OpenTonAPI.");
    throw cause;
  });
  if (data.address !== raw) throw new Error("OpenTonAPI вернул данные другого аккаунта");
  if (typeof data.status !== "string" || !statuses.has(data.status)) throw new Error("Неизвестный статус аккаунта в ответе OpenTonAPI");
  if (typeof data.balance !== "number") throw new Error("Некорректный баланс в ответе OpenTonAPI");
  return { source: "OpenTonAPI", network: network(testnet), raw, status: data.status,
    balance_nanoton: String(data.balance),
    last_activity: typeof data.last_activity === "number" ? data.last_activity : null,
    is_wallet: typeof data.is_wallet === "boolean" ? data.is_wallet : null, received_at: now() };
}

export async function fetchTransaction(hash: string, testnet: boolean): Promise<RemoteTransaction> {
  if (!/^[0-9a-fA-F]{64}$/.test(hash)) throw new Error("ID транзакции должен содержать 64 hex-символа");
  let data: Record<string, unknown>;
  let byMessage = false;
  try { data = await getJson(`${host(testnet)}/v2/blockchain/transactions/${hash}`); }
  catch (cause) {
    if (!(cause instanceof NotFound)) throw cause;
    // Часто вставляют хэш входящего сообщения: находим транзакцию, которую оно вызвало.
    try { data = await getJson(`${host(testnet)}/v2/blockchain/messages/${hash}/transaction`); byMessage = true; }
    catch (inner) {
      if (inner instanceof NotFound) throw new Error(`Транзакция с таким хэшем не найдена в ${testnet ? "testnet" : "mainnet"}. Проверьте хэш${testnet ? "" : " или включите Testnet"}.`);
      throw inner;
    }
  }
  const inMessage = (data.in_msg as { hash?: unknown } | undefined)?.hash;
  const viaMessage = typeof inMessage === "string" && inMessage.toLowerCase() === hash.toLowerCase();
  if (typeof data.hash !== "string" || (!byMessage && !viaMessage && data.hash.toLowerCase() !== hash.toLowerCase()))
    throw new Error("OpenTonAPI вернул другую транзакцию");
  if (!cellHex(data.raw) || !data.raw) throw new Error("OpenTonAPI не вернул корректный raw BOC");
  return { source: "OpenTonAPI", network: network(testnet), hash: data.hash, raw_boc_hex: data.raw, received_at: now() };
}

export async function fetchContract(raw: string, testnet: boolean): Promise<ContractAccount> {
  if (!rawPattern.test(raw)) throw new Error("Некорректный raw-адрес");
  const data = await getJson(`${host(testnet)}/v2/blockchain/accounts/${raw}`);
  if (data.address !== raw) throw new Error("OpenTonAPI вернул данные другого аккаунта");
  if (typeof data.status !== "string" || !statuses.has(data.status)) throw new Error("Неизвестный статус аккаунта");
  if (data.code !== undefined && !cellHex(data.code) || data.data !== undefined && !cellHex(data.data))
    throw new Error("OpenTonAPI вернул некорректный BOC контракта");
  if (typeof data.balance !== "number") throw new Error("Некорректный баланс аккаунта");
  return { source: "OpenTonAPI", network: network(testnet), raw, status: data.status,
    balance_nanoton: String(data.balance), code_hex: cellHex(data.code) ? data.code : null,
    data_hex: cellHex(data.data) ? data.data : null,
    last_transaction_lt: data.last_transaction_lt === undefined ? null : String(data.last_transaction_lt),
    last_transaction_hash: typeof data.last_transaction_hash === "string" ? data.last_transaction_hash : null,
    received_at: now() };
}

export async function inspectContractCode(raw: string, testnet: boolean): Promise<CodeInspection> {
  if (!rawPattern.test(raw)) throw new Error("Некорректный raw-адрес");
  const data = await getJson(`${host(testnet)}/v2/blockchain/accounts/${raw}/inspect`);
  if (!cellHex(data.code)) throw new Error("OpenTonAPI не вернул корректный код");
  if (typeof data.code_hash !== "string" || !/^[0-9a-fA-F]{64}$/.test(data.code_hash))
    throw new Error("OpenTonAPI не вернул хеш кода");
  if (!Array.isArray(data.methods)) throw new Error("OpenTonAPI не вернул список методов");
  const methods = data.methods.map((item) => (item as { method?: unknown }).method)
    .filter((name): name is string => typeof name === "string" && methodName(name)).slice(0, 128);
  return { code_hex: data.code, code_hash: data.code_hash,
    compiler: typeof data.compiler === "string" ? data.compiler : null, methods, received_at: now() };
}

export async function runGetMethod(raw: string, testnet: boolean, method: string, args: string[]): Promise<MethodResult> {
  if (!rawPattern.test(raw)) throw new Error("Некорректный raw-адрес");
  if (!methodName(method)) throw new Error("Некорректное имя get-метода");
  if (args.length > 16 || args.some((arg) => arg.length > 4096 || /[\r\n]/.test(arg)))
    throw new Error("Слишком много аргументов или аргумент слишком длинный");
  const url = new URL(`${host(testnet)}/v2/blockchain/accounts/${raw}/methods/${method}`);
  for (const arg of args) url.searchParams.append("args", arg);
  const data = await getJson(url.toString());
  if (typeof data.success !== "boolean") throw new Error("В ответе нет результата метода");
  if (typeof data.exit_code !== "number") throw new Error("В ответе нет кода выхода");
  if (!Array.isArray(data.stack)) throw new Error("В ответе нет стека");
  return { method, args, success: data.success, exit_code: data.exit_code, stack: data.stack,
    decoded: data.decoded ?? null, received_at: now() };
}

// Курс, история и балансы: сырой JSON, разбор общий для сайта и приложения (lib/market.ts).
export const fetchRatesRaw = () => getJson(`${host(false)}/v2/rates?tokens=ton&currencies=usd,rub`);
export function fetchRatesChartRaw(currency: "usd" | "rub", days: number) {
  const end = now(); const start = end - Math.min(365, Math.max(1, days)) * 86_400;
  return getJson(`${host(false)}/v2/rates/chart?token=ton&currency=${currency}&start_date=${start}&end_date=${end}&points_count=120`);
}
export function fetchAccountEventsRaw(raw: string, testnet: boolean, beforeLt?: string, limit = 20) {
  if (!rawPattern.test(raw)) throw new Error("Некорректный raw-адрес");
  if (beforeLt && !/^\d{1,20}$/.test(beforeLt)) throw new Error("Некорректный LT");
  const query = `limit=${Math.min(50, Math.max(1, limit))}${beforeLt ? `&before_lt=${beforeLt}` : ""}`;
  return getJson(`${host(testnet)}/v2/accounts/${raw}/events?${query}`, 1024 * 1024);
}
export function fetchAccountsBulkRaw(raws: string[], testnet: boolean) {
  if (!raws.length) return Promise.resolve({ accounts: [] });
  if (raws.length > 100 || raws.some((raw) => !rawPattern.test(raw))) throw new Error("Некорректный список адресов");
  return getJson(`${host(testnet)}/v2/accounts/_bulk`, 1024 * 1024, { method: "POST",
    headers: { "content-type": "application/json" }, body: JSON.stringify({ account_ids: raws }) });
}
