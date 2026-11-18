/*
 * Copyright (C) 2026 [COPYRIGHT HOLDER].
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of VANTIX.
 *
 * VANTIX is dual-licensed under the GNU Affero General
 * Public License v3.0 and a separate commercial license.
 *
 * See LICENSE and LICENSING.md for details.
 */

import { useEffect, useRef, useState } from "react";
import { Command, type Child } from "@tauri-apps/plugin-shell";
import { isTauri } from "@tauri-apps/api/core";
import { getVersion } from "@tauri-apps/api/app";
import * as RadixCheckbox from "@radix-ui/react-checkbox";
import { Check, Download, Play, Square, Trash2 } from "lucide-react";
import BenchmarkChart, { type BenchmarkSample, type BenchmarkSeries } from "./BenchmarkChart";
import { useApp } from "../../store";
import Select from "../../components/ui/Select";
import CopyButton from "../../components/ui/CopyButton";
import { readBenchmarkHistory, saveBenchmarkHistory,
  type BenchmarkReport, type BenchmarkResult } from "./benchmarkHistory";

type Report = BenchmarkReport;

async function measure(backend: string, current: { child: Child | null }, cancelled: { value: boolean }) {
  return await new Promise<Omit<Report, "measuredAt" | "os" | "version">>(async (resolve, reject) => {
    let stdout = "";
    let stderr = "";
    let settled = false;
    const command = Command.sidecar("binaries/vantix", ["--benchmark-json", "--backend", backend]);
    command.stdout.on("data", (chunk) => { if (stdout.length < 256_000) stdout += chunk; });
    command.stderr.on("data", (chunk) => { if (stderr.length < 16_000) stderr += chunk; });
    command.on("error", (cause) => {
      if (!settled) { settled = true; reject(new Error(String(cause))); }
    });
    command.on("close", (event) => {
      current.child = null;
      if (settled) return;
      settled = true;
      if (cancelled.value) { reject(new Error("Измерение остановлено.")); return; }
      if (event.code !== 0) { reject(new Error(stderr.trim() || "Бенчмарк завершился с ошибкой.")); return; }
      try { resolve(JSON.parse(stdout) as Omit<Report, "measuredAt" | "os" | "version">); }
      catch { reject(new Error("Ядро вернуло некорректный JSON бенчмарка.")); }
    });
    try {
      current.child = await command.spawn();
      if (cancelled.value) await current.child.kill();
      if (settled) current.child = null;
    }
    catch (cause) { if (!settled) { settled = true; reject(cause); } }
  });
}

export default function GpuBenchmark() {
  const validated = useApp((state) => state.validatedBackends);
  const devices = useApp((state) => state.devices);
  const [engine, setEngine] = useState("cpu");
  const [duration, setDuration] = useState(15);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reports, setReports] = useState<Report[]>(readBenchmarkHistory);
  const [samples, setSamples] = useState<BenchmarkSample[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [sort, setSort] = useState<"time" | "rate" | "device">("time");
  const [selected, setSelected] = useState<string | null>(null);
  const [compared, setCompared] = useState<string[]>([]);
  const child = useRef<{ child: Child | null }>({ child: null });
  const cancelled = useRef({ value: false });
  useEffect(() => () => { cancelled.current.value = true; void child.current.child?.kill(); }, []);
  useEffect(() => { saveBenchmarkHistory(reports); }, [reports]);
  useEffect(() => {
    const clear = () => { cancelled.current.value = true; void child.current.child?.kill();
      setReports([]); setSamples([]); setSelected(null); setCompared([]); };
    window.addEventListener("vantix:clear-benchmark-history", clear);
    return () => window.removeEventListener("vantix:clear-benchmark-history", clear);
  }, []);

  const available = new Set(validated.map((item) => item.api.toLowerCase()));
  available.add("cpu");
  const allRows = reports.flatMap((report, runIndex) => report.results.map((item) => ({
    ...item, runIndex, measuredAt: report.measuredAt, version: report.version, os: report.os,
  })));
  const rowId = (row: (typeof allRows)[number]) => `${row.runIndex}:${row.api}:${row.device_id}`;
  const rows = [...allRows].sort((a, b) => sort === "rate"
    ? b.addresses_per_second - a.addresses_per_second
    : sort === "device" ? a.name.localeCompare(b.name)
      : b.measuredAt.localeCompare(a.measuredAt));
  const activeSeries = new Set(samples.flatMap((sample) => Object.keys(sample.rates)));
  const series: BenchmarkSeries[] = [...new Map(allRows.filter((row) =>
    activeSeries.has(`${row.api}:${row.device_id}`)).map((row) => {
    const key = `${row.api}:${row.device_id}`;
    return [key, { key, label: `${row.name} · ${row.api}`, color: "" }];
  })).values()].map((item, index) => ({ ...item,
    color: ["#8774e1", "#3ddc6a", "#ff9f0a", "#32ade6", "#ff6b66", "#ff2d55"][index % 6] }));
  const compareRows = compared.map((id) => rows.find((row) => rowId(row) === id))
    .filter((row): row is (typeof rows)[number] => Boolean(row));

  async function run() {
    setError("");
    if (!isTauri()) { setError("Аппаратный тест доступен в установленном приложении VANTIX."); return; }
    if (busy || (engine !== "auto" && !available.has(engine))) {
      setError("Выбранный движок не прошёл самопроверку."); return;
    }
    cancelled.current.value = false;
    setBusy(true);
    setSamples([]);
    setCompared([]);
    setElapsed(0);
    try {
      const version = await getVersion();
      const started = performance.now();
      while (!cancelled.current.value) {
        const parsed = await measure(engine, child.current, cancelled.current);
        if (cancelled.current.value) break;
        if (parsed.source !== "local" || parsed.metric !== "verified_ton_addresses_per_second" ||
            !Array.isArray(parsed.results) || !parsed.results.length || parsed.results.some((item) =>
              !Number.isFinite(item.addresses_per_second) || item.addresses_per_second < 0))
          throw new Error("Некорректный результат бенчмарка.");
        const seconds = Math.round((performance.now() - started) / 100) / 10;
        setElapsed(seconds);
        setReports((previous) => [...previous.slice(-79), { ...parsed,
          results: parsed.results.map((item: BenchmarkResult) => ({ ...item,
            driver: devices.find((device) => device.id === item.device_id)?.driver })),
          measuredAt: new Date().toISOString(), os: navigator.userAgent, version }]);
        setSamples((previous) => [...previous.slice(-255), { seconds,
          rates: Object.fromEntries(parsed.results.map((item) =>
            [`${item.api}:${item.device_id}`, item.addresses_per_second])) }]);
        if (performance.now() - started >= duration * 1000) break;
      }
    } catch (cause) { if (!cancelled.current.value) setError(String(cause)); }
    finally { child.current.child = null; setBusy(false); }
  }

  async function stop() {
    cancelled.current.value = true;
    try { await child.current.child?.kill(); }
    catch (cause) { setError("Не удалось остановить измерение: " + String(cause)); }
  }

  function exportFile(format: "json" | "csv") {
    const body = format === "json" ? JSON.stringify(reports, null, 2) :
      ["measured_at,api,device_id,name,verified_ton_addresses_per_second",
        ...reports.flatMap((report) => report.results.map((item) =>
          [report.measuredAt, item.api, item.device_id, item.name, item.addresses_per_second]
            .map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")))].join("\n");
    const url = URL.createObjectURL(new Blob([body], { type: format === "json" ? "application/json" : "text/csv" }));
    const link = document.createElement("a"); link.href = url;
    link.download = `vantix-benchmark.${format}`; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const chosen = rows.find((row) => rowId(row) === selected) ?? rows[0];
  return <section className="panel gpu-benchmark" id="gpu-benchmark" aria-labelledby="benchmark-title">
    <div className="panel-heading"><div>
      <h2 id="benchmark-title">GPU Benchmark</h2>
      <p>Полный TON-пайплайн: только результаты движков, прошедших самопроверку</p>
    </div></div>
    <div className="benchmark-toolbar">
      <label>Движок<Select label="Движок" value={engine} disabled={busy} onValueChange={setEngine}
        options={[{ value: "cpu", label: "CPU" },
          ...(["vulkan", "cuda", "hip"] as const).filter((api) => available.has(api))
            .map((api) => ({ value: api, label: api === "hip" ? "HIP / ROCm" : api.toUpperCase() })),
          { value: "auto", label: "Все проверенные" }]} /></label>
      <label>Длительность<Select label="Длительность" value={String(duration)} disabled={busy}
        onValueChange={(value) => setDuration(Number(value))}
        options={[15, 30, 60, 120].map((seconds) => ({ value: String(seconds), label: `${seconds} сек` }))} /></label>
      <button type="button" className="benchmark-start" disabled={busy} onClick={() => void run()}>
        <Play size={17} /> {reports.length ? "Повторить" : "Запустить"}</button>
      {busy && <button type="button" className="benchmark-stop" onClick={() => void stop()}>
        <Square size={16} /> Остановить</button>}
    </div>
    <p className="benchmark-note">Каждая точка — завершённый тест полного TON-пайплайна с разогревом. Линии показывают только измеренные устройства.</p>
    {error && <p className="error-box" role="alert">{error}</p>}
    <div className="benchmark-chart-panel"><div className="benchmark-chart-header">
      <strong>Скорость по времени</strong><span role="status">{busy ? `Измерение · ${elapsed.toFixed(1)} с` :
        reports.length ? `${reports.length} сохранённых проходов` : "Нет измерений"}</span></div>
      {samples.length ? <BenchmarkChart samples={samples} series={series} />
        : <div className="benchmark-chart-empty">График нового измерения появится после завершённого прохода. Предыдущие результаты — в таблице.</div>}
      <button type="button" className="benchmark-clear" disabled={busy || samples.length === 0}
        onClick={() => setSamples([])}><Trash2 size={15} /> Очистить график</button>
    </div>
    {rows.length > 0 && <div className="benchmark-results"><div className="benchmark-results-heading"><h3>Результаты измерений</h3>
      <div><button type="button" onClick={() => exportFile("json")}><Download size={15} /> JSON</button>
        <button type="button" onClick={() => exportFile("csv")}><Download size={15} /> CSV</button></div></div>
      <div className="benchmark-table-wrap"><table><thead><tr>
        <th>Сравнить</th>
        <th><button type="button" onClick={() => setSort("time")}>Время</button></th>
        <th><button type="button" onClick={() => setSort("device")}>Устройство</button></th>
        <th>API</th><th><button type="button" onClick={() => setSort("rate")}>Адресов/с</button></th>
      </tr></thead><tbody>{rows.map((row) => <tr key={rowId(row)}
        className={rowId(chosen) === rowId(row) ? "selected" : ""} onClick={() => setSelected(rowId(row))}>
        <td onClick={(event) => event.stopPropagation()}><RadixCheckbox.Root className="ui-checkbox"
          checked={compared.includes(rowId(row))} aria-label={`Сравнить ${row.name}, ${row.measuredAt}`}
          onCheckedChange={(checked) => setCompared((current) => checked
            ? current.includes(rowId(row)) ? current : [...current.slice(-1), rowId(row)]
            : current.filter((id) => id !== rowId(row)))}>
          <RadixCheckbox.Indicator className="ui-checkbox-indicator"><Check size={14} /></RadixCheckbox.Indicator>
        </RadixCheckbox.Root></td>
        <td>{new Date(row.measuredAt).toLocaleTimeString("ru-RU")}</td>
        <td>{row.name}</td><td>{row.api}</td><td>{row.addresses_per_second.toFixed(1)}</td>
      </tr>)}</tbody></table></div>
      {compareRows.length === 2 && <div className="benchmark-comparison" role="status">
        <div><strong>Первое измерение</strong><span>{compareRows[0].name} · {compareRows[0].api}</span>
          <b>{compareRows[0].addresses_per_second.toFixed(1)} адресов/с</b></div>
        <div><strong>Второе измерение</strong><span>{compareRows[1].name} · {compareRows[1].api}</span>
          <b>{compareRows[1].addresses_per_second.toFixed(1)} адресов/с</b></div>
        <p>{compareRows[0].addresses_per_second > 0
          ? `Разница: ${((compareRows[1].addresses_per_second /
              compareRows[0].addresses_per_second - 1) * 100).toFixed(1)}% относительно первого измерения.`
          : "Процентная разница не рассчитывается при нулевой скорости первого измерения."}</p>
      </div>}
      {chosen && <div className="benchmark-inspector"><div><strong>{chosen.name}</strong>
        <span>{chosen.api} · {chosen.addresses_per_second.toFixed(1)} проверенных адресов/с</span>
        <small>{chosen.version} · {chosen.os}{chosen.driver ? ` · драйвер ${chosen.driver}` : ""}</small></div>
        <CopyButton value={JSON.stringify(chosen, null, 2)} /></div>}
    </div>}
    <p className="benchmark-limit">Отдельные SHA/PBKDF2/Ed25519 операции этим тестом не измеряются. Температура и VRAM не показываются без проверенного датчика.</p>
  </section>;
}
