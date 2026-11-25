/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

// Токены адреса и стоимость портфеля. Загрузка — при открытии вкладки или по кнопке.
import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, Coins, RefreshCw, ShieldAlert, Wallet } from "lucide-react";
import { platform } from "@platform";
import { errorText } from "../../lib/errors";
import { formatGram } from "../../lib/format";
import { fiatOf, formatFiatValue, useRates } from "../../lib/market";
import { getTokens, portfolioValue, tokenAmount, tokenValue, type Token } from "../../lib/portfolio";
import { locale } from "../../lib/i18n";

const amountFormat = new Intl.NumberFormat(locale, { maximumFractionDigits: 4 });
const compactFormat = new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 2 });
const formatAmount = (value: number) => value >= 1e9 ? compactFormat.format(value) : amountFormat.format(value);

export function TokenIcon({ token }: { token: Token }) {
  const [broken, setBroken] = useState(false);
  return token.image && !broken ? <img className="token-icon" src={token.image} alt="" onError={() => setBroken(true)} />
    : <span className="token-icon fallback">{token.symbol.slice(0, 2)}</span>;
}

export default function AddressTokens({ raw, testnet }: { raw: string; testnet: boolean }) {
  const [tokens, setTokens] = useState<Token[] | null>(null);
  const [gram, setGram] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showSpam, setShowSpam] = useState(false);
  const { rates, fiat } = useRates(true);

  async function load(force = false) {
    setBusy(true); setError("");
    try {
      const [list, account] = await Promise.all([getTokens(raw, testnet, force),
        platform.fetchAccount(raw, testnet).catch(() => null)]);
      setTokens(list); setGram(account?.balance_nanoton ?? null);
    } catch (cause) { setError(errorText(cause)); }
    finally { setBusy(false); }
  }
  useEffect(() => { setTokens(null); setGram(null); void load(); }, [raw, testnet]);

  const sorted = useMemo(() => [...(tokens ?? [])].sort((a, b) => tokenValue(b, fiat) - tokenValue(a, fiat)), [tokens, fiat]);
  const spam = sorted.filter((token) => token.verification === "blacklist").length;
  const visible = showSpam ? sorted : sorted.filter((token) => token.verification !== "blacklist");
  const total = tokens ? portfolioValue(gram, tokens, rates, fiat) : null;
  const gramValue = gram && rates ? Number(BigInt(gram) / 1_000_000n) / 1000 * rates[fiat] : 0;

  return <div className="address-tokens">
    <div className="portfolio-head">
      <div><span className="muted">Стоимость портфеля</span>
        <b>{total === null ? "…" : formatFiatValue(total, fiat)}</b>
        {tokens && <small className="muted">GRAM и {tokens.filter((token) => token.verification !== "blacklist").length} токенов · спам не учитывается</small>}</div>
      <button type="button" onClick={() => void load(true)} disabled={busy} aria-label="Обновить токены">
        <RefreshCw size={15} className={busy ? "spin" : ""} /></button>
    </div>
    {error && <p className="error-box" role="alert">{error}</p>}
    {tokens && <ul className="token-list">
      {gram !== null && <li className="token-row">
        <span className="token-icon gram"><Wallet size={16} /></span>
        <div className="token-main"><b>GRAM</b><small>Основная монета сети</small></div>
        <div className="token-amount"><b>{formatGram(gram)}</b><small>{fiatOf(gram, rates, fiat)}</small></div>
        {total !== null && total > 0 && <span className="token-share" style={{ width: `${Math.min(100, gramValue / total * 100)}%` }} />}
      </li>}
      {visible.map((token) => {
        const value = tokenValue(token, fiat);
        const falling = token.diff24h.startsWith("−");
        return <li className={`token-row ${token.verification === "blacklist" ? "spam" : ""}`} key={token.master}>
          <TokenIcon token={token} />
          <div className="token-main"><b>{token.name}
            {token.verification === "whitelist" && <BadgeCheck size={13} className="token-verified" aria-label="Проверенный токен" />}
            {token.verification === "blacklist" && <span className="badge fail"><ShieldAlert size={12} /> спам</span>}</b>
            <small>{token.symbol}{token.price && token.diff24h && <span className={falling ? "down" : "up"}> · {token.diff24h} за 24 ч</span>}</small></div>
          <div className="token-amount"><b>{formatAmount(tokenAmount(token))} {token.symbol}</b>
            <small>{token.price ? `≈ ${formatFiatValue(value, fiat)}` : "нет курса"}</small></div>
          {total !== null && total > 0 && value > 0 && <span className="token-share" style={{ width: `${Math.min(100, value / total * 100)}%` }} />}
        </li>;
      })}
    </ul>}
    {tokens && !sorted.length && <p className="address-history-note"><Coins size={15} /> Токенов на адресе нет.</p>}
    {spam > 0 && <button type="button" className="history-spam-toggle" onClick={() => setShowSpam((value) => !value)}>
      {showSpam ? `Скрыть спам (${spam})` : `Скрыто спама: ${spam} · показать`}</button>}
  </div>;
}
