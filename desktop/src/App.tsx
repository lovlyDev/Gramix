/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE and LICENSING.md for details.
 */

import { lazy, Suspense, useEffect, useRef, useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import * as Switch from "@radix-ui/react-switch";
import * as Dialog from "@radix-ui/react-dialog";
import { Command, type Child } from "@tauri-apps/plugin-shell";
import { appDataDir, join, resourceDir } from "@tauri-apps/api/path";
import { isTauri } from "@tauri-apps/api/core";
import { invoke } from "@tauri-apps/api/core";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { getVersion } from "@tauri-apps/api/app";
import { ArrowRight, Cpu, Folder, Pause, Play,
  RefreshCw, ShieldCheck, Square, Zap } from "lucide-react";
import RateChart from "./RateChart";
import AddressInspector from "./features/address-inspector/AddressInspector";
import WalletGenerator from "./features/wallet-generator/WalletGenerator";
import WalletSecurity from "./features/wallet-security/WalletSecurity";
import BocExplorer from "./features/boc-explorer/BocExplorer";
import TransactionDecoder from "./features/transaction-decoder/TransactionDecoder";
import ContractInspector from "./features/contract-inspector/ContractInspector";
import ContractVanity from "./features/contract-vanity/ContractVanity";
import GpuBenchmark from "./features/gpu-benchmark/GpuBenchmark";
import Overview from "./features/overview/Overview";
import WorkspaceSettings from "./features/settings/WorkspaceSettings";
import ToolNavigation, { ToolIcon, isToolId, isWorkspaceId, toolTitles, type ToolId, type WorkspaceId } from "./components/ToolNavigation";
import UiSelect from "./components/ui/Select";
import { useApp, type Backend, type Device, type ValidatedBackend } from "./store";

const sidecar = "binaries/vantix";
const ContractBuilder = lazy(() => import("./features/contract-builder/BuilderWorkspace"));
const DeveloperCli = lazy(() => import("./features/developer-cli/CliWorkspace"));
const ContractSandbox = lazy(() => import("./features/contract-sandbox/SandboxWorkspace"));
const isLinux = typeof navigator !== "undefined" && /Linux/i.test(navigator.userAgent);
const fmt = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 });
const apiLabel: Record<string, string> = {
  CPU: "CPU", Vulkan: "Vulkan Compute", CUDA: "CUDA", HIP: "HIP / ROCm"
};

function DeviceCard({ device, backends }: { device: Device; backends: ValidatedBackend[] }) {
  const isCpu = device.apis.includes("CPU");
  return <div className="device-card">
    <div className={"device-icon " + (isCpu ? "cpu" : "gpu")}><Cpu size={23} /></div>
    <div className="device-copy">
      <div className="device-name">{device.name}</div>
      <div className="device-meta">{device.vendor}
        {device.memory_bytes > 0 && " · " + (device.memory_bytes / 2 ** 30).toFixed(1) + " GB"}
        {device.driver && " · драйвер " + device.driver}
      </div>
      <div className="device-apis">{device.apis.map((api) => {
        const ready = backends.some((backend) =>
          backend.device_id === device.id && backend.api === api);
        return <span className={"api-pill " + (ready ? "verified" : "detected")}
          title={ready ? "Проверен и доступен для поиска" : "API обнаружен, движок не прошёл проверку или не установлен"}
          key={api}>{apiLabel[api] ?? api}{ready ? " · готов" : " · обнаружен"}</span>;
      })}</div>
    </div>
    <span className="device-dot" title="Обнаружено" />
  </div>;
}

export default function App() {
  const app = useApp();
  const child = useRef<Child | null>(null);
  const pending = useRef("");
  const stopRequested = useRef(false);
  const [elapsed, setElapsed] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [retune, setRetune] = useState(false);
  const [revealOpen, setRevealOpen] = useState(false);
  const [recoveryPhrase, setRecoveryPhrase] = useState("");
  const [revealing, setRevealing] = useState(false);
  const [walletPassword, setWalletPassword] = useState("");
  const [availableUpdate, setAvailableUpdate] = useState<Update | null>(null);
  const [updateState, setUpdateState] = useState("");
  const [updateError, setUpdateError] = useState("");
  const [updateBusy, setUpdateBusy] = useState(false);
  const [installedVersion, setInstalledVersion] = useState("");
  const [recentTools, setRecentTools] = useState<ToolId[]>(() => {
    try {
      const stored: unknown = JSON.parse(localStorage.getItem("vantix.ui.recentTools") || "[]");
      return Array.isArray(stored) ? stored.filter((id): id is ToolId =>
        typeof id === "string" && isToolId(id)).slice(0, 4) : [];
    } catch { return []; }
  });
  const [activeTool, setActiveTool] = useState<WorkspaceId>(() => {
    const initial = window.location.hash.slice(1);
    return isWorkspaceId(initial) ? initial : "overview";
  });
  useEffect(() => {
    const clearRecent = () => setRecentTools([]);
    window.addEventListener("vantix:clear-recent-tools", clearRecent);
    return () => window.removeEventListener("vantix:clear-recent-tools", clearRecent);
  }, []);
  const [visitedWorkspaces, setVisitedWorkspaces] = useState<WorkspaceId[]>([]);
  useEffect(() => {
    if (!["contract-sandbox", "contract-builder", "developer-cli"].includes(activeTool)) return;
    setVisitedWorkspaces((current) => current.includes(activeTool) ? current : [...current, activeTool]);
  }, [activeTool]);
  useEffect(() => {
    const followHash = () => {
      const target = window.location.hash.slice(1);
      if (isWorkspaceId(target)) {
        setActiveTool(target);
        document.querySelector(".main")?.scrollTo(0, 0);
      }
    };
    window.addEventListener("hashchange", followHash);
    return () => window.removeEventListener("hashchange", followHash);
  }, []);
  function openTool(tool: WorkspaceId) {
    setActiveTool(tool);
    if (isToolId(tool)) setRecentTools((current) => {
      const next = [tool, ...current.filter((id) => id !== tool)].slice(0, 4);
      localStorage.setItem("vantix.ui.recentTools", JSON.stringify(next));
      return next;
    });
    window.history.replaceState(null, "", `#${tool}`);
    document.querySelector(".main")?.scrollTo(0, 0);
  }
  const running = app.status === "running" || app.status === "paused" ||
    app.status === "initializing" || app.status === "stopping";
  useEffect(() => {
    localStorage.setItem("vantix.compute.gpuDuty", String(app.gpuDuty));
    localStorage.setItem("vantix.compute.cpuThreads", String(app.cpuThreads));
  }, [app.gpuDuty, app.cpuThreads]);
  const verifiedGpuIds = new Set(app.validatedBackends
    .filter((backend) => backend.api !== "CPU").map((backend) => backend.device_id));
  const hasGpu = verifiedGpuIds.size > 0;
  const hasBackend = (api: string) => app.validatedBackends.some((backend) =>
    backend.api === api && (!app.selectedDeviceId || backend.device_id === app.selectedDeviceId));
  const validPattern = app.pattern.length > 0 && app.pattern.length <= 48 &&
    /^[A-Za-z0-9_-]+$/.test(app.pattern);
  const walletPasswordReady = !isLinux || (walletPassword.length >= 12 && walletPassword.length <= 1024);
  const valid = validPattern && walletPasswordReady;

  useEffect(() => {
    if (app.status !== "running") return;
    const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [app.status]);

  async function options(includePassword = false) {
    const env: Record<string, string> = { VANTIX_RESOURCE_DIR: await resourceDir() };
    if (includePassword && isLinux) env.VANTIX_WALLET_PASSWORD = walletPassword;
    return { env };
  }

  async function refreshDevices() {
    if (!isTauri()) {
      return;
    }
    setRefreshing(true);
    try {
      const result = await Command.sidecar(sidecar, ["--devices-json"], await options()).execute();
      if (result.code !== 0) throw new Error(result.stderr || "Не удалось получить список устройств");
      const data = JSON.parse(result.stdout) as { devices: Device[] };
      const selectedDeviceId = useApp.getState().selectedDeviceId;
      app.set({ devices: data.devices,
        selectedDeviceId: data.devices.some((device) => device.id === selectedDeviceId)
          ? selectedDeviceId : "", error: "" });
      const checked = await Command.sidecar(sidecar, ["--backends-json"], await options()).execute();
      if (checked.code !== 0) throw new Error(checked.stderr || "Не удалось проверить вычислительные движки");
      const verified = JSON.parse(checked.stdout) as { backends: ValidatedBackend[] };
      app.set({ validatedBackends: verified.backends });
    } catch (error) {
      app.set({ error: String(error) });
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => { void refreshDevices(); }, []);
  useEffect(() => {
    if (!isTauri()) return;
    void getVersion().then(setInstalledVersion);
    let cancelled = false;
    async function findUpdate() {
      try {
        if ((await getVersion()).includes("-dev.")) {
          if (!cancelled) setUpdateState("Пробная сборка: автообновление отключено.");
          return;
        }
        if (!await invoke<boolean>("supports_self_update")) {
          if (!cancelled) setUpdateState("DEB обновляется через пакетный менеджер.");
          return;
        }
        const update = await check();
        if (cancelled) { await update?.close(); return; }
        setAvailableUpdate(update);
        setUpdateState(update ? `Доступна версия ${update.version}` : "Установлена последняя версия.");
      } catch {
        // The first release may have no latest.json yet. Manual retry reports the error.
        if (!cancelled) setUpdateState("Проверка обновлений сейчас недоступна.");
      }
    }
    void findUpdate();
    return () => { cancelled = true; };
  }, []);
  useEffect(() => () => { void child.current?.write("STOP\n"); }, []);

  async function checkUpdate() {
    if (!isTauri() || updateBusy) return;
    if (installedVersion.includes("-dev.")) {
      setUpdateState("Пробная сборка: автообновление отключено.");
      return;
    }
    setUpdateBusy(true);
    setUpdateError("");
    setUpdateState("Проверка версии…");
    try {
      if (!await invoke<boolean>("supports_self_update")) {
        setUpdateState("Для DEB обновление выполняется через пакетный менеджер.");
        return;
      }
      const update = await check();
      setAvailableUpdate(update);
      setUpdateState(update ? "Доступна версия " + update.version : "Установлена последняя версия.");
    } catch (error) {
      setUpdateError("Не удалось проверить обновления: " + String(error));
      setUpdateState("");
    } finally {
      setUpdateBusy(false);
    }
  }

  async function installUpdate() {
    if (!availableUpdate || updateBusy || running) return;
    setUpdateBusy(true);
    setUpdateError("");
    setUpdateState("Загрузка обновления…");
    try {
      let downloaded = 0;
      let total = 0;
      await availableUpdate.downloadAndInstall((event) => {
        if (event.event === "Started") total = event.data.contentLength ?? 0;
        if (event.event === "Progress") {
          downloaded += event.data.chunkLength;
          setUpdateState(total > 0
            ? `Загрузка обновления · ${Math.min(100, Math.round(downloaded / total * 100))}%`
            : "Загрузка обновления…");
        }
        if (event.event === "Finished") setUpdateState("Установка обновления…");
      });
      await relaunch();
    } catch (error) {
      setUpdateError("Не удалось установить обновление: " + String(error));
      setUpdateState("");
      setUpdateBusy(false);
    }
  }

  function handleLine(line: string) {
    const value = line.trim();
    if (!value) return;
    if (value.startsWith("PROGRESS ")) {
      const fields = value.split(/\s+/);
      const checked = Number(fields[1]);
      const rate = Number(fields[2]);
      if (Number.isFinite(checked) && Number.isFinite(rate)) {
        app.set({ checked });
        app.addSample(useApp.getState().status === "paused" ? 0 : rate);
      }
    } else if (value.startsWith("Saved wallet: ")) {
      app.set({ resultPath: value.slice("Saved wallet: ".length) });
    } else if (value.startsWith("Checked ")) {
      const match = value.match(/^Checked (\d+) addresses at ([\d.]+)/);
      if (match) {
        app.set({ checked: Number(match[1]) });
        app.addSample(Number(match[2]));
      }
    } else if (value.startsWith("VANTIX error: ")) {
      app.set({ error: value.slice("VANTIX error: ".length) });
    }
  }

  async function start() {
    if (!valid || running) return;
    if (app.scheme === "24" && ["vulkan", "cuda", "hip"].includes(app.backend)) {
      app.set({ error: "Для 24 слов пока выберите CPU или Auto." });
      return;
    }
    app.set({ status: "initializing", checked: 0, rate: 0, samples: [],
              resultPath: "", error: "" });
    setElapsed(0);
    stopRequested.current = false;
    pending.current = "";
    try {
      const output = await join(await appDataDir(), "matches");
      const args = [
        "--" + app.matchMode, app.pattern,
        "--backend", app.backend,
        "--wallet", app.wallet,
        "--mnemonic", app.scheme,
        "--out", output,
        "--gpu-duty", String(app.gpuDuty),
        "--progress", "--control-stdin"
      ];
      if (app.ignoreCase) args.push("--ignore-case");
      if (app.selectedDeviceId && app.backend !== "cpu")
        args.push("--device", app.selectedDeviceId);
      if (app.cpuThreads > 0) args.push("--threads", String(app.cpuThreads));
      if (retune) args.push("--retune");
      const command = Command.sidecar(sidecar, args, await options(true));
      command.stdout.on("data", (chunk) => {
        pending.current += chunk;
        const lines = pending.current.split(/\r?\n/);
        pending.current = lines.pop() ?? "";
        lines.forEach(handleLine);
      });
      command.stderr.on("data", (line) => {
        if (line.includes("VANTIX error: ")) app.set({ error: line.trim() });
      });
      command.on("close", (event) => {
        handleLine(pending.current);
        pending.current = "";
        child.current = null;
        app.set({ status: event.code === 0 || stopRequested.current ? "finished" : "error",
          rate: 0 });
      });
      child.current = await command.spawn();
      app.set({ status: "running" });
    } catch (error) {
      app.set({ status: "error", error: String(error) });
    }
  }

  async function stop() {
    const process = child.current;
    if (!process) return;
    stopRequested.current = true;
    app.set({ status: "stopping" });
    try {
      await process.write("STOP\n");
    } catch (error) {
      app.set({ error: "Не удалось штатно остановить поиск: " + String(error) });
      stopRequested.current = false;
      app.set({ status: "running" });
    }
  }

  async function togglePause() {
    if (!child.current || (app.status !== "running" && app.status !== "paused")) return;
    const wasPaused = app.status === "paused";
    try {
      await child.current.write(wasPaused ? "RESUME\n" : "PAUSE\n");
      app.set({ status: wasPaused ? "running" : "paused", rate: wasPaused ? app.rate : 0 });
    } catch (error) {
      app.set({ error: "Не удалось переключить паузу: " + String(error) });
    }
  }

  async function reveal() {
    if (!app.resultPath || revealing) return;
    if (!walletPasswordReady) {
      app.set({ error: "Введите пароль кошелька в настройках, чтобы открыть фразу." });
      return;
    }
    setRevealOpen(true);
    setRevealing(true);
    try {
      const result = await Command.sidecar(
        sidecar, ["--reveal", app.resultPath], await options(true)).execute();
      if (result.code !== 0)
        throw new Error(result.stderr || "Не удалось прочитать сохранённый кошелёк");
      setRecoveryPhrase(result.stdout.trim());
    } catch (error) {
      app.set({ error: String(error) });
      setRevealOpen(false);
    } finally {
      setRevealing(false);
    }
  }

  const wide = ["contract-sandbox", "contract-builder", "developer-cli"].includes(activeTool);
  const statusLabel = app.status === "paused" ? "Пауза" : app.status === "initializing" ? "Подготовка"
    : app.status === "stopping" ? "Остановка" : app.status === "running" ? "Поиск активен" : "Готово";
  return <div className={"app-shell" + (wide ? " is-wide" : "")}>
    <div className="main" id="generator">
      <ToolNavigation active={activeTool} onSelect={openTool}
        live={running && activeTool !== "generator" ? { label: statusLabel, value: fmt.format(app.rate) + " адр/с" } : null}/>
      <main className={"content wrap" + (wide ? " wide" : "") + (activeTool === "overview" ? " home-content" : "")}>
        {activeTool !== "overview" && <div className="page-title">
          <div className="screen-heading">{isToolId(activeTool) && <ToolIcon tool={activeTool} className="screen-tool-icon" size={34} />}
            <strong>{activeTool === "settings" ? "Настройки" : toolTitles[activeTool as ToolId]}</strong></div>
          <div className="page-meta">
            <span className="badge"><ShieldCheck size={13}/>
              {["address-inspector", "transaction-decoder", "contract-inspector"].includes(activeTool)
                ? "Сеть: по запросу" : "Локально"}</span>
            {activeTool === "generator" &&
              <span className={"badge status-badge " + (app.status === "running" ? "ok live" : "")}><span className="status-light"/>{statusLabel}</span>}
          </div>
        </div>}
        <div className="tool-screen workspace-screen" hidden={activeTool !== "overview"}>
          <Overview devices={app.devices} backends={app.validatedBackends} recent={recentTools}
            searchStatus={app.status} checked={app.checked} rate={app.rate} version={installedVersion}
            onOpen={openTool} onRefresh={() => void refreshDevices()}
            onPause={() => void togglePause()} onSettings={() => openTool("settings")} /></div>
        <div className="tool-screen workspace-screen" hidden={activeTool !== "settings"}>
          <WorkspaceSettings devices={app.devices} backends={app.validatedBackends}
            version={installedVersion} updateState={updateError || updateState}
            updateBusy={updateBusy} canInstallUpdate={Boolean(availableUpdate) && !running}
            onRefreshDevices={() => void refreshDevices()} onCheckUpdate={() => void checkUpdate()}
            onInstallUpdate={() => void installUpdate()} /></div>
        <div className="vanity-screen" hidden={activeTool !== "generator"}>
        <div className="intro"><h1>Поиск адреса</h1>
          <p>TON · Задайте фрагмент адреса, остальное VANTIX проверит локально</p>
        </div>
        <div className="dashboard-grid">
          <section className="panel search-panel">
            <div className="panel-heading"><div><h2>Создать поиск</h2><p>Адрес с вашим словом или комбинацией</p></div></div>
            <label className="field-label" htmlFor="pattern">Искомый фрагмент</label>
            <div className="pattern-field"><span className="field-caret">/</span>
              <input id="pattern" autoComplete="off" spellCheck={false}
                value={app.pattern} maxLength={48}
                onChange={(event) => app.set({ pattern: event.target.value })}
                placeholder="например, lucky" disabled={running}/></div>
            <div className="field-help">В TON-адресе доступны латинские буквы, цифры, «-» и «_».</div>
            <div className="field-row">
              <div className="field-column"><span className="field-label">Совпадение</span>
                <UiSelect label="Тип совпадения" value={app.matchMode} disabled={running}
                  onValueChange={(value) => app.set({ matchMode: value as typeof app.matchMode })}
                  options={[{ value: "contains", label: "Содержит слово" }, { value: "prefix", label: "Начинается с" }, { value: "suffix", label: "Заканчивается на" }]}/></div>
              <div className="field-column"><span className="field-label">Кошелёк</span>
                <UiSelect label="Версия кошелька" value={app.wallet} disabled={running}
                  onValueChange={(value) => app.set({ wallet: value as typeof app.wallet })}
                  options={[{ value: "v5", label: "Wallet V5R1" }, { value: "v4", label: "Wallet V4R2" }]}/></div>
            </div>
            <div className="toggle-row"><div><strong>Не учитывать регистр</strong>
              <span>Например, «ton» найдёт «TON»</span></div>
              <Switch.Root className="switch" aria-label="Не учитывать регистр" checked={app.ignoreCase} disabled={running}
                onCheckedChange={(value) => app.set({ ignoreCase: value })}><Switch.Thumb className="switch-thumb"/></Switch.Root></div>
            {running ? <div className="action-split">
              <button className="pause-button" onClick={() => void togglePause()}
                disabled={app.status === "initializing" || app.status === "stopping"}>
                {app.status === "paused" ? <Play size={18}/> : <Pause size={18}/>}
                {app.status === "paused" ? "Продолжить" : "Пауза"}</button>
              <button className="stop-button" onClick={() => void stop()}
                disabled={app.status === "stopping" || app.status === "initializing"}>
                <Square size={18}/> Стоп</button></div>
              : <button className="primary-button" onClick={() => void start()} disabled={!valid}>
                  <Zap size={19}/> Начать поиск <ArrowRight size={18}/>
                </button>}
            {!validPattern && app.pattern && <p className="validation">Используйте только символы TON-адреса.</p>}
            {isLinux && !walletPasswordReady && <p className="validation">Задайте пароль кошелька от 12 символов в настройках.</p>}
          </section>

          <section className="panel monitor-panel">
            <div className="panel-heading"><div><h2>Поиск в реальном времени</h2><p>Скорость полных TON-адресов</p></div>
              <span className={"monitor-pill " + (app.status === "running" ? "active" : "")}>{app.status === "paused" ? "Пауза" : app.status === "running" ? "Поиск" : "Ожидание"}</span></div>
            <div className="stats-row"><div className="speed-stat"><span>СКОРОСТЬ</span><strong>{fmt.format(app.rate)}<small> адресов/с</small></strong></div>
              <div><span>ПРОВЕРЕНО</span><strong>{fmt.format(app.checked)}</strong></div>
              <div><span>ВРЕМЯ ПОИСКА</span><strong>{Math.floor(elapsed / 60).toString().padStart(2, "0")}:{(elapsed % 60).toString().padStart(2, "0")}</strong></div></div>
            <div className="chart-area"><div className="chart-caption"><span>ПРОИЗВОДИТЕЛЬНОСТЬ</span><span>ПОСЛЕДНИЕ 60 СЕК</span></div>
              {app.samples.length > 0
                ? <RateChart values={app.samples}/>
                : <div className="chart-empty"><span className="chart-empty-line"/>
                    <span>{running ? "Подготовка данных…" : "График появится после запуска"}</span>
                  </div>}</div>
            {app.resultPath && <div className="result-box"><Folder size={18}/>
              <div><strong>Кошелёк найден и сохранён</strong><span>{app.resultPath}</span>
                <button className="reveal-button" onClick={() => void reveal()}>
                  Показать фразу восстановления</button></div></div>}
            {app.error && <div className="error-box">{app.error}</div>}
          </section>
        </div>

        <section className="panel devices-panel" id="devices">
          <div className="panel-heading"><div><h2>Вычислительные устройства</h2><p>Обнаруженные API проходят проверку при запуске поиска</p></div>
            <button className={"icon-button refresh-button " + (refreshing ? "is-refreshing" : "")}
              title="Обновить устройства" aria-label="Обновить устройства" disabled={refreshing}
              onClick={() => void refreshDevices()}><RefreshCw size={18}/></button></div>
          <div className="device-grid">{app.devices.length
            ? app.devices.map((device) => <DeviceCard key={device.id} device={device}
                backends={app.validatedBackends}/>)
            : <div className="empty-devices">{refreshing ? "Поиск устройств…" : "Устройства пока не обнаружены"}</div>}</div>
          {hasGpu && <div className="device-selector"><span className="field-label">GPU для поиска</span>
            <UiSelect label="GPU для поиска" value={app.selectedDeviceId || "all"}
              disabled={running} onValueChange={(value) => {
                const id = value === "all" ? "" : value;
                const api = app.backend.toUpperCase();
                const supported = app.validatedBackends.some((backend) =>
                  backend.api.toUpperCase() === api && (!id || backend.device_id === id));
                app.set({ selectedDeviceId: id,
                  backend: ["VULKAN", "CUDA", "HIP"].includes(api) && !supported
                    ? "auto" : app.backend });
              }}
              options={[{ value: "all", label: "Все доступные GPU" },
                ...app.devices.filter((device) => verifiedGpuIds.has(device.id))
                  .map((device) => ({ value: device.id, label: device.name }))]}/>
            <span className="device-selector-note">CUDA и HIP появятся как варианты поиска после проверки соответствующих движков.</span>
          </div>}
        </section>

        <section className="panel settings-panel" id="settings">
          <div className="panel-heading"><div><h2>Настройки вычислений</h2><p>Управление режимом поиска</p></div></div>
          <Tabs.Root defaultValue="engine" className="tabs">
            <Tabs.List className="tab-list"><Tabs.Trigger value="engine">Движок</Tabs.Trigger>
              <Tabs.Trigger value="wallet">Кошелёк</Tabs.Trigger></Tabs.List>
            <Tabs.Content value="engine" className="tab-content">
              <div className="setting-row"><div><strong>Вычислительный режим</strong>
                <span>Auto проверяет и выбирает быструю конфигурацию</span></div>
                <UiSelect label="Вычислительный режим" value={app.backend} disabled={running}
                  onValueChange={(value) => app.set({ backend: value as Backend })}
                  options={[{ value: "auto", label: "Auto" }, { value: "cpu", label: "CPU" },
                    ...(app.scheme === "12" && hasBackend("Vulkan") ? [{ value: "vulkan", label: "Vulkan Compute" }] : []),
                    ...(app.scheme === "12" && hasBackend("CUDA") ? [{ value: "cuda", label: "NVIDIA CUDA" }] : []),
                    ...(app.scheme === "12" && hasBackend("HIP") ? [{ value: "hip", label: "AMD HIP / ROCm" }] : []),
                    ...(hasGpu ? [{ value: "hybrid", label: "CPU + GPU" }] : [])]}/></div>
              <div className="setting-row"><div><strong>Нагрузка GPU</strong>
                <span>Регулируется паузами между пакетами</span></div>
                <div className="slider-wrap"><input type="range" min="30" max="100" step="5"
                  value={app.gpuDuty} disabled={running}
                  onChange={(event) => app.set({ gpuDuty: Number(event.target.value) })}/>
                  <strong>{app.gpuDuty}%</strong></div></div>
              <div className="toggle-row"><div><strong>Повторная калибровка</strong>
                <span>Измерить скорость заново при следующем запуске поиска</span></div>
                <Switch.Root className="switch" aria-label="Повторная калибровка" checked={retune} disabled={running}
                  onCheckedChange={setRetune}><Switch.Thumb className="switch-thumb"/></Switch.Root></div>
            </Tabs.Content>
            <Tabs.Content value="wallet" className="tab-content">
              <div className="setting-row"><div><strong>Фраза восстановления</strong>
                <span>12 слов — BIP39/SLIP-0010; 24 слова — TON Native</span></div>
                <UiSelect label="Фраза восстановления" value={app.scheme} disabled={running}
                  onValueChange={(value) => app.set({ scheme: value as typeof app.scheme,
                    backend: value === "24" && ["vulkan", "cuda", "hip"].includes(app.backend)
                      ? "auto" : app.backend })}
                  options={[{ value: "12", label: "12 слов · Multichain" }, { value: "24", label: "24 слова · TON Native" }]}/></div>
              {isLinux && <div className="setting-row"><div><strong>Пароль кошелька</strong>
                <span>Шифрует найденную фразу; храните пароль отдельно. Он не сохраняется приложением.</span></div>
                <input className="wallet-password" type="password" autoComplete="new-password"
                  minLength={12} maxLength={1024} value={walletPassword} disabled={running}
                  onChange={(event) => setWalletPassword(event.target.value)}
                  placeholder="Не менее 12 символов" aria-label="Пароль кошелька"/></div>}
              <div className="info-strip"><ShieldCheck size={17}/>
                Фраза восстановления сохраняется локально вместе с найденным адресом. Не передавайте её другим людям.</div>
            </Tabs.Content>
          </Tabs.Root>
        </section>
        </div>
        <div className="tool-screen" hidden={activeTool !== "wallet-generator"}><WalletGenerator /></div>
        <div className="tool-screen" hidden={activeTool !== "wallet-security"}><WalletSecurity /></div>
        <div className="tool-screen" hidden={activeTool !== "address-inspector"}><AddressInspector /></div>
        <div className="tool-screen" hidden={activeTool !== "boc-explorer"}><BocExplorer /></div>
        <div className="tool-screen" hidden={activeTool !== "transaction-decoder"}><TransactionDecoder /></div>
        <div className="tool-screen" hidden={activeTool !== "contract-inspector"}><ContractInspector /></div>
        <div className="tool-screen" hidden={activeTool !== "contract-vanity"}><ContractVanity /></div>
        <div className="tool-screen" hidden={activeTool !== "gpu-benchmark"}><GpuBenchmark /></div>
        <div className="tool-screen" hidden={activeTool !== "contract-sandbox"}>
          {(activeTool === "contract-sandbox" || visitedWorkspaces.includes("contract-sandbox")) &&
            <Suspense fallback={<p>Загружаю Sandbox…</p>}>
            <ContractSandbox /></Suspense>}</div>
        <div className="tool-screen" hidden={activeTool !== "contract-builder"}>
          {(activeTool === "contract-builder" || visitedWorkspaces.includes("contract-builder")) &&
            <Suspense fallback={<p>Загружаю редактор…</p>}>
            <ContractBuilder /></Suspense>}</div>
        <div className="tool-screen" hidden={activeTool !== "developer-cli"}>
          {(activeTool === "developer-cli" || visitedWorkspaces.includes("developer-cli")) &&
            <Suspense fallback={<p>Загружаю терминал…</p>}>
            <DeveloperCli /></Suspense>}</div>
      </main>
    </div>
    <Dialog.Root open={revealOpen} onOpenChange={(open) => {
      setRevealOpen(open);
      if (!open) setRecoveryPhrase("");
    }}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay"/>
        <Dialog.Content className="dialog-content">
          <div className="dialog-shield"><ShieldCheck size={23}/></div>
          <Dialog.Title>Фраза восстановления</Dialog.Title>
          <Dialog.Description>Любой, кто увидит эти слова, сможет управлять кошельком. Сохраните их в безопасном месте.</Dialog.Description>
          {revealing ? <div className="phrase-loading">Расшифровка и проверка адреса…</div>
            : <div className="phrase-grid">{recoveryPhrase.split(" ").map((word, index) =>
              <div className="phrase-word" key={index}><span>{index + 1}</span>{word}</div>)}</div>}
          <div className="dialog-foot"><span>{isLinux
            ? "Файл зашифрован вашим паролем."
            : "Файл зашифрован для вашей учётной записи Windows."}</span>
            <Dialog.Close className="dialog-close">Закрыть</Dialog.Close></div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  </div>;
}
