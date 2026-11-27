/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

import {useMemo,useState} from "react";
import {formatGram} from "../../lib/format";
import type {Transfer} from "./transferNetwork";

function day(offset: number) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()].map(v => String(v).padStart(2,"0")).join("-");
}
function after(day: string) {
  const date = new Date(day + "T00:00:00");
  date.setDate(date.getDate() + 1);
  return date.getTime() / 1000;
}
function summarize(items: Transfer[], root: string, start: string, end: string) {
  const lo = new Date(start+"T00:00:00").getTime()/1000, hi = after(end);
  const peers = new Set<string>(), recipients = new Map<string, bigint>();
  let incoming=0n, outgoing=0n, count=0;
  for (const t of items) {
    if (t.time<lo || t.time>=hi || t.from===t.to || !t.ok || t.pending) continue;
    if (t.from!==root && t.to!==root) continue;
    const inbound=t.to===root, peer=inbound?t.from:t.to;
    peers.add(peer);count++;
    if (t.asset!=="GRAM" || !/^\d+$/.test(t.units)) continue;
    const nano=BigInt(t.units);
    if (inbound) incoming+=nano;
    else {outgoing+=nano;recipients.set(peer,(recipients.get(peer)??0n)+nano);}
  }
  return {peers,recipients,incoming,outgoing,count};
}

export function TransferComparison({items,root,label,open}: {
  items: Transfer[]; root: string; label: (raw: string) => string; open: (raw: string, start: number, end: number) => void;
}) {
  const [visible,setVisible]=useState(10);
  const [previousFrom,setPreviousFrom]=useState(()=>day(-13)), [previousTo,setPreviousTo]=useState(()=>day(-7));
  const [currentFrom,setCurrentFrom]=useState(()=>day(-6)), [currentTo,setCurrentTo]=useState(()=>day(0));
  const valid=previousFrom && previousTo && currentFrom && currentTo && previousFrom<=previousTo && currentFrom<=currentTo;
  const data=useMemo(()=>{
    if(!valid)return null;
    const prior=summarize(items,root,previousFrom,previousTo), current=summarize(items,root,currentFrom,currentTo);
    const additions=[...current.peers].filter(raw=>!prior.peers.has(raw));
    const leaders=[...current.recipients].sort((a,b)=>a[1]===b[1]?0:a[1]>b[1]?-1:1).slice(0,10);
    return {prior,current,additions,leaders};
  },[items,root,previousFrom,previousTo,currentFrom,currentTo,valid]);
  return <section className="card">
    <div className="card-head"><h2>Сравнение периодов</h2></div>
    <div className="card-body wallet-form">
      <p className="field-help">Учитываются загруженные подтверждённые переводы выбранного адреса. Денежные итоги показаны в GRAM.</p>
      <div className="workspace-actions">
        <label className="sandbox-field">Предыдущий период, с<input type="date" value={previousFrom} onChange={e=>setPreviousFrom(e.target.value)}/></label>
        <label className="sandbox-field">Предыдущий период, по<input type="date" value={previousTo} onChange={e=>setPreviousTo(e.target.value)}/></label>
        <label className="sandbox-field">Текущий период, с<input type="date" value={currentFrom} onChange={e=>setCurrentFrom(e.target.value)}/></label>
        <label className="sandbox-field">Текущий период, по<input type="date" value={currentTo} onChange={e=>setCurrentTo(e.target.value)}/></label>
      </div>
      {!data ? <p className="muted">Укажите начало и конец обоих периодов.</p> : <>
        <div className="benchmark-table-wrap">
          <table className="benchmark-table"><thead><tr><th>Показатель</th><th>Предыдущий период</th><th>Текущий период</th></tr></thead><tbody>
            <tr><th>Переводы</th><td>{data.prior.count}</td><td>{data.current.count}</td></tr>
            <tr><th>Получено</th><td>{formatGram(data.prior.incoming,9)}</td><td>{formatGram(data.current.incoming,9)}</td></tr>
            <tr><th>Отправлено</th><td>{formatGram(data.prior.outgoing,9)}</td><td>{formatGram(data.current.outgoing,9)}</td></tr>
          </tbody></table>
        </div>
        <div className="card-head"><h3>Новые адреса</h3><span className="badge">{data.additions.length}</span></div>
        <p className="field-help">Адреса из текущего периода, которых не было в предыдущем.</p>
        {!!data.additions.length && <div className="workspace-actions">{data.additions.slice(0,visible).map(raw=>
          <button className="card-link" key={raw} onClick={()=>open(raw,new Date(currentFrom+"T00:00:00").getTime()/1000,after(currentTo))}>{label(raw)}</button>)}</div>}
        {data.additions.length>visible && <button className="card-link" onClick={()=>setVisible(n=>n+20)}>Показать ещё</button>}
        <div className="card-head"><h3>Крупнейшие получатели</h3></div>
        {!data.leaders.length && <p className="muted">В текущем периоде нет исходящих переводов GRAM.</p>}
        {data.leaders.map(([raw,nano])=><div className="settings-control" key={raw}>
          <button className="card-link" onClick={()=>open(raw,new Date(currentFrom+"T00:00:00").getTime()/1000,after(currentTo))}>{label(raw)}</button>
          <span className="muted">{formatGram(nano,9)}</span></div>)}
      </>}
    </div>
  </section>;
}
