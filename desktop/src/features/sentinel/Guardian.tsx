/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

import type {WorkspaceId} from "../../components/ToolNavigation";
import {Address} from "@ton/core";
import {useState} from "react";
import Select from "../../components/ui/Select";
import {simulate,type Trace} from "./archive";
import {formatGram} from "../../lib/format";
import {errorText} from "../../lib/errors";
let recentTrace:Trace|null=null;
export function Guardian({graph,open,navigate}:{graph:boolean;open:()=>void;navigate:(id:WorkspaceId)=>void}){
  const [mode,setMode]=useState("message"),[boc,setBoc]=useState(""),[from,setFrom]=useState(""),[to,setTo]=useState(""),[amount,setAmount]=useState("");
  const [trace,setTrace]=useState<Trace|null>(recentTrace),[index,select]=useState(0),[busy,setBusy]=useState(false),[error,fail]=useState("");
  async function run(){
    setBusy(true);recentTrace=null;setTrace(null);fail("");
    try{const executed=await simulate({mode,boc,from,to,amount});recentTrace=executed;setTrace(executed);select(0)}catch(e){fail(errorText(e))}finally{setBusy(false)}
  }
  const node=trace?.nodes[index];
  const parties=new Set([trace?.nodes[0]?.address,trace?.nodes[0]?.from]);
  const additional=trace?.nodes.filter(n=>!parties.has(n.address))??[];
  function inspect(){
    if(!node)return;
    try{const raw=Address.parse(node.address).toRawString();navigate("contract-inspector");
      setTimeout(()=>window.dispatchEvent(new CustomEvent("gramix:contract-address",{detail:{address:raw,testnet:false}})),0)}catch(e){fail(errorText(e))}
  }
  return <div className="wallet-form">{!graph&&<section className="card"><div className="card-head"><h2>Сообщение для Sandbox</h2><span className="badge">Mainnet</span></div>
    <form className="card-body wallet-form" onChange={()=>{setTrace(null);fail("")}} onSubmit={e=>{e.preventDefault();void run()}}>
    <Select disabled={busy} label="Источник сообщения" value={mode} onValueChange={v=>{setMode(v);setTrace(null)}} options={[{value:"message",label:"Параметры внутреннего сообщения"},{value:"boc",label:"BOC сообщения"}]}/>
    {mode==="boc"?<label className="sandbox-field">BOC · Base64 или hex<textarea required disabled={busy} value={boc} onChange={e=>setBoc(e.target.value)}/></label>:<><label className="sandbox-field">Адрес отправителя<input required disabled={busy} value={from} onChange={e=>setFrom(e.target.value)}/></label><label className="sandbox-field">Контракт назначения<input required disabled={busy} value={to} onChange={e=>setTo(e.target.value)}/></label><label className="sandbox-field">Сумма GRAM<input required disabled={busy} value={amount} onChange={e=>setAmount(e.target.value)}/></label></>}
    <p className="field-help">Sandbox исполняет сообщение локально с состоянием адресов на одном блоке. В режиме параметров отправитель и сумма заданы вручную. Подпись и платёжеспособность отправителя этим сценарием не проверяются. Результат симуляции не гарантирует безопасность.</p><div className="workspace-actions"><button className="btn solid" disabled={busy}>{busy?"Выполняется…":"Запустить симуляцию"}</button></div></form></section>}
    {error&&<p role="alert" className="error-box">{error}</p>}
    {trace?<section className="card"><div className="card-head"><h2>{graph?"Граф сообщений":"Результат исполнения"}</h2><span className="badge">Блок {trace.block}</span></div><div className="card-body wallet-form"><p>{trace.nodes.length} транзакций · прервано {trace.nodes.filter(x=>x.aborted).length}</p>
    {additional.length>0&&<p className="benchmark-note">Дополнительные получатели · {Array.from(new Set(additional.map(n=>n.address))).join(", ")}. Эти адреса появились во внутренних сообщениях.</p>}{graph?<><div className="tx-input-actions">{trace.nodes.map((n,i)=><button key={n.hash} className={"btn"+(index===i?" solid":"")} onClick={()=>select(i)}>{n.parent?trace.nodes.findIndex(p=>p.hash===n.parent)+1+" → ":""}{i+1} · {n.address.slice(0,6)}…</button>)}</div>{node&&<div className="kv">{Object.entries({"Адрес":node.address,"Отправитель":node.from,"Сумма сообщения":formatGram(node.amount),"Комиссия":formatGram(node.fees),"Состояние":node.oldState+" → "+node.newState,"Исходящие":node.out.join(", ")||"Нет","Операция":node.asset||node.opcode,"Исполнение":node.aborted?"Прервано":"Завершено"}).map(([k,v])=><div key={k}><b>{k}</b><p>{v}</p></div>)}</div>}{node&&<div className="tx-input-actions"><button className="btn" onClick={inspect}>Открыть контракт</button></div>}</>:<>{trace.nodes.filter(n=>n.aborted||n.out.length||n.asset).map(n=><p key={n.hash}>{n.address} · {n.aborted?"Исполнение прервано. ":""}{n.asset} {n.out.length?"Исходящих сообщений: "+n.out.length:""}</p>)}<div className="tx-input-actions"><button className="btn" onClick={open}>Открыть граф сообщений</button></div></>}</div></section>:graph&&<section className="card"><div className="card-head"><h2>Граф исполнения</h2></div><div className="card-body wallet-form"><p>Запустите симуляцию в Guardian, чтобы открыть узлы и переходы.</p><div className="tx-input-actions"><button className="btn" onClick={open}>Открыть Guardian</button></div></div></section>}</div>
}
