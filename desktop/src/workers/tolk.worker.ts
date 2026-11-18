/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

import "../lib/buffer-shim";
import { compileProject } from "../../runtime/tolk-core.mjs";

self.onmessage = async (event: MessageEvent<string>) => {
  try { self.postMessage({ ok: true, value: await compileProject(event.data) }); }
  catch (cause) { self.postMessage({ ok: false, error: cause instanceof Error ? cause.message : String(cause) }); }
};
