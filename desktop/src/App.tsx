/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { errorText } from "./lib/errors";
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
import { platform } from "@platform";
import { ConsentBanner, telemetry } from "@telemetry";
import { parsePath, pathFor } from "./lib/links";
import type { VanityHandle } from "./platform/types";
import PrivacyPage from "./features/privacy/PrivacyPage";
import SiteFooter from "./components/SiteFooter";
import ToolBoundary from "./components/ToolBoundary";
import AppSidebar from "./components/AppSidebar";
import Notices from "./components/Notices";
import { systemNotify } from "./lib/system-notify";
import { addressBook } from "./lib/addressBook";
import { configureTray, watchTrayHide } from "./lib/tray";
import { formatGram } from "./lib/format";
import { notify } from "./lib/notify";
import { locale } from "./lib/i18n";

const sidecar = "binaries/gramix";
const web = __WEB__;
const initialLocation = web ? parsePath(window.location.pathname) : null;
const ContractBuilder = lazy(() => import("./features/contract-builder/BuilderWorkspace"));
const DeveloperCli = lazy(() => import("./features/developer-cli/CliWorkspace"));
const ContractSandbox = lazy(() => import("./features/contract-sandbox/SandboxWorkspace"));
const isLinux = typeof navigator !== "undefined" && /Linux/i.test(navigator.userAgent);
const fmt = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
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
  const [updateCheckedAt, setUpdateCheckedAt] = useState<number | null>(null);
  const [installedVersion, setInstalledVersion] = useState("");
  const [recentTools, setRecentTools] = useState<ToolId[]>(() => {
    try {
      const stored: unknown = JSON.parse(localStorage.getItem("gramix.ui.recentTools") || "[]");
      return Array.isArray(stored) ? stored.filter((id): id is ToolId =>
        typeof id === "string" && isToolId(id)).slice(0, 4) : [];
    } catch { return []; }
  });
  const [activeTool, setActiveTool] = useState<WorkspaceId>(() => {
    const initial = web ? initialLocation!.workspace : window.location.hash.slice(1);
    const legacy = web ? window.location.hash.slice(1) : "";
    if (web && isWorkspaceId(legacy)) return legacy;
    return isWorkspaceId(initial) ? initial : "overview";
  });
  const vanity = useRef<VanityHandle | null>(null);
  const foundPhrase = useRef<string | null>(null);
  const vanityStarted = useRef(0);
  useEffect(() => {
    if (!web) return;
    // Старые ссылки вида /#tool и прямые ссылки /address/… открываются как обычные страницы.
    if (window.location.hash && isWorkspaceId(window.location.hash.slice(1)))
      window.history.replaceState(null, "", pathFor(window.location.hash.slice(1)));
    const target = initialLocation?.target;
    if (target) window.setTimeout(() => window.dispatchEvent(new CustomEvent(target.event, { detail: target.detail })), 50);
    const follow = () => {
      const next = parsePath(window.location.pathname);
      if (isWorkspaceId(next.workspace)) setActiveTool(next.workspace);
      if (next.target) window.dispatchEvent(new CustomEvent(next.target.event, { detail: next.target.detail }));
    };
    window.addEventListener("popstate", follow);
    return () => window.removeEventListener("popstate", follow);
  }, []);
  useEffect(() => {
    document.title = activeTool === "overview" ? "Gramix — инструменты GRAM"
      : `${activeTool === "settings" ? "Настройки" : activeTool === "privacy" ? "Конфиденциальность"
        : toolTitles[activeTool as ToolId]} · Gramix`;
    telemetry.track({ name: "page_view", path: window.location.pathname, tool: activeTool });
  }, [activeTool]);
  useEffect(() => {
    const clearRecent = () => setRecentTools([]);
    window.addEventListener("gramix:clear-recent-tools", clearRecent);
    return () => window.removeEventListener("gramix:clear-recent-tools", clearRecent);
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
        if (web) window.history.replaceState(null, "", pathFor(target));
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
      localStorage.setItem("gramix.ui.recentTools", JSON.stringify(next));
      return next;
    });
    if (web) {
      if (window.location.pathname !== pathFor(tool)) window.history.pushState(null, "", pathFor(tool));
    } else window.history.replaceState(null, "", `#${tool}`);
    document.querySelector(".main")?.scrollTo(0, 0);
  }
  const running = app.status === "running" || app.status === "paused" ||
    app.status === "initializing" || app.status === "stopping";
  useEffect(() => {
    localStorage.setItem("gramix.compute.gpuDuty", String(app.gpuDuty));
    localStorage.setItem("gramix.compute.cpuThreads", String(app.cpuThreads));
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
    const env: Record<string, string> = { GRAMIX_RESOURCE_DIR: await resourceDir() };
    if (includePassword && isLinux) env.GRAMIX_WALLET_PASSWORD = walletPassword;
    return { env };
  }

  async function refreshDevices() {
    if (web) {
      const threads = platform.browserThreads?.() ?? 1;
      app.set({ devices: [{ id: "browser", name: `Браузер · ${threads} потоков`, vendor: "Web Worker, CPU",
        driver: "", memory_bytes: 0, apis: ["CPU"] }],
        validatedBackends: [{ api: "CPU", device_id: "browser", name: "Браузер" }], selectedDeviceId: "" });
      return;
    }
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
      app.set({ error: errorText(error) });
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => { void refreshDevices(); }, []);
  useEffect(() => {
    if (web) return;
    void configureTray();
    let unlisten: (() => void) | undefined;
    void watchTrayHide().then((stop) => { unlisten = stop; });
    return () => unlisten?.();
  }, []);
  // Наблюдение за адресами из книги: раз в 5 минут, только если хоть один адрес отмечен глазом.
  useEffect(() => {
    let stopped = false;
    async function check() {
      try {
        const changed = await addressBook.refresh(true);
        if (stopped) return;
        for (const { entry, previous } of changed) {
          const name = entry.label || `${entry.address.slice(0, 6)}…${entry.address.slice(-6)}`;
          const delta = BigInt(entry.balance ?? "0") - BigInt(previous);
          const text = `${name}: ${delta > 0n ? "+" : "−"}${formatGram(delta > 0n ? delta : -delta)} · баланс ${formatGram(entry.balance)}`;
          notify({ kind: "info", title: "Баланс изменился", text, duration: 10000 });
          void systemNotify("Gramix: баланс изменился", text);
        }
      } catch { /* сеть недоступна — попробуем в следующий раз */ }
    }
    const timer = window.setInterval(() => { if (addressBook.hasWatched()) void check(); }, 5 * 60_000);
    if (addressBook.hasWatched()) void check();
    return () => { stopped = true; window.clearInterval(timer); };
  }, []);
  useEffect(() => {
    if (!isTauri()) return;
    void getVersion().then(setInstalledVersion);
    void checkUpdate(true);
    const timer = window.setInterval(() => void checkUpdate(true), 6 * 60 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => () => { vanity.current?.stop(); void child.current?.write("STOP\n"); }, []);

  // Проверить latest.json на GitHub. silent — фоновая проверка без сообщений об ошибке.
  async function checkUpdate(silent = false): Promise<Update | null> {
    if (!isTauri()) return null;
    if ((installedVersion || await getVersion()).includes("-dev.")) {
      setUpdateState("Пробная сборка: автообновление отключено.");
      return null;
    }
    if (!await invoke<boolean>("supports_self_update")) {
      setUpdateState("DEB обновляется через пакетный менеджер: скачайте новый .deb из GitHub Releases.");
      return null;
    }
    if (!silent) { setUpdateError(""); setUpdateState("Проверяю GitHub…"); }
    try {
      const update = await check();
      setAvailableUpdate(update);
      setUpdateCheckedAt(Date.now());
      setUpdateState(update ? `Доступна версия ${update.version}` : "Установлена последняя версия.");
      return update;
    } catch (error) {
      if (silent) setUpdateState("Проверка обновлений сейчас недоступна.");
      else { setUpdateError("Не удалось проверить обновления: " + errorText(error)); setUpdateState(""); }
      return null;
    }
  }

  // Кнопка «Обновить»: проверить GitHub и, если вышла новая версия, скачать, установить и перезапустить.
  async function updateNow() {
    if (!isTauri() || updateBusy) return;
    setUpdateBusy(true);
    try {
      const update = availableUpdate ?? await checkUpdate();
      if (!update) return;
      if (running) {
        setUpdateError(`Версия ${update.version} готова. Остановите поиск адреса и нажмите «Обновить» ещё раз.`);
        return;
      }
      setUpdateError("");
      setUpdateState(`Загрузка версии ${update.version}…`);
      let downloaded = 0;
      let total = 0;
      await update.downloadAndInstall((event) => {
        if (event.event === "Started") total = event.data.contentLength ?? 0;
        if (event.event === "Progress") {
          downloaded += event.data.chunkLength;
          setUpdateState(total > 0
            ? `Загрузка версии ${update.version} · ${Math.min(100, Math.round(downloaded / total * 100))}%`
            : `Загрузка версии ${update.version}…`);
        }
        if (event.event === "Finished") setUpdateState("Установка и перезапуск…");
      });
      await relaunch();
    } catch (error) {
      setUpdateError("Не удалось установить обновление: " + errorText(error));
      setUpdateState("");
    } finally {
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
      void systemNotify("Gramix: адрес найден", "Кошелёк с нужным словом найден и сохранён. Откройте Gramix, чтобы посмотреть.");
    } else if (value.startsWith("Checked ")) {
      const match = value.match(/^Checked (\d+) addresses at ([\d.]+)/);
      if (match) {
        app.set({ checked: Number(match[1]) });
        app.addSample(Number(match[2]));
      }
    } else if (value.startsWith("Gramix error: ")) {
      app.set({ error: value.slice("Gramix error: ".length) });
    }
  }

  function startInBrowser() {
    const threadLimit = platform.browserThreads?.() ?? 1;
    const threads = app.cpuThreads > 0 ? Math.min(app.cpuThreads, threadLimit) : threadLimit;
    app.set({ status: "running", checked: 0, rate: 0, samples: [], resultPath: "", error: "" });
    setElapsed(0);
    foundPhrase.current = null;
    vanityStarted.current = performance.now();
    telemetry.track({ name: "vanity_started", pattern: app.pattern, mode: app.matchMode, scheme: app.scheme,
      wallet: app.wallet, threads });
    let lastSample = 0;
    vanity.current = platform.startVanity!({ pattern: app.pattern, mode: app.matchMode, ignoreCase: app.ignoreCase,
      scheme: app.scheme, version: app.wallet, threads }, {
      onProgress: (checked, rate) => {
        app.set({ checked });
        if (performance.now() - lastSample > 950) { lastSample = performance.now(); app.addSample(rate); }
      },
      onFound: (wallet, checked) => {
        vanity.current = null;
        foundPhrase.current = wallet.phrase;
        const seconds = Math.max(0.001, (performance.now() - vanityStarted.current) / 1000);
        const total = Math.max(checked, useApp.getState().checked);
        if (useApp.getState().samples.length === 0) app.addSample(total / seconds);
        app.set({ status: "finished", rate: 0, checked: total, resultPath: wallet.address });
        void systemNotify("Gramix: адрес найден", `Найден адрес ${wallet.address.slice(0, 6)}…${wallet.address.slice(-6)}.`);
        telemetry.track({ name: "vanity_stopped", found: true, checked: useApp.getState().checked,
          seconds: Math.round((performance.now() - vanityStarted.current) / 1000) });
      },
      onError: (message) => { vanity.current = null; app.set({ status: "error", error: message, rate: 0 }); },
    });
  }

  async function start() {
    if (!valid || running) return;
    if (web) { startInBrowser(); return; }
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
        if (line.includes("Gramix error: ")) app.set({ error: line.trim() });
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
      app.set({ status: "error", error: errorText(error) });
    }
  }

  async function stop() {
    if (web) {
      vanity.current?.stop(); vanity.current = null;
      app.set({ status: "finished", rate: 0 });
      telemetry.track({ name: "vanity_stopped", found: false, checked: useApp.getState().checked,
        seconds: Math.round((performance.now() - vanityStarted.current) / 1000) });
      return;
    }
    const process = child.current;
    if (!process) return;
    stopRequested.current = true;
    app.set({ status: "stopping" });
    try {
      await process.write("STOP\n");
    } catch (error) {
      app.set({ error: "Не удалось штатно остановить поиск: " + errorText(error) });
      stopRequested.current = false;
      app.set({ status: "running" });
    }
  }

  async function togglePause() {
    if (web && vanity.current) {
      const wasPaused = app.status === "paused";
      if (wasPaused) vanity.current.resume(); else vanity.current.pause();
      app.set({ status: wasPaused ? "running" : "paused", rate: wasPaused ? app.rate : 0 });
      return;
    }
    if (!child.current || (app.status !== "running" && app.status !== "paused")) return;
    const wasPaused = app.status === "paused";
    try {
      await child.current.write(wasPaused ? "RESUME\n" : "PAUSE\n");
      app.set({ status: wasPaused ? "running" : "paused", rate: wasPaused ? app.rate : 0 });
    } catch (error) {
      app.set({ error: "Не удалось переключить паузу: " + errorText(error) });
    }
  }

  async function reveal() {
    if (!app.resultPath || revealing) return;
    if (web) {
      if (!foundPhrase.current) { app.set({ error: "Фраза уже удалена из памяти страницы." }); return; }
      setRecoveryPhrase(foundPhrase.current); setRevealOpen(true); return;
    }
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
      app.set({ error: errorText(error) });
      setRevealOpen(false);
    } finally {
      setRevealing(false);
    }
  }

  const wide = ["contract-sandbox", "contract-builder", "developer-cli"].includes(activeTool);
  const statusLabel = app.status === "paused" ? "Пауза" : app.status === "initializing" ? "Подготовка"
    : app.status === "stopping" ? "Остановка" : app.status === "running" ? "Поиск активен" : "Готово";
  const screenTitle = activeTool === "overview" ? "Обзор" : activeTool === "settings" ? "Настройки"
    : activeTool === "privacy" ? "Конфиденциальность" : toolTitles[activeTool as ToolId];
  const pageMeta = <div className="page-meta">
    <span className="badge"><ShieldCheck size={13}/>
      {["address-inspector", "transaction-decoder", "contract-inspector"].includes(activeTool)
        ? "Сеть: по запросу" : "Локально"}</span>
    {activeTool === "generator" &&
      <span className={"badge status-badge " + (app.status === "running" ? "ok live" : "")}><span className="status-light"/>{statusLabel}</span>}
  </div>;
  const heading = <div className="screen-heading">{isToolId(activeTool) && <ToolIcon tool={activeTool} className="screen-tool-icon" size={web ? 34 : 28} />}
    <strong>{screenTitle}</strong></div>;
  const liveChip = running && activeTool !== "generator" ? { label: statusLabel, value: fmt.format(app.rate) + " адр/с" } : null;
  const screens = <>
        <div className="tool-screen workspace-screen" hidden={activeTool !== "overview"}>
          <Overview devices={app.devices} backends={app.validatedBackends} recent={recentTools}
            searchStatus={app.status} checked={app.checked} rate={app.rate} version={installedVersion}
            onOpen={openTool} onRefresh={() => void refreshDevices()}
            onPause={() => void togglePause()} onSettings={() => openTool("settings")} /></div>
        {web && <div className="tool-screen workspace-screen" hidden={activeTool !== "privacy"}><PrivacyPage /></div>}
        <div className="tool-screen workspace-screen" hidden={activeTool !== "settings"}>
          <WorkspaceSettings devices={app.devices} backends={app.validatedBackends}
            version={installedVersion} updateState={updateError || updateState}
            updateBusy={updateBusy} updateVersion={availableUpdate?.version ?? ""}
            updateNotes={availableUpdate?.body ?? ""} updateCheckedAt={updateCheckedAt}
            onRefreshDevices={() => void refreshDevices()} onUpdate={() => void updateNow()} /></div>
        <div className="vanity-screen" hidden={activeTool !== "generator"}>
        <div className="intro"><h1>Поиск адреса</h1>
          <p>GRAM · Задайте фрагмент адреса, остальное Gramix проверит локально</p>
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
            <div className="field-help">В GRAM-адресе доступны латинские буквы, цифры, «-» и «_».</div>
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
              <span>Например, «gram» найдёт «GRAM»</span></div>
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
            {!validPattern && app.pattern && <p className="validation">Используйте только символы GRAM-адреса.</p>}
            {isLinux && !walletPasswordReady && <p className="validation">Задайте пароль кошелька от 12 символов в настройках.</p>}
          </section>

          <section className="panel monitor-panel">
            <div className="panel-heading"><div><h2>Поиск в реальном времени</h2><p>Скорость полных GRAM-адресов</p></div>
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
              <div><strong>{web ? "Адрес найден" : "Кошелёк найден и сохранён"}</strong><span>{app.resultPath}</span>
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
                <span>12 слов — BIP39/SLIP-0010; 24 слова — GRAM Native</span></div>
                <UiSelect label="Фраза восстановления" value={app.scheme} disabled={running}
                  onValueChange={(value) => app.set({ scheme: value as typeof app.scheme,
                    backend: value === "24" && ["vulkan", "cuda", "hip"].includes(app.backend)
                      ? "auto" : app.backend })}
                  options={[{ value: "12", label: "12 слов · Multichain" }, { value: "24", label: "24 слова · GRAM Native" }]}/></div>
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
        <div className="tool-screen" hidden={activeTool !== "wallet-generator"}><ToolBoundary name="Новый кошелёк"><WalletGenerator /></ToolBoundary></div>
        <div className="tool-screen" hidden={activeTool !== "wallet-security"}><ToolBoundary name="Проверка кошелька"><WalletSecurity /></ToolBoundary></div>
        <div className="tool-screen" hidden={activeTool !== "address-inspector"}><ToolBoundary name="Проверка адреса"><AddressInspector /></ToolBoundary></div>
        <div className="tool-screen" hidden={activeTool !== "boc-explorer"}><ToolBoundary name="BOC Explorer"><BocExplorer /></ToolBoundary></div>
        <div className="tool-screen" hidden={activeTool !== "transaction-decoder"}><ToolBoundary name="Транзакции"><TransactionDecoder /></ToolBoundary></div>
        <div className="tool-screen" hidden={activeTool !== "contract-inspector"}><ToolBoundary name="Контракты"><ContractInspector /></ToolBoundary></div>
        <div className="tool-screen" hidden={activeTool !== "contract-vanity"}><ToolBoundary name="Contract Vanity"><ContractVanity /></ToolBoundary></div>
        <div className="tool-screen" hidden={activeTool !== "gpu-benchmark"}><ToolBoundary name="GPU Benchmark"><GpuBenchmark /></ToolBoundary></div>
        <div className="tool-screen" hidden={activeTool !== "contract-sandbox"}>
          {(activeTool === "contract-sandbox" || visitedWorkspaces.includes("contract-sandbox")) &&
            <Suspense fallback={<p>Загружаю Sandbox…</p>}>
            <ToolBoundary name="Sandbox"><ContractSandbox /></ToolBoundary></Suspense>}</div>
        <div className="tool-screen" hidden={activeTool !== "contract-builder"}>
          {(activeTool === "contract-builder" || visitedWorkspaces.includes("contract-builder")) &&
            <Suspense fallback={<p>Загружаю редактор…</p>}>
            <ToolBoundary name="Builder"><ContractBuilder /></ToolBoundary></Suspense>}</div>
        <div className="tool-screen" hidden={activeTool !== "developer-cli"}>
          {(activeTool === "developer-cli" || visitedWorkspaces.includes("developer-cli")) &&
            <Suspense fallback={<p>Загружаю терминал…</p>}>
            <ToolBoundary name="Developer CLI"><DeveloperCli /></ToolBoundary></Suspense>}</div>
  </>;
  const gpu = app.validatedBackends.find((backend) => backend.api !== "CPU");
  const layout = web ? <div className={"app-shell" + (wide ? " is-wide" : "")}>
    <div className="main" id="generator">
      <ToolNavigation active={activeTool} onSelect={openTool} live={liveChip}/>
      {!window.isSecureContext && <div className="secure-banner wrap" role="alert">
        Сайт открыт без HTTPS: браузер блокирует создание ключей и буфер обмена.{" "}
        <a href={`https://${window.location.host}${window.location.pathname}`}>Открыть защищённую версию</a></div>}
      <main className={"content wrap" + (wide ? " wide" : "") + (activeTool === "overview" ? " home-content" : "")}>
        {activeTool !== "overview" && <div className="page-title">{heading}{pageMeta}</div>}
        {screens}
      </main>
      <SiteFooter onOpen={openTool} />
    </div>
  </div> : <div className={"app-shell desktop" + (wide ? " is-wide" : "")}>
    <AppSidebar active={activeTool} onSelect={openTool} live={liveChip}
      update={availableUpdate ? { version: availableUpdate.version, busy: updateBusy, onUpdate: () => void updateNow() } : null} />
    <div className="main" id="generator">
      <header className="app-toolbar">{heading}{pageMeta}</header>
      <main className={"content app-content" + (wide ? " wide" : "")}>{screens}</main>
      <footer className="status-bar">
        <span className="status-item"><span className="status-dot ok" />Локально · без телеметрии</span>
        <span className="status-item">{gpu ? `${gpu.name} · ${gpu.api}` : app.devices.length ? "CPU" : "Устройства не найдены"}</span>
        <span className="status-item">Движки: {app.validatedBackends.length ? [...new Set(app.validatedBackends.map((item) => item.api))].join(", ") : "проверка…"}</span>
        <span className="status-spacer" />
        {running && <button type="button" className="status-item status-live" onClick={() => openTool("generator")}>
          <span className="status-dot live" />{statusLabel} · {fmt.format(app.rate)} адр/с · {fmt.format(app.checked)} проверено</button>}
        <span className="status-item">Gramix {installedVersion || "dev"}</span>
      </footer>
    </div>
  </div>;

  return <>
    {layout}
    <Dialog.Root open={revealOpen} onOpenChange={(open) => {
      setRevealOpen(open);
      if (!open) setRecoveryPhrase("");
    }}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay"/>
        <Dialog.Content className="dialog-content" data-telemetry-off="">
          <div className="dialog-shield"><ShieldCheck size={23}/></div>
          <Dialog.Title>Фраза восстановления</Dialog.Title>
          <Dialog.Description>Любой, кто увидит эти слова, сможет управлять кошельком. Сохраните их в безопасном месте.</Dialog.Description>
          {revealing ? <div className="phrase-loading">Расшифровка и проверка адреса…</div>
            : <div className="phrase-grid">{recoveryPhrase.split(" ").map((word, index) =>
              <div className="phrase-word" key={index}><span>{index + 1}</span>{word}</div>)}</div>}
          <div className="dialog-foot"><span>{web
            ? "Фраза есть только в памяти этой вкладки. Запишите её и закройте окно."
            : isLinux
            ? "Файл зашифрован вашим паролем."
            : "Файл зашифрован для вашей учётной записи Windows."}</span>
            <Dialog.Close className="dialog-close">Закрыть</Dialog.Close></div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
    <Notices /><ConsentBanner onPrivacy={() => openTool("privacy")} />
  </>;
}
