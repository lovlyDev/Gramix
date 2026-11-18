/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

// Короткие уведомления внизу окна: «файл сохранён», ошибки экспорта.
import { useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { NOTICE_EVENT, type Notice } from "../lib/save";

export default function Notices() {
  const [notice, setNotice] = useState<(Notice & { id: number }) | null>(null);
  useEffect(() => {
    let timer = 0;
    function show(event: Event) {
      const detail = (event as CustomEvent<Notice>).detail;
      window.clearTimeout(timer);
      setNotice({ ...detail, id: Date.now() });
      timer = window.setTimeout(() => setNotice(null), detail.kind === "error" ? 7000 : 4000);
    }
    window.addEventListener(NOTICE_EVENT, show);
    return () => { window.removeEventListener(NOTICE_EVENT, show); window.clearTimeout(timer); };
  }, []);
  if (!notice) return null;
  return <div className={`app-notice ${notice.kind}`} role={notice.kind === "error" ? "alert" : "status"} key={notice.id}
    onClick={() => setNotice(null)}>
    {notice.kind === "ok" ? <CheckCircle2 size={17} /> : <XCircle size={17} />}<span>{notice.text}</span>
  </div>;
}
