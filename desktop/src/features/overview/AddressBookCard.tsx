/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

// Адресная книга на «Обзоре»: свои и чужие публичные адреса, балансы, наблюдение за изменениями.
import { useState, type FormEvent } from "react";
import { Copy, Eye, EyeOff, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import { copyText } from "../../lib/clipboard";
import { platform } from "@platform";
import { addressBook, useAddressBook, type BookEntry } from "../../lib/addressBook";
import { errorText } from "../../lib/errors";
import { formatGram } from "../../lib/format";
import { fiatOf, formatFiatValue, useRates } from "../../lib/market";
import { notify } from "../../lib/notify";
import { domainFromInput, resolveDomain } from "../../lib/domain";

const short = (value: string) => value.length > 16 ? `${value.slice(0, 6)}…${value.slice(-6)}` : value;

function Row({ entry }: { entry: BookEntry }) {
  const { rates, fiat } = useRates(entry.balance !== null);
  const [label, setLabel] = useState(entry.label);
  return <li className="book-row">
    <div className="book-main">
      <input className="book-label" value={label} placeholder="Подпись" maxLength={80} aria-label="Подпись адреса"
        onChange={(event) => setLabel(event.target.value)}
        onBlur={() => { if (label !== entry.label) addressBook.update(entry.raw, entry.testnet, { label }); }}
        onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} />
      <span className="book-address"><code title={entry.address}>{short(entry.address)}</code>
        {entry.testnet && <span className="badge">testnet</span>}
        <button type="button" className="book-copy" title="Копировать адрес" aria-label="Копировать адрес" onClick={() =>
          void copyText(entry.address).then(() => notify({ kind: "ok", text: "Адрес скопирован." }),
            () => notify({ kind: "error", text: "Не удалось скопировать адрес." }))}><Copy size={12} /></button></span>
    </div>
    <div className="book-balance">{entry.balance === null ? <small className="muted">баланс не загружен</small> : <>
      <b>{formatGram(entry.balance)}</b>{rates && <small>{fiatOf(entry.balance, rates, fiat)}</small>}
      {rates && entry.tokens && entry.tokens[fiat] >= 0.01 && <small className="book-portfolio" title="GRAM и токены без спама">портфель ≈ {formatFiatValue(
        Number(BigInt(entry.balance) / 1_000_000n) / 1000 * rates[fiat] + entry.tokens[fiat], fiat)}</small>}</>}</div>
    <div className="book-actions">
      <button type="button" className={entry.watch ? "on" : ""} aria-pressed={entry.watch}
        title={entry.watch ? "Не следить за балансом" : "Следить за балансом"}
        onClick={() => addressBook.update(entry.raw, entry.testnet, { watch: !entry.watch })}>
        {entry.watch ? <Eye size={15} /> : <EyeOff size={15} />}</button>
      <button type="button" title="Открыть в «Проверке адреса»" onClick={() => {
        window.location.hash = "address-inspector";
        window.setTimeout(() => window.dispatchEvent(new CustomEvent("gramix:inspect-address", { detail: entry.address })), 0);
      }}><Search size={15} /></button>
      <button type="button" title="Удалить из книги" onClick={() => {
        addressBook.remove(entry.raw, entry.testnet);
        notify({ kind: "info", text: `Удалено: ${entry.label || short(entry.address)}` });
      }}><Trash2 size={15} /></button>
    </div>
  </li>;
}

export default function AddressBookCard() {
  const book = useAddressBook();
  const [address, setAddress] = useState("");
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const watched = book.filter((item) => item.watch).length;

  async function add(event: FormEvent) {
    event.preventDefault();
    try {
      const value = address.trim();
      const domain = domainFromInput(value);
      const found = domain ? await resolveDomain(domain) : null;
      const result = await platform.inspectAddress(found ? found.raw : value);
      const testnet = result.input_testnet === true;
      addressBook.add({ raw: result.raw, address: result.input_format === "friendly" ? value : result.non_bounceable,
        label: label || (found ? found.domain : ""), testnet });
      setAddress(""); setLabel("");
    } catch (error) { notify({ kind: "error", title: "Адрес не добавлен", text: errorText(error) }); }
  }
  async function refresh() {
    setBusy(true);
    try {
      const changed = await addressBook.refresh();
      notify({ kind: "ok", text: changed.length ? `Балансы обновлены, изменилось: ${changed.length}.` : "Балансы обновлены." });
    } catch (error) { notify({ kind: "error", title: "Балансы не обновлены", text: errorText(error) }); }
    finally { setBusy(false); }
  }

  return <section className="card book-card" aria-labelledby="book-title">
    <div className="card-head"><h2 id="book-title">Адресная книга</h2>
      <span className="muted">{book.length ? `${book.length} · слежу за ${watched}` : "пусто"}</span>
      {book.length > 0 && <button type="button" className="card-link" disabled={busy} onClick={() => void refresh()}>
        <RefreshCw size={14} className={busy ? "spin" : ""} /> Балансы</button>}</div>
    <div className="card-body">
      <form className="book-add" onSubmit={(event) => void add(event)}>
        <input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Адрес, name.ton или @username"
          aria-label="Адрес для книги" spellCheck={false} autoComplete="off" maxLength={130} />
        <input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Подпись" aria-label="Подпись" maxLength={80} />
        <button type="submit" className="btn" disabled={!address.trim()}><Plus size={15} /> Добавить</button>
      </form>
      {book.length ? <ul className="book-list">{book.map((entry) => <Row key={`${entry.testnet}:${entry.raw}`} entry={entry} />)}</ul>
        : <p className="muted book-empty">Сохраняйте адреса, чтобы видеть их балансы здесь. Значок глаза включает наблюдение:
          {__WEB__ ? " пока страница открыта," : " пока Gramix запущен,"} баланс проверяется раз в 5 минут, об изменениях придёт уведомление.</p>}
    </div>
  </section>;
}
