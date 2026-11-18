/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

// Общий контракт платформы. desktop.ts вызывает ядро через Tauri,
// web.ts выполняет те же операции в браузере. Формы ответов одинаковые.
import type { GeneratedWallet, Scheme, WalletVersion } from "../lib/wallet";

export type Network = "mainnet" | "testnet";
export type AddressResult = {
  source: "local"; raw: string; workchain: number; input_format: "raw" | "friendly";
  input_bounceable: boolean | null; input_testnet: boolean | null;
  bounceable: string; non_bounceable: string;
};
export type AccountResult = {
  source: "OpenTonAPI"; network: Network; raw: string; status: string; balance_nanoton: string;
  last_activity: number | null; is_wallet: boolean | null; received_at: number;
};
export type RemoteTransaction = {
  source: "OpenTonAPI"; network: Network; hash: string; raw_boc_hex: string; received_at: number;
};
export type ContractAccount = {
  source: "OpenTonAPI"; network: Network; raw: string; status: string; balance_nanoton: string;
  code_hex: string | null; data_hex: string | null; last_transaction_lt: string | null;
  last_transaction_hash: string | null; received_at: number;
};
export type CodeInspection = {
  code_hex: string; code_hash: string; compiler: string | null; methods: string[]; received_at: number;
};
export type MethodResult = {
  method: string; args: string[]; success: boolean; exit_code: number;
  stack: unknown[]; decoded: unknown; received_at: number;
};
export type BuildSuccess = { status: "ok"; language: "Tolk"; compilerVersion: string;
  codeBocBase64: string; codeHashHex: string; fiftCode: string; abi: unknown; diagnostics: string };
export type BuildFailure = { status: "error"; message: string };
export type ScenarioStep = { from: string; to: string; amountTon: string };
export type Scenario = { title: string; accounts: string[]; steps: ScenarioStep[] };
export type SimulationTransaction = { step: number; from: string; to: string; amountNanoton: string;
  hash: string; logicalTime: string; feesNanoton: string; oldStatus: string; endStatus: string;
  aborted: boolean | null };
export type Simulation = { source: string; network: "simulation"; scenario: string;
  accounts: Record<string, string>; steps: ScenarioStep[];
  balancesBefore: Record<string, string>; balancesAfter: Record<string, string>;
  balancesRestored: Record<string, string>; snapshotsRestored: boolean;
  transactions: SimulationTransaction[] };

export type VanityOptions = { pattern: string; mode: "contains" | "prefix" | "suffix";
  ignoreCase: boolean; scheme: Scheme; version: WalletVersion; threads: number };
export type VanityHandle = { pause(): void; resume(): void; stop(): void };
export type VanityEvents = {
  onProgress(checked: number, rate: number): void;
  onFound(wallet: GeneratedWallet, checkedByWorker: number): void;
  onError(message: string): void;
};

export type Platform = {
  kind: "desktop" | "web";
  inspectAddress(input: string): Promise<AddressResult>;
  fetchAccount(raw: string, testnet: boolean): Promise<AccountResult>;
  fetchTransaction(hash: string, testnet: boolean): Promise<RemoteTransaction>;
  fetchContract(raw: string, testnet: boolean): Promise<ContractAccount>;
  inspectContractCode(raw: string, testnet: boolean): Promise<CodeInspection>;
  runGetMethod(raw: string, testnet: boolean, method: string, args: string[]): Promise<MethodResult>;
  compileTolk(project: string): Promise<BuildSuccess | BuildFailure>;
  runSandbox(scenario: Scenario): Promise<Simulation>;
  cancelSandbox(): Promise<void>;
  /** Только сайт: генерация и поиск выполняются в Web Worker браузера. */
  generateWallet?(scheme: Scheme, version: WalletVersion): Promise<GeneratedWallet>;
  startVanity?(options: VanityOptions, events: VanityEvents): VanityHandle;
  browserThreads?(): number;
};
