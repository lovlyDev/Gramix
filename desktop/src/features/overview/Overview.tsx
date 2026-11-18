/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE and LICENSING.md for details.
 */

import { useState, type ComponentType } from "react";
import { Activity, ChevronRight, CircleCheck, Cpu, Gauge, Pause, Play, RefreshCw,
  Search, ShieldCheck, Zap, type LucideProps } from "lucide-react";
import { ToolIcon, allTools, detectQuery, matchesTool, openSmart, toolAvailable, toolGroups,
  type ToolId, type WorkspaceId } from "../../components/ToolNavigation";
import type { Device, ValidatedBackend } from "../../store";
import { readBenchmarkHistory } from "../gpu-benchmark/benchmarkHistory";

const whole = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 });
const compact = new Intl.NumberFormat("ru-RU", { notation: "compact", maximumFractionDigits: 1 });
const number = (value: number) => value >= 10_000_000 ? compact.format(value) : whole.format(value);

function StatTile({ icon: Icon, color, value, label, onClick }: {
  icon: ComponentType<LucideProps>; color: string; value: string; label: string; onClick: () => void;
}) {
  return <button type="button" className="tile-card" onClick={onClick}>
    <span className="tile" style={{ width: 32, height: 32, backgroundColor: color }} aria-hidden="true">
      <Icon size={19} strokeWidth={2.2} /></span>
    <b>{value}</b><small>{label}</small>
  </button>;
}

export default function Overview({ devices, backends, recent, searchStatus, checked, rate,
  version, onOpen, onRefresh, onPause, onSettings }: {
  devices: Device[]; backends: ValidatedBackend[]; recent: ToolId[];
  searchStatus: string; checked: number; rate: number; version?: string;
  onOpen: (id: WorkspaceId) => void; onRefresh: () => void;
  onPause: () => void; onSettings: () => void;
}) {
  const [query, setQuery] = useState("");
  const active = searchStatus === "running" || searchStatus === "paused";
  const lastBenchmark = readBenchmarkHistory().at(-1);
  const lastResult = lastBenchmark?.results.reduce((best, result) =>
    result.addresses_per_second > best.addresses_per_second ? result : best);
  const apis = [...new Set(backends.map((backend) => backend.api))];
  const smart = detectQuery(query);
  const firstTool = query.trim() ? allTools.find((item) => matchesTool(item, query)) : undefined;

  function submit() {
    if (smart) { openSmart(smart, onOpen); setQuery(""); return; }
    if (firstTool) { onOpen(firstTool.id); setQuery(""); }
  }

  return <div className="overview-page home">
    <section className="hero">
      <h1>Gramix<span className="org">GRAM</span></h1>
      <p>Локальная мастерская GRAM: адреса, кошельки, контракты и GPU в одном окне</p>
      <form className="hero-search search" onSubmit={(event) => { event.preventDefault(); submit(); }}>
        <Search size={19} className="glass" aria-hidden="true" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} spellCheck={false}
          placeholder="GRAM-адрес, хэш транзакции, BOC или инструмент"
          aria-label="Поиск по адресам, транзакциям и инструментам" autoComplete="off" />
      </form>
      <div className="hero-hint" aria-live="polite">{smart
        ? <>Enter — {smart.label.toLocaleLowerCase()}</>
        : firstTool ? <>Enter — открыть «{firstTool.label}»</>
        : query.trim() ? "Совпадений нет" : " "}</div>
      <div className="capsules">
        <button type="button" className="capsule" onClick={() => onOpen("gpu-benchmark")}>
          <span className="mini tile" style={{ backgroundColor: "#34c759" }}><Cpu size={13} /></span>
          <b>{devices.length}</b> {devices.length === 1 ? "устройство" : devices.length >= 2 && devices.length <= 4 ? "устройства" : "устройств"}
          <span className="sep" />
          <span className="cap">{apis.length ? apis.join(" · ") : "движки не проверены"}</span>
        </button>
        <button type="button" className="capsule" onClick={() => onOpen("generator")}>
          <span className="mini tile" style={{ backgroundColor: "#5856d6" }}><Zap size={13} /></span>
          <b>{number(rate)}</b> адресов/с
          <span className={active ? "plus" : "muted"}>{searchStatus === "paused" ? "пауза"
            : active ? "поиск идёт" : "ожидание"}</span>
        </button>
        <button type="button" className="capsule" onClick={onSettings}>
          <span className="mini tile" style={{ backgroundColor: "#007aff" }}><ShieldCheck size={13} /></span>
          Локальный режим{version && <span className="muted">v{version}</span>}
        </button>
      </div>
    </section>

    <div className="tiles">
      <StatTile icon={Activity} color="#5856d6" value={number(rate)} label="Адресов / сек"
        onClick={() => onOpen("generator")} />
      <StatTile icon={CircleCheck} color="#007aff" value={number(checked)} label="Проверено адресов"
        onClick={() => onOpen("generator")} />
      <StatTile icon={Cpu} color="#34c759" value={String(devices.length)} label={`Устройства · ${backends.length} движков`}
        onClick={() => onOpen("gpu-benchmark")} />
      <StatTile icon={Gauge} color="#ff9500" value={lastResult ? number(lastResult.addresses_per_second) : "—"}
        label="Лучший Benchmark" onClick={() => onOpen("gpu-benchmark")} />
    </div>

    {active && <section className="card task-card" aria-label="Активная задача">
      <div className="item task-item">
        <ToolIcon tool="generator" size={40} />
        <div className="main"><b>Поиск GRAM-адреса</b>
          <small className="muted">{searchStatus === "paused" ? "На паузе" : "Работает"} · {whole.format(checked)} проверено · {number(rate)} адресов/с</small></div>
        <div className="task-actions">
          <button type="button" className="btn" onClick={onPause}>{searchStatus === "paused"
            ? <><Play size={15} /> Продолжить</> : <><Pause size={15} /> Пауза</>}</button>
          <button type="button" className="btn solid" onClick={() => onOpen("generator")}>Открыть</button>
        </div>
      </div>
    </section>}

    <div className="grid-3">
      {toolGroups.map((group) => <section className="card" key={group.title} aria-label={group.title}>
        <div className="card-head"><h2>{group.title}</h2><span className="muted">{group.items.filter((item) => toolAvailable(item.id)).length} инструмента</span></div>
        <ul className="list">{group.items.filter((item) => toolAvailable(item.id)).map((item) => <li key={item.id}>
          <button type="button" className="item link tool-item" onClick={() => onOpen(item.id)}>
            <ToolIcon tool={item.id} size={36} />
            <span className="main"><b>{item.label}</b><small className="muted">{item.description}</small></span>
            <ChevronRight size={17} className="chev" aria-hidden="true" />
          </button></li>)}</ul>
      </section>)}
    </div>

    <div className="grid-2">
      <section className="card" aria-labelledby="overview-recent-title">
        <div className="card-head"><h2 id="overview-recent-title">Недавние инструменты</h2></div>
        {recent.filter(toolAvailable).length ? <ul className="list">{recent.filter(toolAvailable).slice(0, 4).map((id) => {
          const item = allTools.find((tool) => tool.id === id);
          return item && <li key={id}><button type="button" className="item link tool-item" onClick={() => onOpen(id)}>
            <ToolIcon tool={id} size={36} />
            <span className="main"><b>{item.label}</b><small className="muted">{item.description}</small></span>
            <ChevronRight size={17} className="chev" aria-hidden="true" /></button></li>;
        })}</ul> : <div className="card-body empty">
          <p className="muted">Вы ещё не открывали инструменты в этой сборке.</p>
          <button type="button" className="btn" onClick={() => onOpen("generator")}>Открыть поиск адреса</button>
        </div>}
      </section>
      <section className="card" aria-labelledby="overview-devices-title">
        <div className="card-head"><h2 id="overview-devices-title">Устройства</h2>
          <button type="button" className="card-link" onClick={onRefresh}><RefreshCw size={14} /> Обновить</button></div>
        {devices.length === 0 ? <div className="card-body empty"><p className="muted">Устройства пока не обнаружены.</p></div>
          : <ul className="list">{devices.map((device) => {
            const verified = backends.filter((backend) => backend.device_id === device.id);
            return <li className="item device-item" key={device.id}>
              <span className="dir"><Cpu size={17} /></span>
              <span className="main"><b>{device.name}</b>
                <small className="muted">{device.vendor}{device.driver ? ` · драйвер ${device.driver}` : ""}</small></span>
              <span className="badges">{verified.length > 0
                ? verified.map((backend) => <span className="badge ok" key={backend.api}>{backend.api}</span>)
                : <span className="badge">не проверен</span>}</span>
            </li>;
          })}</ul>}
        {lastResult && lastBenchmark && <div className="kv overview-kv">
          <div className="k">Последний Benchmark</div>
          <div className="v"><b>{lastResult.addresses_per_second.toFixed(1)}</b> адресов/с · {lastResult.name} · {lastResult.api}
            <small className="muted"> · {new Date(lastBenchmark.measuredAt).toLocaleString("ru-RU")}</small></div>
        </div>}
      </section>
    </div>
  </div>;
}
