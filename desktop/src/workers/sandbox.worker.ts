/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE and LICENSING.md for details.
 */

import "../lib/buffer-shim";
import "../lib/process-shim";
import { runScenario } from "../../runtime/sandbox-core.mjs";

self.onmessage = async (event: MessageEvent<unknown>) => {
  try { self.postMessage({ ok: true, value: await runScenario(event.data) }); }
  catch (cause) { self.postMessage({ ok: false, error: cause instanceof Error ? cause.message : String(cause) }); }
};
