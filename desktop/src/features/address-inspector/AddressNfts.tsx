/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

// Галерея NFT адреса: сетка карточек с фильтром по коллекциям. Клик открывает голографическую карточку.
import { useEffect, useMemo, useState } from "react";
import { Gem, Send } from "lucide-react";
import { errorText } from "../../lib/errors";
import { getAccountNfts, type NftInfo } from "../../lib/nft";
import { DnsArt, NftDialog } from "../../components/NftCard";

export function NftTile({ nft, testnet }: { nft: NftInfo; testnet: boolean }) {
  const [broken, setBroken] = useState(false);
  return <NftDialog raw={nft.raw} testnet={testnet} trigger={
    <button type="button" className={`nft-tile ${nft.trust === "blacklist" ? "spam" : ""} ${nft.telegram ? "telegram" : ""}`} title={nft.name}>
      <span className="nft-tile-art">{nft.dns ? <DnsArt name={nft.name} /> : nft.image && !broken
        ? <img src={nft.image} alt="" loading="lazy" draggable={false} onError={() => setBroken(true)} />
        : <span className="nft-noimage"><Gem size={30} /></span>}
        {!nft.telegram && <span className="nft-tile-foil" aria-hidden="true" />}</span>
      <span className="nft-tile-text"><b>{nft.name}</b><small>{nft.collection || "Без коллекции"}</small></span>
    </button>} />;
}

const ALL = "__all"; const TELEGRAM = "__telegram";

export default function AddressNfts({ raw, testnet }: { raw: string; testnet: boolean }) {
  const [items, setItems] = useState<NftInfo[]>([]);
  const [next, setNext] = useState<number | null>(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState(ALL);
  const [showSpam, setShowSpam] = useState(false);

  async function load(offset: number) {
    setBusy(true); setError("");
    try {
      const page = await getAccountNfts(raw, testnet, offset);
      setItems((current) => offset === 0 ? page.items : [...current, ...page.items.filter((item) => !current.some((old) => old.raw === item.raw))]);
      setNext(page.next);
    } catch (cause) { setError(errorText(cause)); }
    finally { setBusy(false); }
  }
  useEffect(() => { setItems([]); setNext(0); setFilter(ALL); void load(0); }, [raw, testnet]);

  const isJunk = (item: NftInfo) => item.trust === "blacklist" || item.junk;
  const clean = showSpam ? items : items.filter((item) => !isJunk(item));
  const spam = items.filter(isJunk).length;
  const collections = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of clean) if (!item.telegram) counts.set(item.collection || "Без коллекции", (counts.get(item.collection || "Без коллекции") ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
  }, [clean]);
  const telegram = clean.filter((item) => item.telegram).length;
  const shown = clean.filter((item) => filter === ALL ? true : filter === TELEGRAM ? item.telegram
    : !item.telegram && (item.collection || "Без коллекции") === filter);

  return <div className="address-nfts">
    {clean.length > 0 && <div className="nft-filters" role="group" aria-label="Коллекции">
      <button type="button" aria-pressed={filter === ALL} onClick={() => setFilter(ALL)}>Все · {clean.length}</button>
      {telegram > 0 && <button type="button" className="tg" aria-pressed={filter === TELEGRAM} onClick={() => setFilter(TELEGRAM)}>
        <Send size={13} /> Telegram · {telegram}</button>}
      {collections.map(([name, count]) => <button type="button" key={name} aria-pressed={filter === name}
        onClick={() => setFilter(name)}>{name} · {count}</button>)}
    </div>}
    {error && <p className="error-box" role="alert">{error}</p>}
    {!busy && !error && items.length === 0 && <p className="address-history-note"><Gem size={15} /> NFT на адресе нет.</p>}
    {shown.length > 0 && <div className="nft-grid">{shown.map((nft) => <NftTile key={nft.raw} nft={nft} testnet={testnet} />)}</div>}
    {busy && <div className="nft-grid">{Array.from({ length: items.length ? 4 : 8 }, (_, index) =>
      <span key={index} className="nft-tile placeholder"><span className="nft-skeleton" /></span>)}</div>}
    <div className="nft-footer">
      {spam > 0 && <button type="button" className="history-spam-toggle" onClick={() => setShowSpam((value) => !value)}>
        {showSpam ? `Скрыть спам и NFT без названия (${spam})` : `Скрыто спама и NFT без названия: ${spam} · показать`}</button>}
      {next !== null && items.length > 0 && <button type="button" className="history-more" disabled={busy} onClick={() => void load(next)}>
        {busy ? "Загружаю…" : "Показать ещё"}</button>}
    </div>
  </div>;
}
