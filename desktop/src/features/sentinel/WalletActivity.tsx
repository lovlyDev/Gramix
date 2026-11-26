/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

import { formatGram } from "../../lib/format";
import { saveFile } from "../../lib/save";
import type { Entry } from "./useWalletMonitor";
import type { WorkspaceId } from "../../components/ToolNavigation";
export function WalletActivity({
  feed,
  busy,
  error,
  hasWallets,
  open,
}: {
  feed: Entry[];
  busy: boolean;
  error: string;
  hasWallets: boolean;
  open: (id: WorkspaceId) => void;
}) {
  function csv() {
    const quote = (s: string) => '"' + (/^[=+@\-\t\r]/.test(s) ? "'" : "") + s.replaceAll('"', '""') + '"';
    const rows = [
      ["Время UTC", "Адрес", "ID события", "Операция", "Направление", "Количество", "Статус"],
      ...feed.flatMap(({ raw, event }) =>
        event.actions.map((a) => [
          new Date(event.time * 1000).toISOString(),
          raw,
          event.id,
          a.title,
          a.direction,
          a.amountNano ? formatGram(a.amountNano, 9) : a.value,
          a.ok ? "ok" : "failed",
        ]),
      ),
    ];
    void saveFile(
      "gramix-sentinel.csv",
      "\ufeff" + rows.map((r) => r.map(quote).join(";")).join("\r\n"),
      "text/csv;charset=utf-8",
    );
  }
  return (
    <section className="card">
      <div className="card-head">
        <h2>Лента активности</h2>
        <button className="btn" disabled={!feed.length || busy} onClick={csv}>
          Скачать CSV
        </button>
      </div>
      <div className="card-body">
        {!feed.length && (
          <p className="muted">
            {busy
              ? "Загружаю историю…"
              : error
                ? "История недоступна."
                : hasWallets
                  ? "В выборке нет событий."
                  : "Добавьте адрес для просмотра событий."}
          </p>
        )}
        {feed.map(({ raw, event }) => (
          <div key={raw + event.id} className="history-item">
            <div className="history-main">
              <b>{event.actions.map((a) => a.title).join(" · ")}</b>
              <small>
                {new Date(event.time * 1000).toLocaleString()} · {raw.slice(0, 6)}…{raw.slice(-5)} ·{" "}
                {event.pending ? "В обработке" : "Подтверждено"}
              </small>
            </div>
            <div className="history-amount">
              {event.actions.map((a, i) => (
                <small key={i}>
                  {a.direction === "out" ? "−" : a.direction === "in" ? "+" : ""}
                  {a.amountNano ? formatGram(a.amountNano) : a.value}
                </small>
              ))}
              {event.tx && (
                <button
                  className="card-link"
                  onClick={() => {
                    open("transaction-decoder");
                    setTimeout(
                      () =>
                        window.dispatchEvent(new CustomEvent("gramix:transaction-id", { detail: event.tx })),
                      0,
                    );
                  }}
                >
                  Транзакция
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
