/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

// История адреса: события OpenTonAPI (переводы, вызовы контрактов) страницами по 20.
import { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Repeat, ShieldAlert } from "lucide-react";
import { errorText } from "../../lib/errors";
import { formatGram } from "../../lib/format";
import { fiatOf, getHistory, shortAddress, useRates, type HistoryEvent } from "../../lib/market";
import { locale } from "../../lib/i18n";
import { NftCaption, NftThumb } from "../../components/NftCard";

function Counterparty({ raw, name, testnet }: { raw: string; name: string; testnet: boolean }) {
  const [label, setLabel] = useState(name);
  useEffect(() => { if (!name) void shortAddress(raw, testnet).then(setLabel); }, [raw, name, testnet]);
  return <button type="button" className="history-party" title={raw} onClick={() =>
    window.dispatchEvent(new CustomEvent("gramix:inspect-address", { detail: raw }))}>{label || "…"}</button>;
}

export default function AddressHistory({ raw, testnet }: { raw: string; testnet: boolean }) {
  const [events, setEvents] = useState<HistoryEvent[]>([]);
  const [next, setNext] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showSpam, setShowSpam] = useState(false);
  const { rates, fiat } = useRates(loaded);
  const spam = events.filter((event) => event.scam).length;
  const visible = showSpam ? events : events.filter((event) => !event.scam);
  useEffect(() => { setEvents([]); setNext(null); setLoaded(false); setError(""); }, [raw, testnet]);

  async function load(more = false) {
    if (busy) return;
    setBusy(true); setError("");
    try {
      const page = await getHistory(raw, testnet, more ? next ?? undefined : undefined);
      setEvents((current) => more ? [...current, ...page.events.filter((item) => !current.some((old) => old.id === item.id))] : page.events);
      setNext(page.events.length ? page.next : null);
      setLoaded(true);
    } catch (cause) { setError(errorText(cause)); }
    finally { setBusy(false); }
  }

  return <div className="address-history">
    <div className="address-history-head"><h3 className="sr-only">История транзакций</h3>
      <button type="button" onClick={() => void load()} disabled={busy}>
        {busy && !events.length ? "Загружаю…" : loaded ? "Обновить" : "Показать историю"}</button></div>
    {!loaded && !error && <p className="address-history-note">Последние операции адреса: переводы, вызовы контрактов, токены. Адрес будет отправлен в OpenTonAPI.</p>}
    {error && <p className="error-box" role="alert">{error}</p>}
    {loaded && !events.length && !error && <p className="address-history-note">У адреса ещё нет операций.</p>}
    {spam > 0 && <button type="button" className="history-spam-toggle" onClick={() => setShowSpam((value) => !value)}>
      {showSpam ? `Скрыть спам (${spam})` : `Скрыто спама: ${spam} · показать`}</button>}
    {visible.length > 0 && <ol className="history-list">
      {visible.map((event) => event.actions.map((action, index) => {
        const Icon = action.direction === "in" ? ArrowDownLeft : action.direction === "out" ? ArrowUpRight : Repeat;
        const sign = action.direction === "in" ? "+" : action.direction === "out" ? "−" : "";
        return <li key={`${event.id}-${index}`} className={`history-item ${action.direction} ${action.ok ? "" : "failed"} ${action.nft ? "nft" : ""}`}>
          {action.nft ? <NftThumb raw={action.nft} testnet={testnet} /> : <span className="history-icon"><Icon size={16} /></span>}
          <div className="history-main">
            <div className="history-line"><b>{action.title}</b>
              {action.nft && <NftCaption raw={action.nft} testnet={testnet} />}
              {event.scam && <span className="badge fail"><ShieldAlert size={12} /> спам</span>}
              {!action.ok && <span className="badge fail">ошибка</span>}
              {event.pending && <span className="badge">в обработке</span>}</div>
            <div className="history-sub">
              {action.counterparty && <>{action.direction === "in" ? "от " : action.direction === "out" ? "кому " : ""}
                <Counterparty raw={action.counterparty.raw} name={action.counterparty.name} testnet={testnet} /> · </>}
              <time dateTime={new Date(event.time * 1000).toISOString()}>{new Date(event.time * 1000).toLocaleString(locale,
                { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</time>
              {event.tx && index === 0 && <> · <button type="button" className="history-party" onClick={() => {
                window.location.hash = "transaction-decoder";
                window.setTimeout(() => window.dispatchEvent(new CustomEvent("gramix:transaction-id", { detail: event.tx })), 0);
              }}>транзакция</button></>}
            </div>
            {action.comment && <p className="history-comment" title={action.comment}>{action.comment}</p>}
          </div>
          <div className="history-amount">
            {action.amountNano ? <><b>{sign}{formatGram(action.amountNano)}</b>
              {rates && <small>{fiatOf(action.amountNano, rates, fiat)}</small>}</> : action.value && <b>{action.value}</b>}
          </div>
        </li>;
      }))}
    </ol>}
    {next && events.length > 0 && <button type="button" className="history-more" disabled={busy} onClick={() => void load(true)}>
      {busy ? "Загружаю…" : "Показать ещё"}</button>}
  </div>;
}
