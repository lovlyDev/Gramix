/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE and LICENSING.md for details.
 */

import { useState } from "react";
import agplText from "../../LICENSE?raw";
import thirdPartyText from "../../licenses/THIRD_PARTY.md?raw";

const sourceUrl = "https://github.com/lovlyDev/VANTIX";
const sourceRevision = import.meta.env.VITE_SOURCE_REVISION || "";
const exactSourceUrl = sourceRevision ? `${sourceUrl}/tree/${sourceRevision}` : sourceUrl;
const docUrl = (path: string) => `${sourceUrl}/blob/main/${path}`;

export default function LegalPanel() {
  const [open, setOpen] = useState(false);
  return <>
    <button
      id="legal-panel-open"
      type="button"
      onClick={() => setOpen(true)}
      style={{ position: "fixed", right: 16, bottom: 16, zIndex: 1000, padding: "8px 12px", borderRadius: 8, background: "#232b3b", color: "#fff", border: "1px solid #79859d", cursor: "pointer" }}
    >О программе / Лицензии</button>
    {open && <div
      role="dialog"
      aria-modal="true"
      aria-label="О программе VANTIX и лицензиях"
      onKeyDown={event => { if (event.key === "Escape") setOpen(false); }}
      style={{ position: "fixed", inset: 0, zIndex: 1100, display: "grid", placeItems: "center", padding: 16, background: "#000b" }}
    >
      <section style={{ width: "min(780px, 100%)", maxHeight: "90vh", overflow: "auto", padding: 24, borderRadius: 12, background: "#172033", color: "#fff" }}>
        <button type="button" onClick={() => setOpen(false)} aria-label="Закрыть сведения о лицензиях" style={{ float: "right" }}>×</button>
        <h2>О программе / Лицензии</h2>
        <p>VANTIX — Community Edition</p>
        <p>Copyright (C) 2026 lovlydev. Юридическое имя правообладателя проверяется.</p>
        <p>Собственный код предоставляется по GNU Affero General Public License version 3 only (AGPL-3.0-only). Гарантии предоставляются только в объёме, предусмотренном лицензией или отдельным договором.</p>
        <p><a href={exactSourceUrl} target="_blank" rel="noreferrer">Исходный код базовой ревизии сборки</a>: {sourceRevision || "ревизия не встроена"}. Для сборки с локальными изменениями дополнительно нужен соответствующий архив исходников.</p>
        <p><a href={docUrl("LICENSING.md")} target="_blank" rel="noreferrer">Коммерческая лицензия</a> предоставляется только по индивидуальному письменному договору. Условия сторонних компонентов сохраняются. Использование названия и логотипа описано в <a href={docUrl("TRADEMARKS.md")} target="_blank" rel="noreferrer">правилах бренда</a>.</p>
        <details><summary>Полный текст GNU AGPLv3</summary><pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{agplText}</pre></details>
        <details><summary>Сторонние лицензии и реестр зависимостей</summary><pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{thirdPartyText}</pre></details>
        <p>Каждый релиз должен содержать полные уведомления о фактически включённых компонентах; этот реестр также содержит зависимости сборки.</p>
      </section>
    </div>}
  </>;
}
