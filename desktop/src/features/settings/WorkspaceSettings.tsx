/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

import { useEffect, useState } from "react";
import { copyText } from "../../lib/clipboard";
import * as Tabs from "@radix-ui/react-tabs";
import * as Switch from "@radix-ui/react-switch";
import * as Dialog from "@radix-ui/react-dialog";
import { Send, Activity, BarChart3, Cpu, FolderOpen, Info, Minus, Monitor, Network, Plus, RefreshCw, ShieldCheck } from "lucide-react";
import { exportFolder } from "../../lib/save";
import { notify } from "../../lib/notify";
import { errorText } from "../../lib/errors";
import { language, setLanguage, type Language } from "../../lib/i18n";
import { closeToTrayEnabled, setCloseToTray } from "../../lib/tray";
import { SYSTEM_NOTIFY_KEY, ensureSystemNotifyPermission, systemNotify, systemNotifyEnabled } from "../../lib/system-notify";
import { platform } from "@platform";
import { telemetry } from "@telemetry";
import type { Device, ValidatedBackend } from "../../store";
import { useApp, type Backend } from "../../store";
import Select from "../../components/ui/Select";
import { BENCHMARK_HISTORY_KEY } from "../gpu-benchmark/benchmarkHistory";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import AboutWorkspace from "./AboutWorkspace";
import { locale } from "../../lib/i18n";

type Theme = "oled" | "dark" | "light";
type Density = "comfortable" | "compact";
const themes: Theme[] = ["oled", "dark", "light"];
const densities: Density[] = ["comfortable", "compact"];
function readOption<T extends string>(key: string, values: readonly T[], fallback: T): T {
  const stored = localStorage.getItem(key);
  return values.find((value) => value === stored) ?? fallback;
}

const web = platform.kind === "web";

import TelegramSettings from "../sentinel/TelegramSettings";

export default function WorkspaceSettings({ devices, backends, version, updateState,
  updateBusy, updateVersion, updateNotes, updateCheckedAt, onRefreshDevices, onUpdate }: {
  devices: Device[]; backends: ValidatedBackend[]; version: string; updateState: string;
  updateBusy: boolean; updateVersion: string; updateNotes: string; updateCheckedAt: number | null;
  onRefreshDevices: () => void; onUpdate: () => void;
}) {
  const [consent, setConsent] = useState(telemetry.consent() === "granted");
  const [theme, setTheme] = useState<Theme>(() => readOption("gramix.ui.theme", themes, "dark"));
  const [density, setDensity] = useState<Density>(() => readOption("gramix.ui.density", densities, "comfortable"));
  const [lowMotion, setLowMotion] = useState(() => localStorage.getItem("gramix.ui.lowMotion") === "true");
  const [section, setSection] = useState("interface");
  useEffect(() => {
    if (__WEB__) return;
    const show = () => setSection("telegram");
    window.addEventListener("gramix:telegram-settings", show);
    return () => window.removeEventListener("gramix:telegram-settings", show);
  }, []);
  const [defaultNetwork, setDefaultNetwork] = useState<"mainnet" | "testnet">(() =>
    localStorage.getItem("gramix.network.default") === "testnet" ? "testnet" : "mainnet");
  const [historyStatus, setHistoryStatus] = useState("");
  const [clearHistoryOpen, setClearHistoryOpen] = useState(false);
  const [systemNotices, setSystemNotices] = useState(systemNotifyEnabled);
  const [tray, setTray] = useState(closeToTrayEnabled);
  async function toggleSystemNotices(value: boolean) {
    if (value && !await ensureSystemNotifyPermission()) {
      notify({ kind: "error", text: "Система не разрешила уведомления Gramix. Включите их в параметрах уведомлений." });
      return;
    }
    setSystemNotices(value);
    try { localStorage.setItem(SYSTEM_NOTIFY_KEY, String(value)); } catch { /* приватный режим */ }
  }
  const [folder, setFolder] = useState<string | null>(null);
  useEffect(() => { if (!web) void exportFolder.get().then(setFolder).catch(() => setFolder(null)); }, []);
  async function chooseFolder() {
    try { const value = await exportFolder.choose(); if (value) { setFolder(value); notify({ kind: "ok", text: `Файлы будут сохраняться в ${value}` }); } }
    catch (error) { notify({ kind: "error", text: errorText(error) }); }
  }
  async function askEveryTime() {
    try { await exportFolder.clear(); setFolder(null); notify({ kind: "info", text: "Путь будет спрашиваться при каждом сохранении." }); }
    catch (error) { notify({ kind: "error", text: errorText(error) }); }
  }
  const app = useApp();
  const running = ["running", "paused", "initializing", "stopping"].includes(app.status);
  const supported = new Set(backends.map((backend) => backend.api.toLowerCase()));
  const gpuDevices = devices.filter((device) => backends.some((backend) =>
    backend.device_id === device.id && backend.api.toLowerCase() !== "cpu"));
  const maxThreads = Math.max(1, navigator.hardwareConcurrency || 1);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("gramix.ui.theme", theme);
  }, [theme]);
  useEffect(() => {
    document.documentElement.dataset.density = density;
    localStorage.setItem("gramix.ui.density", density);
  }, [density]);
  useEffect(() => {
    document.documentElement.dataset.lowMotion = String(lowMotion);
    localStorage.setItem("gramix.ui.lowMotion", String(lowMotion));
  }, [lowMotion]);
  useEffect(() => {
    localStorage.setItem("gramix.network.default", defaultNetwork);
    window.dispatchEvent(new CustomEvent("gramix:default-network", { detail: defaultNetwork }));
  }, [defaultNetwork]);
  return <div className="workspace-settings-page">
    <div className="settings-intro"><p>Внешний вид, устройства и сведения о приложении.</p></div>
    <Tabs.Root value={section} onValueChange={setSection} className="settings-layout">
      <Tabs.List className="settings-tabs" aria-label="Разделы настроек">
        <Tabs.Trigger value="interface"><Monitor size={18} /> Интерфейс</Tabs.Trigger>
        {!web && <Tabs.Trigger value="compute"><Cpu size={18} /> Вычисления</Tabs.Trigger>}
        {!__WEB__ && <Tabs.Trigger value="telegram"><Send size={18} /> Telegram</Tabs.Trigger>}
        <Tabs.Trigger value="network"><Network size={18} /> Сеть</Tabs.Trigger>
        <Tabs.Trigger value="security"><ShieldCheck size={18} /> Безопасность</Tabs.Trigger>
        {web && telemetry.enabled && <Tabs.Trigger value="privacy"><BarChart3 size={18} /> Статистика</Tabs.Trigger>}
        {!web && <Tabs.Trigger value="files"><FolderOpen size={18} /> Файлы</Tabs.Trigger>}
        {!web && <Tabs.Trigger value="updates"><RefreshCw size={18} /> Обновления</Tabs.Trigger>}
        {!web && <Tabs.Trigger value="diagnostics"><Activity size={18} /> Диагностика</Tabs.Trigger>}
        {!web && <Tabs.Trigger value="about"><Info size={18} /> О программе</Tabs.Trigger>}
      </Tabs.List>
      <div className="settings-content">
        {!__WEB__ && <Tabs.Content value="telegram"><TelegramSettings /></Tabs.Content>}
        <Tabs.Content value="interface"><div className="settings-panel-heading"><h2>Интерфейс</h2>
          <p>Параметры сохраняются только на этом компьютере.</p></div>
          <div className="settings-control"><div><strong>Язык · Language</strong>
            <span>Интерфейс перезагрузится на выбранном языке.</span></div>
            <Select label="Язык интерфейса" value={language} onValueChange={(value) => setLanguage(value as Language)}
              options={[{ value: "ru", label: "Русский" }, { value: "en", label: "English" }]} /></div>
          <div className="settings-control"><div><strong>Тема</strong><span>Тёмная используется по умолчанию, OLED — для экранов с чистым чёрным.</span></div>
            <div className="settings-theme-options" role="group" aria-label="Тема интерфейса">
              {([["oled", "OLED"], ["dark", "Тёмная"], ["light", "Светлая"]] as const).map(([value, label]) =>
                <button type="button" key={value} aria-pressed={theme === value}
                  onClick={() => setTheme(value)}><span className={`theme-swatch ${value}`} />{label}</button>)}</div></div>
          <div className="settings-control"><div><strong>Плотность</strong><span>Компактный режим уменьшает отступы в списках.</span></div>
            <div className="settings-segment" role="group" aria-label="Плотность интерфейса">
              <button type="button" aria-pressed={density === "comfortable"} onClick={() => setDensity("comfortable")}>Обычная</button>
              <button type="button" aria-pressed={density === "compact"} onClick={() => setDensity("compact")}>Компактная</button>
            </div></div>
          <div className="settings-control"><div><strong>Меньше движения</strong><span>Отключить необязательные анимации.</span></div>
            <Switch.Root className="settings-switch" checked={lowMotion} onCheckedChange={setLowMotion}
              aria-label="Меньше движения"><Switch.Thumb /></Switch.Root></div>
          {!web && <div className="settings-control"><div><strong>Уведомления системы</strong>
            <span>Сообщить в Windows, когда найден адрес или закончился замер, если окно Gramix свёрнуто или неактивно.</span></div>
            <div className="workspace-actions"><button type="button" className="settings-secondary" disabled={!systemNotices}
              onClick={() => void systemNotify("Gramix", "Так выглядят уведомления о готовых задачах.", { force: true })}>Проверить</button>
              <Switch.Root className="settings-switch" checked={systemNotices} onCheckedChange={(value) => void toggleSystemNotices(value)}
                aria-label="Уведомления системы"><Switch.Thumb /></Switch.Root></div></div>}
          {!web && <div className="settings-control"><div><strong>Сворачивать в трей при закрытии</strong>
            <span>Крестик окна прячет Gramix в область уведомлений: поиск адреса и наблюдение за балансами продолжаются. Выход — через меню значка.</span></div>
            <Switch.Root className="settings-switch" checked={tray} onCheckedChange={(value) => { setTray(value); setCloseToTray(value); }}
              aria-label="Сворачивать в трей при закрытии"><Switch.Thumb /></Switch.Root></div>}
        </Tabs.Content>
        <Tabs.Content value="compute"><div className="settings-panel-heading"><h2>Вычисления</h2>
          <p>Готовность движка определяется самопроверкой ядра.</p></div>
          <button type="button" className="settings-secondary" onClick={onRefreshDevices}><RefreshCw size={16} /> Обновить устройства</button>
          <div className="workspace-compute-list">{devices.map((device) => <div key={device.id}>
            <strong>{device.name}</strong><span>{backends.filter((backend) => backend.device_id === device.id)
              .map((backend) => backend.api).join(", ") || "Проверенных движков нет"}</span></div>)}
            {devices.length === 0 && <p>Устройства пока не обнаружены.</p>}</div>
          <div className="settings-control"><div><strong>Движок поиска</strong>
            <span>GPU режимы доступны после успешной самопроверки.</span></div>
            <Select label="Движок поиска" value={app.backend} disabled={running}
              onValueChange={(value) => app.set({ backend: value as Backend })}
              options={[{ value: "auto", label: "Auto" }, { value: "cpu", label: "CPU" },
                ...(["vulkan", "cuda", "hip"] as const).filter((api) =>
                  supported.has(api) && app.scheme === "12")
                  .map((api) => ({ value: api, label: api.toUpperCase() })),
                ...(gpuDevices.length ? [{ value: "hybrid", label: "CPU + GPU" }] : [])]}/></div>
          {gpuDevices.length > 0 && <div className="settings-control"><div><strong>GPU для поиска</strong>
            <span>Выбирайте устройство с проверенным backend.</span></div>
            <Select label="GPU для поиска" value={app.selectedDeviceId || "all"} disabled={running}
              onValueChange={(value) => app.set({ selectedDeviceId: value === "all" ? "" : value })}
              options={[{ value: "all", label: "Все подходящие" },
                ...gpuDevices.map((device) => ({ value: device.id, label: device.name }))]}/></div>}
          <div className="settings-control"><div><strong>Потоки CPU</strong>
            <span>0 — автоматический выбор ядра. Доступно до {maxThreads} логических потоков.</span></div>
            <div className="settings-stepper" role="group" aria-label="Потоки CPU">
              <button type="button" aria-label="Уменьшить число потоков CPU"
                disabled={running || app.cpuThreads === 0}
                onClick={() => app.set({ cpuThreads: Math.max(0, app.cpuThreads - 1) })}>
                <Minus size={15} /></button>
              <output aria-live="polite">{app.cpuThreads}</output>
              <button type="button" aria-label="Увеличить число потоков CPU"
                disabled={running || app.cpuThreads >= maxThreads}
                onClick={() => app.set({ cpuThreads: Math.min(maxThreads, app.cpuThreads + 1) })}>
                <Plus size={15} /></button>
            </div></div>
          <div className="settings-control"><div><strong>Нагрузка GPU</strong>
            <span>Паузы между пакетами, не аппаратный лимит мощности.</span></div>
            <div className="settings-range"><input type="range" min="30" max="100" step="5"
              value={app.gpuDuty} disabled={running}
              onChange={(event) => app.set({ gpuDuty: Number(event.target.value) })}/>
              <strong>{app.gpuDuty}%</strong></div></div>
        </Tabs.Content>
        <Tabs.Content value="network"><div className="settings-panel-heading"><h2>Сеть</h2>
          <p>Локальные инструменты не требуют подключения.</p></div>
          <div className="settings-control"><div><strong>Сеть по умолчанию</strong>
            <span>Используется при новом открытии сетевых инструментов.</span></div>
            <Select label="Сеть по умолчанию" value={defaultNetwork}
              onValueChange={(value) => setDefaultNetwork(value as typeof defaultNetwork)}
              options={[{ value: "mainnet", label: "Mainnet" }, { value: "testnet", label: "Testnet" }]}/></div>
          <div className="settings-control"><div><strong>Публичный API</strong>
            <span>Запрос выполняется только после явного действия в инструменте.</span></div><code>tonapi.io</code></div>
        </Tabs.Content>
        <Tabs.Content value="security"><div className="settings-panel-heading"><h2>Безопасность</h2>
          <p>Секреты кошелька не входят в историю инструментов и диагностический отчёт.</p></div>
          {web ? <div className="settings-control"><div><strong>Фразы восстановления на сайте</strong>
            <span>Фраза нового кошелька создаётся в браузере и не сохраняется. Ввод своей фразы доступен только в приложении.</span></div>
            <span>Только в памяти</span></div>
          : <div className="settings-control"><div><strong>Зашифрованный файл кошелька</strong>
            <span>На Windows фраза защищена учётной записью пользователя; на Linux требуется пароль.</span></div>
            <span>Локально</span></div>}
          <div className="settings-control"><div><strong>Раскрытие фразы</strong>
            <span>Только после явного подтверждения. Окно закрывается через 45 секунд.</span></div>
            <span>Подтверждение</span></div>
          <div className="settings-control"><div><strong>История инструментов</strong>
            <span>Недавние экраны и результаты Benchmark без секретов.</span></div>
            <button className="settings-secondary" onClick={() => setClearHistoryOpen(true)}>Очистить историю</button></div>
          {historyStatus && <p role="status">{historyStatus}</p>}
        </Tabs.Content>
        {web && <Tabs.Content value="privacy"><div className="settings-panel-heading"><h2>Статистика</h2>
          <p>Сайт отправляет события только с вашего согласия. Фразы, ключи и файлы не отправляются никогда.</p></div>
          <div className="settings-control"><div><strong>Отправлять статистику</strong>
            <span>Обезличенный ID устройства, страницы, нажатия и проверенные публичные адреса.</span></div>
            <Switch.Root className="settings-switch" aria-label="Отправлять статистику" checked={consent}
              onCheckedChange={(value) => { telemetry.setConsent(value); setConsent(value); }}><Switch.Thumb /></Switch.Root></div>
          <div className="settings-control"><div><strong>Политика конфиденциальности</strong>
            <span>Что собирается, где хранится и как удалить данные.</span></div>
            <a className="settings-secondary" href="/privacy">Открыть</a></div>
        </Tabs.Content>}
        <Tabs.Content value="updates"><div className="settings-panel-heading"><h2>Обновления</h2>
          <p>Установленная версия: {version || "определяется"}</p></div>
          <p className="settings-status" role="status">{updateState || "Состояние обновлений пока неизвестно."}
            {updateCheckedAt && <small> · проверено в {new Date(updateCheckedAt).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}</small>}</p>
          {updateVersion && updateNotes && <div className="update-notes"><b>Что нового в {updateVersion}</b>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{updateNotes}</ReactMarkdown></div>}
          <div className="workspace-actions"><button type="button" className="update-button" disabled={updateBusy}
            onClick={onUpdate}><RefreshCw size={16} className={updateBusy ? "spin" : ""} />
            {updateBusy ? "Обновление…" : updateVersion ? `Обновить до ${updateVersion}` : "Обновить"}</button></div>
          <p className="update-hint">Gramix проверяет GitHub Releases при запуске и каждые 6 часов. Перед установкой
            приложение проверяет подпись обновления, затем перезапускается само.</p>
        </Tabs.Content>
        <Tabs.Content value="files"><div className="settings-panel-heading"><h2>Файлы</h2>
          <p>Куда сохранять экспорт: JSON, CSV, BOC, QR-коды и отчёты.</p></div>
          <div className="settings-control"><div><strong>Папка для сохранения</strong>
            <span>{folder ? "Файлы сохраняются сюда без вопросов; одноимённые файлы не перезаписываются." : "Сейчас путь спрашивается при каждом сохранении."}</span>
            {folder && <code className="settings-path" title={folder}>{folder}</code>}</div>
            <div className="workspace-actions"><button type="button" className="settings-secondary" onClick={() => void chooseFolder()}>
              <FolderOpen size={16} /> {folder ? "Изменить" : "Выбрать папку"}</button>
              {folder && <button type="button" className="settings-secondary" onClick={() => void askEveryTime()}>Спрашивать каждый раз</button>}</div></div>
        </Tabs.Content>
        <Tabs.Content value="diagnostics"><div className="settings-panel-heading"><h2>Диагностика</h2>
          <p>Публичные сведения без кошельков, фраз и паролей.</p></div>
          <button type="button" className="settings-secondary" onClick={() => {
            const publicInfo = { version, platform: navigator.platform,
              devices: devices.map((device) => ({ name: device.name, vendor: device.vendor,
                driver: device.driver, apis: device.apis })) };
            void copyText(JSON.stringify(publicInfo, null, 2))
              .then(() => notify({ kind: "ok", text: "Публичные сведения скопированы." }))
              .catch(() => notify({ kind: "error", text: "Не удалось скопировать сведения." }));
          }}>Копировать сведения о системе</button>
        </Tabs.Content>
        <Tabs.Content value="about"><div className="settings-panel-heading"><h2>О программе</h2>
          <p>Gramix {version || "Preview"} · GRAM Workspace</p></div>
          <AboutWorkspace version={version} />
        </Tabs.Content>
      </div>
    </Tabs.Root>
    <Dialog.Root open={clearHistoryOpen} onOpenChange={setClearHistoryOpen}>
      <Dialog.Portal><Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content">
          <Dialog.Title>Очистить историю?</Dialog.Title>
          <Dialog.Description>Будут удалены недавние инструменты и сохранённые измерения Benchmark на этом компьютере.</Dialog.Description>
          <div className="settings-clear-actions">
            <Dialog.Close className="dialog-close">Отмена</Dialog.Close>
            <button type="button" className="dialog-close settings-clear-confirm" onClick={() => {
              localStorage.removeItem("gramix.ui.recentTools");
              localStorage.removeItem(BENCHMARK_HISTORY_KEY);
              window.dispatchEvent(new Event("gramix:clear-recent-tools"));
              window.dispatchEvent(new Event("gramix:clear-benchmark-history"));
              setHistoryStatus("История инструментов и измерений очищена.");
              setClearHistoryOpen(false);
            }}>Очистить</button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  </div>;
}
