/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

import { useEffect, useState } from "react";
import * as Switch from "@radix-ui/react-switch";
import { invoke } from "@tauri-apps/api/core";
import { useAddressBook } from "../../lib/addressBook";
import { openExternal } from "../../lib/external";
import { errorText } from "../../lib/errors";

type Bot = { username:string; pair:string; paired:boolean; running:boolean; autostart:boolean; message:string;
  rules:{ addresses:string[]; minimum:number; kinds?:string[] } };
const call=(action:string,value?:unknown)=>invoke<Bot>("sentinel_bot",{action,value});
export default function TelegramSettings(){
  const [state,set]=useState<Bot|null>(null),[token,setToken]=useState(""),[busy,setBusy]=useState(false);
  const [error,setError]=useState(""),[threshold,edit]=useState<string|null>(null);
  const [kinds,setKinds]=useState<string[]|null>(null),[feedback,feedbackSet]=useState("");
  const activeKinds=kinds??state?.rules.kinds??["TonTransfer","JettonTransfer","NftItemTransfer","SmartContractExec"];
  const addresses=useAddressBook().filter(a=>a.watch&&!a.testnet).map(a=>a.raw);
  useEffect(()=>{let live=true;let loading=false;async function refresh(){
    if(loading)return;loading=true;
    try{const status=await call("status");if(live)set(status)}catch(e){if(live)setError(errorText(e))}finally{loading=false}}
    void refresh();const timer=setInterval(refresh,4000);return()=>{live=false;clearInterval(timer)}},[]);
  async function act(action:string,value?:unknown){
    setBusy(true);setError("");feedbackSet("");
    try{set(await call(action,value));if(action==="token")setToken("");if(action==="rules"){edit(null);setKinds(null)}if(action==="test")feedbackSet("Проверочное уведомление доставлено.")}
    catch(e){setError(errorText(e))}finally{setBusy(false)}
  }
  const configured = Boolean(state?.username);
  const minimum = Number(threshold ?? state?.rules.minimum ?? 0);
  const validMinimum = Number.isSafeInteger(minimum) && minimum >= 0 && minimum <= 1_000_000_000;
  return <>
    <div className="settings-panel-heading"><h2>Telegram</h2>
      <p>Уведомления Watchtower о событиях на выбранных адресах Mainnet.</p></div>
    <form className="settings-control" onSubmit={e=>{
      e.preventDefault();
      if(token.trim()&&!busy&&!state?.running)void act("token",token.trim());
    }}>
      <div><strong><label htmlFor="telegram-token">Токен бота</label></strong>
        <span>{state?.running?"Для замены токена остановите бота.":"Токен от @BotFather"}</span></div>
      <div className="workspace-actions"><input id="telegram-token" className="address-input" type="password"
        autoComplete="new-password" placeholder={configured?"••••••••":"123456:…"}
        value={token} disabled={state?.running} onChange={e=>setToken(e.target.value)}/>
        <button className="settings-secondary" disabled={busy||state?.running||!token.trim()}>Сохранить</button></div>
    </form>
    {state && configured && <>
      <div className="settings-control"><div><strong>@{state.username}</strong>
        <span>{state.running ? state.message || "Запущен" : "Остановлен"}</span></div>
        <button className="settings-secondary" disabled={busy}
          onClick={()=>void act(state.running?"stop":"start")}>{state.running?"Остановить бота":"Запустить бота"}</button></div>
      <div className="settings-control"><div><strong>Личный чат</strong>
        <span>{state.paired?"Чат привязан":state.running?"Откройте чат и нажмите Start.":"Сначала запустите бота."}</span></div>
        {state.paired ? <button className="settings-secondary" disabled={busy} onClick={()=>void act("test")}>Отправить проверочное уведомление</button> :
          <button className="settings-secondary" disabled={busy||!state.running||!state.pair} onClick={()=>openExternal("https://t.me/"+encodeURIComponent(state.username)+"?start="+encodeURIComponent(state.pair))}>Привязать чат Telegram</button>}
      </div>
      <div className="settings-control"><div><strong>Автозапуск бота</strong><span>Запускать бота при входе в Windows</span></div>
        <Switch.Root aria-label="Автозапуск бота" className="settings-switch" disabled={busy} checked={state.autostart} onCheckedChange={v=>void act("autostart",v)}><Switch.Thumb/></Switch.Root></div>
      <div className="settings-control"><div><strong><label htmlFor="sentinel-minimum">Минимальный перевод GRAM</label></strong></div>
        <input className="settings-number" id="sentinel-minimum" type="number" min="0" max="1000000000" step="1" value={threshold??state.rules.minimum} onChange={e=>edit(e.target.value)}/></div>
      {[["TonTransfer","GRAM"],["JettonTransfer","Jetton"],["NftItemTransfer","NFT"],["SmartContractExec","Вызовы контрактов"]].map(([kind,label])=>
        <div className="settings-control" key={kind}><div><strong>{label}</strong></div>
          <Switch.Root className="settings-switch" aria-label={label} checked={activeKinds.includes(kind)}
            onCheckedChange={checked=>setKinds(checked?[...activeKinds,kind]:activeKinds.filter(k=>k!==kind))}><Switch.Thumb/></Switch.Root></div>)}
      <div className="settings-control"><div><strong>Правила уведомлений</strong>
        <span>Watchtower · {addresses.length} / {state.rules.addresses.length} в правилах</span></div>
        <button className="settings-secondary" disabled={busy||!validMinimum}
          onClick={()=>void act("rules",{addresses,kinds:activeKinds,minimum})}>Применить</button></div>
    </>}
    {feedback&&<p role="status" className="settings-status">{feedback}</p>}
    {error&&<p role="alert" className="error-box">{error}</p>}
  </>;
}
