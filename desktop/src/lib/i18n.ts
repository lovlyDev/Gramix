/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

// Язык интерфейса. Исходные тексты написаны по-русски; английский применяется к готовой
// странице по словарю i18n/en.json: текстовые узлы и атрибуты (placeholder, title, aria-label).
// Полноту словаря проверяет scripts/i18n_strings.py. Смена языка перезагружает окно,
// чтобы числа и даты тоже форматировались в новой локали.
import dictionary from "../i18n/en.json";

export type Language = "ru" | "en";
export const LANGUAGE_KEY = "gramix.ui.language";

function detect(): Language {
  try {
    const stored = localStorage.getItem(LANGUAGE_KEY);
    if (stored === "ru" || stored === "en") return stored;
  } catch { /* приватный режим */ }
  const preferred = typeof navigator === "undefined" ? "ru" : (navigator.languages?.[0] ?? navigator.language ?? "ru");
  return /^(ru|uk|be|kk)\b/i.test(preferred) ? "ru" : "en";
}

export const language: Language = typeof window === "undefined" ? "ru" : detect();
/** Локаль для Intl: числа, даты, валюты. */
export const locale = language === "en" ? "en-US" : "ru-RU";

export function setLanguage(next: Language) {
  try { localStorage.setItem(LANGUAGE_KEY, next); } catch { /* приватный режим */ }
  window.location.reload();
}

const exact = new Map<string, string>();
const patterns: { regex: RegExp; template: string }[] = [];
const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
for (const [ru, en] of Object.entries((dictionary as { strings: Record<string, string> }).strings)) {
  if (/\{\d+\}/.test(ru)) {
    const source = escape(ru).replace(/\\\{(\d+)\\\}/g, "(?<p$1>[\\s\\S]+?)");
    patterns.push({ regex: new RegExp(`^${source}$`), template: en });
  } else exact.set(ru, en);
}
// Длинные шаблоны первыми: «Загрузка версии {0} · {1}%» раньше «{0} с».
patterns.sort((a, b) => b.regex.source.length - a.regex.source.length);
const CYRILLIC = /[А-Яа-яЁё]/;

/** Перевести строку целиком; части, подставленные в шаблон, переводятся рекурсивно. */
export function translate(text: string, depth = 0): string {
  if (language !== "en" || !CYRILLIC.test(text)) return text;
  const normalized = text.replace(/\s+/g, " ").trim();
  const hit = exact.get(normalized);
  if (hit !== undefined) {
    const lead = text.match(/^\s*/)?.[0] ?? ""; const tail = text.match(/\s*$/)?.[0] ?? "";
    return lead + hit + tail;
  }
  if (depth > 2) return text;
  for (const { regex, template } of patterns) {
    const match = regex.exec(normalized);
    if (!match?.groups) continue;
    const groups = match.groups;
    return template.replace(/\{(\d+)\}/g, (_, index: string) => translate(groups[`p${index}`] ?? "", depth + 1));
  }
  // Составные подписи: «Не удалось проверить обновления: <ошибка>», «В избранное: Поиск адреса».
  const colon = normalized.indexOf(": ");
  if (colon > 0) {
    const headText = normalized.slice(0, colon);
    const head = exact.get(`${headText}:`) ?? (exact.has(headText) ? `${exact.get(headText)}:` : undefined);
    if (head) return `${head} ${translate(normalized.slice(colon + 2), depth + 1)}`;
  }
  // «Устройства · 3 движка»: переводим части между точками, если перевелись все русские части.
  if (normalized.includes(" · ")) {
    const parts = normalized.split(" · ").map((part) => translate(part, depth + 1));
    if (!parts.some((part) => CYRILLIC.test(part))) return parts.join(" · ");
  }
  // «0 движков», «12 инструментов»: число и слово.
  const counted = /^([\d\s.,]+) (\S.*)$/.exec(normalized);
  if (counted) {
    const word = translate(counted[2], depth + 1);
    if (!CYRILLIC.test(word)) return `${counted[1]} ${word}`;
  }
  return text;
}
export const t = translate;

const ATTRIBUTES = ["placeholder", "title", "aria-label", "alt", "aria-description"];
const SKIP = new Set(["SCRIPT", "STYLE", "TEXTAREA", "CODE", "PRE"]);
// Пользовательский ввод и редакторы кода не трогаем.
const skipped = (node: Node) => {
  for (let element = node.parentElement; element; element = element.parentElement) {
    if (SKIP.has(element.tagName) || element.isContentEditable || element.hasAttribute("data-no-translate")
      || element.classList.contains("cm-editor") || element.classList.contains("xterm")) return true;
  }
  return false;
};

function translateText(node: Text) {
  const value = node.nodeValue;
  if (!value || !CYRILLIC.test(value) || skipped(node)) return;
  const next = translate(value);
  if (next !== value) node.nodeValue = next;
}
function translateElement(element: Element) {
  for (const name of ATTRIBUTES) {
    const value = element.getAttribute(name);
    if (value && CYRILLIC.test(value)) {
      const next = translate(value);
      if (next !== value) element.setAttribute(name, next);
    }
  }
}
function walk(root: Node) {
  if (root.nodeType === Node.TEXT_NODE) { translateText(root as Text); return; }
  if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;
  if (root.nodeType === Node.ELEMENT_NODE) {
    if (SKIP.has((root as Element).tagName)) return;
    translateElement(root as Element);
  }
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node.nodeType === Node.TEXT_NODE) translateText(node as Text);
    else translateElement(node as Element);
  }
}

/** Включить перевод страницы. Вызывается один раз до первого рендера. */
export function startTranslation() {
  document.documentElement.lang = language;
  if (language !== "en") return;
  walk(document);
  new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === "characterData") translateText(record.target as Text);
      else if (record.type === "attributes") translateElement(record.target as Element);
      else record.addedNodes.forEach(walk);
    }
  }).observe(document.documentElement, { subtree: true, childList: true, characterData: true,
    attributes: true, attributeFilter: ATTRIBUTES });
}
