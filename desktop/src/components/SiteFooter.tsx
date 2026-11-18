/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

// Подвал сайта. Ссылка на исходники именно той сборки — требование раздела 13 AGPLv3.
import type { WorkspaceId } from "./ToolNavigation";

const repository = "https://github.com/lovlyDev/Gramix";

export default function SiteFooter({ onOpen }: { onOpen: (id: WorkspaceId) => void }) {
  const commit = __COMMIT__;
  return <footer className="foot wrap">
    <div className="foot-links">
      <a href={commit ? `${repository}/tree/${commit}` : repository} target="_blank" rel="noreferrer">
        Исходный код{commit ? ` · ${commit.slice(0, 7)}` : ""}</a>
      <a href={`${repository}/blob/main/LICENSE`} target="_blank" rel="noreferrer">Лицензия AGPL-3.0</a>
      <a href="/privacy" onClick={(event) => { event.preventDefault(); onOpen("privacy"); }}>Конфиденциальность</a>
      <a href={`${repository}/releases/latest`} target="_blank" rel="noreferrer">Скачать приложение</a>
    </div>
    <p>© 2026 lovlydev · Gramix — независимый проект, не связанный с Telegram и TON Foundation.</p>
  </footer>;
}
