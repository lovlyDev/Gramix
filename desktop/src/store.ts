/*
 * Copyright (C) 2026 [COPYRIGHT HOLDER].
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of VANTIX.
 *
 * VANTIX is dual-licensed under the GNU Affero General
 * Public License v3.0 and a separate commercial license.
 *
 * See LICENSE and LICENSING.md for details.
 */

import { create } from "zustand";

export type Device = {
  id: string;
  name: string;
  vendor: string;
  driver: string;
  memory_bytes: number;
  apis: string[];
};
export type ValidatedBackend = { api: string; device_id: string; name: string };
export type Backend = "auto" | "cpu" | "vulkan" | "cuda" | "hip" | "hybrid";
export type Scheme = "12" | "24";
export type Wallet = "v5" | "v4";
export type MatchMode = "contains" | "prefix" | "suffix";
export type Status = "idle" | "initializing" | "running" | "paused" | "stopping" | "finished" | "error";

function savedNumber(key: string, fallback: number, min: number, max: number) {
  if (typeof localStorage === "undefined") return fallback;
  const value = Number(localStorage.getItem(key));
  return Number.isFinite(value) && value >= min && value <= max ? value : fallback;
}

type State = {
  devices: Device[];
  validatedBackends: ValidatedBackend[];
  selectedDeviceId: string;
  status: Status;
  backend: Backend;
  scheme: Scheme;
  wallet: Wallet;
  matchMode: MatchMode;
  pattern: string;
  ignoreCase: boolean;
  gpuDuty: number;
  cpuThreads: number;
  checked: number;
  rate: number;
  samples: number[];
  resultPath: string;
  error: string;
  set: (patch: Partial<State>) => void;
  addSample: (rate: number) => void;
};

export const useApp = create<State>((set) => ({
  devices: [],
  validatedBackends: [],
  selectedDeviceId: "",
  status: "idle",
  backend: "auto",
  scheme: "12",
  wallet: "v5",
  matchMode: "contains",
  pattern: "",
  ignoreCase: false,
  gpuDuty: savedNumber("vantix.compute.gpuDuty", 85, 30, 100),
  cpuThreads: savedNumber("vantix.compute.cpuThreads", 0, 0,
    Math.max(1, navigator.hardwareConcurrency || 1)),
  checked: 0,
  rate: 0,
  samples: [],
  resultPath: "",
  error: "",
  set: (patch) => set(patch),
  addSample: (rate) => set((state) => ({
    rate,
    samples: [...state.samples.slice(-59), rate]
  }))
}));
