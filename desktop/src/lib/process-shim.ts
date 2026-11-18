/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE and LICENSING.md for details.
 */

// @ton/sandbox обращается к process.env и process.nextTick, как в Node. Только для Web Worker Sandbox.
const scope = globalThis as unknown as { process?: unknown };
if (typeof scope.process === "undefined") {
  scope.process = { env: {}, argv: [], versions: {}, platform: "browser", browser: true,
    cwd: () => "/", nextTick: (callback: (...args: unknown[]) => void, ...args: unknown[]) =>
      queueMicrotask(() => callback(...args)) };
}
