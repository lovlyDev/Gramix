/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

// Приложение: все операции идут через ядро и команды Tauri. Сетевой телеметрии нет.
import { invoke, isTauri } from "@tauri-apps/api/core";
import { Command } from "@tauri-apps/plugin-shell";
import type { AccountResult, AddressResult, BuildFailure, BuildSuccess, CodeInspection,
  ContractAccount, MethodResult, Platform, RemoteTransaction, Simulation } from "./types";

function requireApp() {
  if (!isTauri()) throw new Error("Операция выполняется установленным приложением Gramix.");
}

export const platform = {
  kind: "desktop",
  async inspectAddress(input) {
    requireApp();
    const output = await Command.sidecar("binaries/gramix", ["address", "inspect", input.trim(), "--json"]).execute();
    if (output.code !== 0) throw new Error(output.stderr.trim() || "Адрес не прошёл проверку.");
    return JSON.parse(output.stdout) as AddressResult;
  },
  async fetchAccount(raw, testnet) { requireApp(); return await invoke<AccountResult>("fetch_account", { raw, testnet }); },
  async fetchTransaction(hash, testnet) {
    requireApp(); return await invoke<RemoteTransaction>("fetch_transaction", { hash, testnet });
  },
  async fetchContract(raw, testnet) { requireApp(); return await invoke<ContractAccount>("fetch_contract", { raw, testnet }); },
  async inspectContractCode(raw, testnet) {
    requireApp(); return await invoke<CodeInspection>("inspect_contract_code", { raw, testnet });
  },
  async runGetMethod(raw, testnet, method, args) {
    requireApp(); return await invoke<MethodResult>("run_get_method", { raw, testnet, method, args });
  },
  async compileTolk(project) {
    requireApp(); return await invoke<BuildSuccess | BuildFailure>("compile_tolk", { source: project });
  },
  async runSandbox(scenario) { requireApp(); return await invoke<Simulation>("run_sandbox_demo", { scenario }); },
  async cancelSandbox() { requireApp(); await invoke("cancel_sandbox"); },
  async fetchRatesRaw() { requireApp(); return await invoke("fetch_rates"); },
  async fetchRatesChartRaw(currency, days) { requireApp(); return await invoke("fetch_rates_chart", { currency, days }); },
  async fetchAccountEventsRaw(raw, testnet, beforeLt, limit) {
    requireApp(); return await invoke("fetch_account_events", { raw, testnet, beforeLt: beforeLt ?? null, limit: limit ?? null });
  },
  async fetchAccountsBulkRaw(raws, testnet) { requireApp(); return await invoke("fetch_accounts_bulk", { raws, testnet }); },
  async fetchNftRaw(raw, testnet) { requireApp(); return await invoke("fetch_nft", { raw, testnet }); },
} satisfies Platform as Platform;
