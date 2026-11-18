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

import { runTolkCompiler } from "@ton/tolk-js";

function projectFromInput(input) {
  if (!input.startsWith('{"__vantixProject":1,'))
    return { entrypoint: "main.tolk", files: { "main.tolk": input } };
  const project = JSON.parse(input);
  if (project.__vantixProject !== 1 || !project.files || typeof project.files !== "object" ||
      Array.isArray(project.files)) throw new Error("Некорректный проект Tolk.");
  const entries = Object.entries(project.files);
  if (entries.length < 1 || entries.length > 24)
    throw new Error("Проект должен содержать от 1 до 24 файлов.");
  let total = 0;
  for (const [name, content] of entries) {
    if (!/^[a-zA-Z0-9_./-]+\.tolk$/.test(name) || name.startsWith("/") ||
        name.split("/").some((part) => part === "." || part === ".." || !part) ||
        typeof content !== "string") throw new Error("Некорректное имя или содержимое файла Tolk.");
    total += Buffer.byteLength(content);
  }
  if (total > 120 * 1024 || typeof project.entrypoint !== "string" ||
      !Object.hasOwn(project.files, project.entrypoint))
    throw new Error("Проект слишком большой или не содержит входной файл.");
  return project;
}

async function main() {
  const chunks = [];
  let length = 0;
  for await (const chunk of process.stdin) {
    length += chunk.length;
    if (length > 128 * 1024) throw new Error("Исходный код превышает 128 КиБ.");
    chunks.push(chunk);
  }
  const project = projectFromInput(Buffer.concat(chunks).toString("utf8"));
  const result = await runTolkCompiler({
    entrypointFileName: project.entrypoint,
    fsReadCallback: (path) => project.files[path.replace(/^\.\//, "")] ?? "",
    withSrcLineComments: true,
  });
  if (result.status === "error") {
    process.stdout.write(JSON.stringify({ status: "error", message: result.message }) + "\n");
    return;
  }
  process.stdout.write(JSON.stringify({
    status: "ok", language: "Tolk", compilerVersion: result.tolkVersion,
    codeBocBase64: result.codeBoc64, codeHashHex: result.codeHashHex,
    fiftCode: result.fiftCode, abi: result.abiJson,
    diagnostics: result.stderr,
  }) + "\n");
}

main().catch((error) => {
  process.stderr.write(`Tolk: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
