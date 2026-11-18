/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE and LICENSING.md for details.
 */

// Общее ядро сборки Tolk: используется Node-скриптом приложения и Web Worker сайта.
import { runTolkCompiler } from "@ton/tolk-js";
export function projectFromInput(input) {
  if (!input.startsWith('{"__gramixProject":1,'))
    return { entrypoint: "main.tolk", files: { "main.tolk": input } };
  const project = JSON.parse(input);
  if (project.__gramixProject !== 1 || !project.files || typeof project.files !== "object" ||
      Array.isArray(project.files)) throw new Error("Некорректный проект Tolk.");
  const entries = Object.entries(project.files);
  if (entries.length < 1 || entries.length > 24)
    throw new Error("Проект должен содержать от 1 до 24 файлов.");
  let total = 0;
  for (const [name, content] of entries) {
    if (!/^[a-zA-Z0-9_./-]+\.tolk$/.test(name) || name.startsWith("/") ||
        name.split("/").some((part) => part === "." || part === ".." || !part) ||
        typeof content !== "string") throw new Error("Некорректное имя или содержимое файла Tolk.");
    total += new TextEncoder().encode(content).length;
  }
  if (total > 120 * 1024 || typeof project.entrypoint !== "string" ||
      !Object.hasOwn(project.files, project.entrypoint))
    throw new Error("Проект слишком большой или не содержит входной файл.");
  return project;
}

export async function compileProject(input) {
  if (new TextEncoder().encode(input).length > 128 * 1024) throw new Error("Исходный код превышает 128 КиБ.");
  const project = projectFromInput(input);
  const result = await runTolkCompiler({
    entrypointFileName: project.entrypoint,
    fsReadCallback: (path) => project.files[path.replace(/^\.\//, "")] ?? "",
    withSrcLineComments: true,
  });
  if (result.status === "error") return { status: "error", message: result.message };
  return {
    status: "ok", language: "Tolk", compilerVersion: result.tolkVersion,
    codeBocBase64: result.codeBoc64, codeHashHex: result.codeHashHex,
    fiftCode: result.fiftCode, abi: result.abiJson,
    diagnostics: result.stderr,
  };
}
