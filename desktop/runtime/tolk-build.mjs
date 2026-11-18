/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE and LICENSING.md for details.
 */

import { compileProject } from "./tolk-core.mjs";

async function main() {
  const chunks = [];
  let length = 0;
  for await (const chunk of process.stdin) {
    length += chunk.length;
    if (length > 128 * 1024) throw new Error("Исходный код превышает 128 КиБ.");
    chunks.push(chunk);
  }
  const result = await compileProject(Buffer.concat(chunks).toString("utf8"));
  process.stdout.write(JSON.stringify(result) + "\n");
}

main().catch((error) => {
  process.stderr.write(`Tolk: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
