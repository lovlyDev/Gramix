/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE and LICENSING.md for details.
 */

export type TolkProject = { entrypoint: string; files: Record<string, string> };
const MAX_PROJECT_BYTES = 128 * 1024;
const MAX_FILE_BYTES = 120 * 1024;
const MAX_FILES = 24;
const validName = /^[a-zA-Z0-9_./-]+\.tolk$/;

export function validTolkPath(name: string): boolean {
  return name.length > 0 && name.length <= 80 && validName.test(name) &&
    !name.startsWith("/") && !name.includes("\\") &&
    name.split("/").every((part) => part !== "" && part !== "." && part !== "..");
}

export function parseTolkProject(value: unknown): TolkProject {
  if (typeof value !== "object" || value === null) throw new Error("Некорректный формат проекта.");
  const source = value as Record<string, unknown>;
  const files = source.files;
  if (typeof files !== "object" || files === null || Array.isArray(files))
    throw new Error("В проекте нет файлов Tolk.");
  const entries = Object.entries(files);
  if (entries.length < 1 || entries.length > MAX_FILES)
    throw new Error(`Проект должен содержать от 1 до ${MAX_FILES} файлов.`);
  const encoder = new TextEncoder();
  if (encoder.encode(JSON.stringify(value)).length > MAX_PROJECT_BYTES)
    throw new Error("Проект превышает лимит 128 КиБ.");
  if (entries.some(([name, text]) => !validTolkPath(name) || typeof text !== "string" ||
      encoder.encode(text).length > MAX_FILE_BYTES))
    throw new Error("Файл проекта имеет недопустимое имя, тип или размер.");
  if (new Set(entries.map(([name]) => name.toLowerCase())).size !== entries.length)
    throw new Error("Имена файлов не должны различаться только регистром.");
  if (typeof source.entrypoint !== "string" || !Object.hasOwn(files, source.entrypoint))
    throw new Error("Входной файл проекта не найден.");
  return { entrypoint: source.entrypoint, files: Object.fromEntries(entries) };
}
