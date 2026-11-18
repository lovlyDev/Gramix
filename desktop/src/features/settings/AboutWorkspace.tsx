/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE and LICENSING.md for details.
 */

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BookOpen, ExternalLink, FileText, Scale, ScrollText } from "lucide-react";
import readmeRu from "../../../../README.ru.md?raw";
import readmeEn from "../../../../README.md?raw";
import license from "../../../../LICENSE?raw";
import licensingRu from "../../../../LICENSING.ru.md?raw";
import noticeRu from "../../../../NOTICE.ru.md?raw";

const repository = "https://github.com/lovlyDev/VANTIX";
const sourceRevision = import.meta.env.VITE_SOURCE_REVISION || "";
const documents = [
  { id: "readme-ru", title: "README · Русский", icon: BookOpen, text: readmeRu },
  { id: "readme-en", title: "README · English", icon: BookOpen, text: readmeEn },
  { id: "license", title: "GNU AGPLv3", icon: Scale, text: license },
  { id: "licensing", title: "Условия лицензирования", icon: ScrollText, text: licensingRu },
  { id: "notice", title: "Уведомления", icon: FileText, text: noticeRu },
] as const;
type DocumentId = (typeof documents)[number]["id"];

function externalDocumentUrl(value: string) {
  if (/^(https?:|mailto:|#)/i.test(value)) return value;
  return `${repository}/blob/main/${value.replace(/^\.\//, "")}`;
}

export default function AboutWorkspace({ version }: { version: string }) {
  const [selected, setSelected] = useState<DocumentId>("readme-ru");
  const document = documents.find((item) => item.id === selected) ?? documents[0];
  return <div className="about-workspace">
    <div className="about-intro">
      <div><strong>VANTIX Community Edition</strong><span>Версия {version || "определяется"}</span></div>
      <a href={sourceRevision ? `${repository}/tree/${sourceRevision}` : repository}
        target="_blank" rel="noreferrer"><ExternalLink size={16} /> Исходный код</a>
    </div>
    <p className="about-licensing">Собственный код предоставляется по GNU AGPLv3. Коммерческая лицензия оформляется отдельным письменным договором.</p>
    <div className="about-document-layout">
      <nav className="about-document-nav" aria-label="Документы VANTIX">
        {documents.map((item) => { const Icon = item.icon; return <button type="button"
          key={item.id} aria-pressed={selected === item.id} onClick={() => setSelected(item.id)}>
          <Icon size={18} aria-hidden="true" /><span>{item.title}</span></button>; })}
      </nav>
      <section className="about-document" aria-label={document.title} key={document.id}>
        <div className="about-document-heading"><FileText size={18} /><h3>{document.title}</h3></div>
        {document.id === "license" ? <pre>{document.text}</pre> :
          <div className="about-markdown"><ReactMarkdown remarkPlugins={[remarkGfm]}
            components={{
              a: ({ href, children }) => <a href={externalDocumentUrl(href || "#")}
                target="_blank" rel="noreferrer">{children}</a>,
              img: ({ src, alt }) => <img src={externalDocumentUrl(src || "#")} alt={alt || ""} loading="lazy" />,
            }}>{document.text}</ReactMarkdown></div>}
      </section>
    </div>
  </div>;
}
