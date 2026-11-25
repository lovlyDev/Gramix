/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

import { Wallet, Coins } from "lucide-react";
import { TokenIcon } from "../address-inspector/AddressTokens";
import { NftTile } from "../address-inspector/AddressNfts";
import { formatGram } from "../../lib/format";
import { formatFiatValue } from "../../lib/market";
import { tokenAmount, tokenValue } from "../../lib/portfolio";
import type { BookEntry } from "../../lib/addressBook";
import SmoothChart from "../../components/SmoothChart";
import type { Holding, Sample } from "./useWalletMonitor";
export function WalletAssets({
  hold,
  points,
  price,
  watched,
  days,
  isPortfolio,
}: {
  hold: Holding[];
  points: Sample[];
  price: number;
  watched: BookEntry[];
  days: string;
  isPortfolio: boolean;
}) {
  if (!hold.length) return null;
  const visible = points.filter((p) => p.time > Date.now() - Number(days) * 86400000);
  const total = points.at(-1)?.usd ?? 0;
  const allocation = new Map<string, { label: string; value: number }>();
  if (isPortfolio)
    for (const r of hold) {
      allocation.set("gram", {
        label: "GRAM",
        value: (allocation.get("gram")?.value ?? 0) + (Number(r.balance ?? 0) / 1e9) * price,
      });
      for (const t of r.tokens) {
        if (t.price)
          allocation.set(t.master, {
            label: t.symbol,
            value: (allocation.get(t.master)?.value ?? 0) + tokenValue(t, "usd"),
          });
      }
    }
  return (
    <section className="card">
      <div className="card-head">
        <h2>{isPortfolio ? "Оценка активов" : "Балансы"}</h2>
        {isPortfolio && (
          <b>{points.length ? formatFiatValue(points.at(-1)!.usd, "usd") : "Оценка неполная"}</b>
        )}
      </div>
      <div className="card-body wallet-form">
        {hold.map((r) => {
          const wallet = watched.find((e) => e.raw === r.raw);
          return (
            <section key={r.raw}>
              <div className="contract-code-title">
                <strong>{wallet?.label || r.raw.slice(0, 8) + "…" + r.raw.slice(-6)}</strong>
                <span>{wallet?.address || r.raw}</span>
              </div>
              <ul className="token-list">
                <li className="token-row">
                  <span className="token-icon gram">
                    <Wallet size={16} />
                  </span>
                  <div className="token-main">
                    <b>GRAM</b>
                    <small>Основная монета сети</small>
                  </div>
                  <div className="token-amount">
                    <b>{r.balance === null ? "Баланс недоступен" : formatGram(r.balance)}</b>
                    {isPortfolio && r.balance !== null && (
                      <small>{formatFiatValue((Number(r.balance) / 1e9) * price, "usd")}</small>
                    )}
                  </div>
                </li>
                {isPortfolio &&
                  r.tokens.map((t) => (
                    <li key={t.master} className="token-row">
                      <TokenIcon token={t} />
                      <div className="token-main">
                        <b>{t.name}</b>
                        <small>{t.symbol}</small>
                      </div>
                      <div className="token-amount">
                        <b>
                          {tokenAmount(t).toLocaleString()} {t.symbol}
                        </b>
                        <small>
                          {t.price ? formatFiatValue(tokenValue(t, "usd"), "usd") : "Нет котировки"}
                        </small>
                      </div>
                    </li>
                  ))}
              </ul>
              {isPortfolio && r.nfts.length > 0 && (
                <div className="address-nfts">
                  <div className="card-head">
                    <h3>NFT</h3>
                    <span className="badge">{r.nfts.length}</span>
                  </div>
                  <div className="nft-grid">
                    {r.nfts.map((n) => (
                      <NftTile key={n.raw} nft={n} testnet={false} />
                    ))}
                  </div>
                </div>
              )}
            </section>
          );
        })}
        {!isPortfolio && visible.length > 0 && (
          <SmoothChart
            ariaLabel="История баланса GRAM"
            labels={visible.map((p) => new Date(p.time).toLocaleString())}
            series={[
              { key: "gram", label: "GRAM", color: "var(--accent)", values: visible.map((p) => p.usd) },
            ]}
            zeroBase={false}
          />
        )}
        {isPortfolio && (
          <>
            <h3>Распределение активов</h3>
            <ul className="token-list">
              {[...allocation]
                .sort((a, b) => b[1].value - a[1].value)
                .map(([key, a]) => {
                  const share = total ? (100 * a.value) / total : 0;
                  return (
                    <li key={key} className="token-row">
                      <span className={"token-icon " + (key === "gram" ? "gram" : "fallback")}>
                        {key === "gram" ? <Wallet size={16} /> : <Coins size={16} />}
                      </span>
                      <div className="token-main">
                        <b>{a.label}</b>
                      </div>
                      <div className="token-amount">
                        <b>{formatFiatValue(a.value, "usd")}</b>
                        <small>{share.toLocaleString(undefined, { maximumFractionDigits: 1 })} %</small>
                      </div>
                      <span className="token-share" style={{ width: Math.min(100, share) + "%" }} />
                    </li>
                  );
                })}
            </ul>
            <p className="field-help">
              OpenTonAPI · {price} USD за GRAM. Активы без котировки исключены из денежной оценки. История
              накапливается при обновлениях.
            </p>
            {visible.length > 0 && (
              <SmoothChart
                labels={visible.map((p) => new Date(p.time).toLocaleString())}
                ariaLabel="История стоимости USD"
                series={[
                  { key: "USD", label: "USD", color: "var(--accent)", values: visible.map((p) => p.usd) },
                ]}
                zeroBase={false}
              />
            )}
          </>
        )}
      </div>
    </section>
  );
}
