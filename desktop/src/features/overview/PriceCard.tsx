/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

// Курс GRAM в рублях или долларах и плавный график цены. Сеть — только после согласия:
// первая загрузка по кнопке, дальше по выбору «загружать автоматически».
import { useEffect, useState } from "react";
import { RefreshCw, TrendingDown, TrendingUp } from "lucide-react";
import SmoothChart from "../../components/SmoothChart";
import { errorText } from "../../lib/errors";
import { formatFiatValue, getPriceChart, getRates, setFiat, useRates, type Fiat, type PricePoint } from "../../lib/market";
import { locale } from "../../lib/i18n";

const AUTO_KEY = "gramix.ui.priceAuto";
const ranges = [{ days: 1, label: "24 ч" }, { days: 7, label: "7 д" }, { days: 30, label: "30 д" }, { days: 90, label: "90 д" }] as const;

export default function PriceCard() {
  const [auto, setAuto] = useState(() => { try { return localStorage.getItem(AUTO_KEY) === "true"; } catch { return false; } });
  const [enabled, setEnabled] = useState(auto);
  const { rates, fiat } = useRates(enabled);
  const [days, setDays] = useState<number>(7);
  const [points, setPoints] = useState<PricePoint[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function load(force = false) {
    setBusy(true); setError("");
    try {
      await getRates(force);
      setPoints(await getPriceChart(fiat, days));
    } catch (cause) { setError(errorText(cause)); }
    finally { setBusy(false); }
  }
  useEffect(() => { if (enabled) void load(); }, [enabled, fiat, days]);

  function start() {
    setEnabled(true); setAuto(true);
    try { localStorage.setItem(AUTO_KEY, "true"); } catch { /* приватный режим */ }
  }

  const price = rates ? rates[fiat] : null;
  const diff = rates?.diff24h[fiat] ?? "";
  const falling = diff.startsWith("−") || diff.startsWith("-");
  const labelFormat = days <= 1 ? { hour: "2-digit", minute: "2-digit" } as const : { day: "numeric", month: "short" } as const;

  return <section className="card price-card" aria-labelledby="price-title">
    <div className="card-head"><h2 id="price-title">Курс GRAM</h2>
      <div className="price-switch" role="group" aria-label="Валюта">
        {(["rub", "usd"] as Fiat[]).map((item) => <button type="button" key={item} aria-pressed={fiat === item}
          onClick={() => setFiat(item)}>{item === "rub" ? "₽" : "$"}</button>)}
        {enabled && <button type="button" className="price-refresh" aria-label="Обновить курс" disabled={busy}
          onClick={() => void load(true)}><RefreshCw size={14} className={busy ? "spin" : ""} /></button>}
      </div></div>
    <div className="card-body">
      {!enabled ? <div className="activity-empty"><TrendingUp size={22} />
        <span>Курс и график цены загружаются из OpenTonAPI. В пересчёт балансов попадёт курс, адреса никуда не отправляются.</span>
        <button type="button" className="btn" onClick={start}>Показать курс</button></div> : <>
        <div className="price-now">
          <b>{price === null ? "…" : formatFiatValue(price, fiat)}</b>
          {diff && <span className={`price-diff ${falling ? "down" : "up"}`}>{falling ? <TrendingDown size={14} /> : <TrendingUp size={14} />}{diff} за 24 ч</span>}
          <div className="price-ranges" role="group" aria-label="Период">
            {ranges.map((range) => <button type="button" key={range.days} aria-pressed={days === range.days}
              onClick={() => setDays(range.days)}>{range.label}</button>)}</div>
        </div>
        {error && <p className="error-box" role="alert">{error}</p>}
        {points.length > 1 && <SmoothChart height={170} zeroBase={false} ariaLabel={`Цена GRAM за ${days} дн.`}
          formatValue={(value) => formatFiatValue(value, fiat)}
          labels={points.map((point) => new Date(point.time * 1000).toLocaleString(locale, labelFormat))}
          series={[{ key: "price", label: "Цена", color: falling ? "#ff453a" : "#30d158", values: points.map((point) => point.price) }]} />}
        {!auto && <p className="muted">Курс загружается по кнопке.</p>}
      </>}
    </div>
  </section>;
}
