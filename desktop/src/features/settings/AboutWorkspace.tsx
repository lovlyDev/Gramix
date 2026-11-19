/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BookOpen, ExternalLink, FileText, Scale, ScrollText } from "lucide-react";
import readmeRu from "../../../../README.ru.md?raw";
import readmeEn from "../../../../README.md?raw";
import license from "../../../../LICENSE?raw";
import licensingRu from "../../../../docs/LICENSING.ru.md?raw";
import licensingEn from "../../../../docs/LICENSING.md?raw";
import noticeRu from "../../../../NOTICE.ru.md?raw";
import noticeEn from "../../../../NOTICE.md?raw";
import Select from "../../components/ui/Select";
import { openExternal } from "../../lib/external";
import { language as uiLanguage } from "../../lib/i18n";

const repository = "https://github.com/lovlyDev/Gramix";
const sourceRevision = import.meta.env.VITE_SOURCE_REVISION || "";
type Language = "ru" | "en";
const documents = [
  { id: "readme", title: { ru: "README", en: "README" }, icon: BookOpen, text: { ru: readmeRu, en: readmeEn } },
  { id: "license", title: { ru: "GNU AGPLv3", en: "GNU AGPLv3" }, icon: Scale, text: { ru: license, en: license } },
  { id: "licensing", title: { ru: "Лицензия · пояснения", en: "Licensing" }, icon: ScrollText, text: { ru: licensingRu, en: licensingEn } },
  { id: "notice", title: { ru: "Уведомления", en: "Notices" }, icon: FileText, text: { ru: noticeRu, en: noticeEn } },
] as const;
type DocumentId = (typeof documents)[number]["id"];
const languages = [{ value: "ru", label: "Русский" }, { value: "en", label: "English" }];

// Ссылки между встроенными документами открываются здесь же, остальные — в браузере.
const embedded: Record<string, [DocumentId, Language]> = {
  "README.md": ["readme", "en"], "README.ru.md": ["readme", "ru"], "LICENSE": ["license", "en"],
  "LICENSING.md": ["licensing", "en"], "LICENSING.ru.md": ["licensing", "ru"],
  "NOTICE.md": ["notice", "en"], "NOTICE.ru.md": ["notice", "ru"],
};
function embeddedDocument(href: string): [DocumentId, Language] | null {
  if (/^(https?:|mailto:|#)/i.test(href)) return null;
  const name = href.split(/[?#]/)[0].split("/").pop() ?? "";
  return embedded[name] ?? null;
}

// Строка «English | Русский» нужна на GitHub; в приложении язык выбирается списком.
const withoutLanguageLine = (text: string) => text.replace(/^\[?English\]?(?:\([^)]*\))? \| \[?Русский\]?(?:\([^)]*\))?[ \t]*\r?\n/m, "");

function externalDocumentUrl(value: string) {
  if (/^(https?:|mailto:|#)/i.test(value)) return value;
  return `${repository}/blob/main/${value.replace(/^\.\//, "")}`;
}

export default function AboutWorkspace({ version }: { version: string }) {
  const [selected, setSelected] = useState<DocumentId>("readme");
  const [language, setLanguage] = useState<Language>(() => {
    try { const stored = localStorage.getItem("gramix.ui.docsLanguage"); return stored === "en" || stored === "ru" ? stored : uiLanguage; }
    catch { return uiLanguage; }
  });
  function changeLanguage(value: Language) {
    setLanguage(value);
    try { localStorage.setItem("gramix.ui.docsLanguage", value); } catch { /* приватный режим */ }
  }
  const document = documents.find((item) => item.id === selected) ?? documents[0];
  const title = document.title[language];
  return <div className="about-workspace">
    <div className="about-intro">
      <div><strong>Gramix</strong><span>Версия {version || "определяется"}</span></div>
      <a href={sourceRevision ? `${repository}/tree/${sourceRevision}` : repository}
        onClick={(event) => { event.preventDefault(); openExternal(event.currentTarget.href); }}><ExternalLink size={16} /> Исходный код</a>
    </div>
    <p className="about-licensing">Gramix — свободная программа на условиях GNU AGPLv3. Сторонние компоненты сохраняют свои лицензии.</p>
    <div className="about-document-layout">
      <nav className="about-document-nav" aria-label="Документы Gramix">
        {documents.map((item) => { const Icon = item.icon; return <button type="button"
          key={item.id} aria-pressed={selected === item.id} onClick={() => setSelected(item.id)}>
          <Icon size={18} aria-hidden="true" /><span>{item.title[language]}</span></button>; })}
      </nav>
      <section className="about-document" aria-label={title} key={`${document.id}-${language}`}>
        <div className="about-document-heading"><FileText size={18} /><h3>{title}</h3>
          {document.id !== "license" && <Select label="Язык документа" className="about-language" value={language}
            onValueChange={(value) => changeLanguage(value as Language)} options={languages} />}</div>
        {document.id === "license" ? <pre>{document.text.en}</pre> :
          <div className="about-markdown"><ReactMarkdown remarkPlugins={[remarkGfm]}
            components={{
              a: ({ href, children }) => {
                const target = embeddedDocument(href || "");
                return <a href={target ? `#${target}` : externalDocumentUrl(href || "#")} onClick={(event) => {
                  event.preventDefault();
                  if (target) { setSelected(target[0]); if (target[0] !== "license") changeLanguage(target[1]); } else if (href && !href.startsWith("#")) openExternal(externalDocumentUrl(href));
                }}>{children}</a>;
              },
              img: ({ src, alt }) => <img src={externalDocumentUrl(src || "#")} alt={alt || ""} loading="lazy" />,
            }}>{withoutLanguageLine(document.text[language])}</ReactMarkdown></div>}
      </section>
    </div>
  </div>;
}
