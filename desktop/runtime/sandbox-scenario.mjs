/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE and LICENSING.md for details.
 */

import { runScenario } from "./sandbox-core.mjs";

async function main() {
  const chunks = [];
  let size = 0;
  for await (const chunk of process.stdin) {
    size += chunk.length;
    if (size > 32 * 1024) throw new Error("Сценарий превышает 32 КиБ.");
    chunks.push(chunk);
  }
  const input = Buffer.concat(chunks).toString("utf8").trim();
  const result = await runScenario(input ? JSON.parse(input) : undefined);
  process.stdout.write(JSON.stringify(result) + "\n");
}

main().catch((error) => {
  process.stderr.write(`Sandbox: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
