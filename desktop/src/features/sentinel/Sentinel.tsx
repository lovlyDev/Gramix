/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

import { lazy, useEffect, useState } from "react";
import { platform } from "@platform";
import { addressBook, useAddressBook, bookEntry } from "../../lib/addressBook";
import { saveFile } from "../../lib/save";
import { errorText } from "../../lib/errors";
import type { WorkspaceId } from "../../components/ToolNavigation";
import Select from "../../components/ui/Select";
import { WalletAssets } from "./WalletAssets";
import { WalletActivity } from "./WalletActivity";
import { useWalletMonitor } from "./useWalletMonitor";
const Guardian = lazy(() => import("./Guardian").then((m) => ({ default: m.Guardian })));
const Contract = lazy(() => import("./Contract").then((m) => ({ default: m.Contract })));

export default function Sentinel({ page, open, visible, initialAddress, compareAddress }: { visible: boolean; initialAddress: string; compareAddress: (address: string) => void; page: WorkspaceId; open: (id: WorkspaceId) => void }) {
  const book = useAddressBook(),
    watched = book.filter((e) => e.watch && !e.testnet);
  const [filter, setFilter] = useState("*"),
    [input, setInput] = useState(""),
    [name, rename] = useState("");
  const [days, setDays] = useState("7"),
    [refresh, tick] = useState(0),
    [formError, setFormError] = useState("");
  const isPortfolio = page === "sentinel-portfolio",
    isWatch = page === "sentinel-watch";
  const keys = watched
    .filter((e) => filter === "*" || e.raw === filter)
    .map((e) => e.raw)
    .sort()
    .join(",");
  useEffect(() => {
    if (filter !== "*" && !watched.some((e) => e.raw === filter)) setFilter("*");
  }, [book, filter]);
  const { hold, feed, points, price, busy, error } = useWalletMonitor(
    keys,
    isPortfolio,
    isWatch || isPortfolio,
    days,
    refresh,
    visible,
  );
  async function add() {
    try {
      const parsed = await platform.inspectAddress(input.trim());
      if (parsed.input_testnet) throw Error("Выберите публичный адрес Mainnet.");
      if (!bookEntry(parsed.raw, false))
        addressBook.add({ raw: parsed.raw, address: parsed.bounceable, label: name.trim(), testnet: false });
      addressBook.update(parsed.raw, false, { watch: true });
      setFilter(parsed.raw);
      setInput("");
      rename("");
      setFormError("");
    } catch (e) {
      setFormError(errorText(e));
    }
  }
  if (page === "sentinel-contract" || page === "sentinel-diff")
    return (
      <Contract
        key={page}
        diff={page === "sentinel-diff"}
        initial={initialAddress || (filter === "*" ? (watched[0]?.raw ?? "") : filter)}
        open={(id, addr) => {
          if (id === "sentinel-diff") compareAddress(addr);
          open(id);
        }}
      />
    );
  if (page === "sentinel-guardian" || page === "sentinel-graph")
    return (
      <Guardian
        navigate={open}
        graph={page === "sentinel-graph"}
        open={() => open(page === "sentinel-graph" ? "sentinel-guardian" : "sentinel-graph")}
      />
    );
  return (
    <div className="wallet-form">
      <section className="card">
        <div className="card-head">
          <h2>{isPortfolio ? "Состав портфеля" : "Наблюдаемые кошельки"}</h2>
          <span className="badge">Mainnet</span>
        </div>
        <div className="card-body wallet-form">
          {isWatch && <form
            className="wallet-form"
            onSubmit={(e) => {
              e.preventDefault();
              void add();
            }}
          >
            <label className="sandbox-field">
              Публичный адрес
              <input required value={input} onChange={(e) => setInput(e.target.value)} />
            </label>
            <label className="sandbox-field">
              Название
              <input value={name} maxLength={80} onChange={(e) => rename(e.target.value)} />
            </label>
            <div className="workspace-actions">
              <button className="btn solid">Добавить адрес</button>
            </div>
          </form>}
          {formError && (
            <p role="alert" className="error-box">
              {formError}
            </p>
          )}
          {isPortfolio && <div className="workspace-actions">
            <button className="btn" onClick={() => open("sentinel-watch")}>Управлять кошельками</button>
            <button className="btn" disabled={!points.length} onClick={() => {
              const rows = points.filter(p => p.time >= Date.now() - Number(days) * 86400000)
                .map(p => [new Date(p.time).toISOString(), p.usd].join(","));
              void saveFile("gramix-portfolio.csv", ["UTC,USD", ...rows].join("\r\n"), "text/csv;charset=utf-8");
            }}>Скачать CSV</button>
          </div>}
          {watched.length > 0 && (
            <>
              <Select
                label="Кошельки"
                value={filter}
                onValueChange={setFilter}
                options={[
                  { value: "*", label: "Все кошельки" },
                  ...watched.map((w) => ({ value: w.raw, label: w.label || w.address })),
                ]}
              />
              <div className="tx-input-actions">
                <Select
                  label="Период"
                  value={days}
                  onValueChange={setDays}
                  options={[
                    { value: "1", label: "За день" },
                    { value: "7", label: "За неделю" },
                    { value: "30", label: "За месяц" },
                  ]}
                />
                <button className="btn" disabled={busy} onClick={() => tick((n) => n + 1)}>
                  {busy ? "Обновляю…" : "Обновить"}
                </button>
                {isWatch && filter !== "*" && (
                  <button className="btn" onClick={() => addressBook.update(filter, false, { watch: false })}>
                    Убрать из наблюдения
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </section>
      {error && (
        <p className="error-box" role="alert">
          {error}
        </p>
      )}
      <WalletAssets {...{ hold, points, price, watched, days, isPortfolio }} />
      {isPortfolio && !hold.length && <section className="card"><div className="card-head"><h2>Оценка активов</h2></div>
        <div className="card-body"><p className="muted">{!watched.length ? "Добавьте кошелёк в Watchtower для оценки портфеля." : error ? "Оценка недоступна." : "Загружаю активы…"}</p></div></section>}
      {isWatch && <><WalletActivity {...{ feed, busy, error, open }} hasWallets={watched.length > 0} />
      <section className="card">
        <div className="card-head">
          <h2>Уведомления Telegram</h2>
        </div>
        <div className="card-body wallet-form">
          <p className="muted">
            {__WEB__
              ? "Настройка уведомлений доступна в приложении Gramix для Windows."
              : "Откройте раздел Telegram в настройках, чтобы подключить собственного бота."}
          </p>
          {!__WEB__ && (
            <div className="tx-input-actions">
              <button
                className="btn"
                onClick={() => {
                  open("settings");
                  window.dispatchEvent(new Event("gramix:telegram-settings"));
                }}
              >
                Настройки
              </button>
            </div>
          )}
        </div>
      </section></>}
    </div>
  );
}
