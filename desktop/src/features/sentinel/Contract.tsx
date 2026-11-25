/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

import {useEffect,useRef,useState} from "react";
import {Upload} from "lucide-react";
import {Address,Cell} from "@ton/core";
import {addressBook,bookEntry} from "../../lib/addressBook";
import Checkbox from "../../components/ui/Checkbox";
import {platform} from "@platform";
import Select from "../../components/ui/Select";
import {archive,head,type State} from "./archive";
import {formatGram} from "../../lib/format";
import {errorText} from "../../lib/errors";
import AddressHistory from "../address-inspector/AddressHistory";
import {type WorkspaceId} from "../../components/ToolNavigation";

function tree(value?:string|null,libraries=false){
  const cells=new Map<string,string>();
  if(!value)return cells;
  function visit(c:Cell,path:string){
    if(cells.size>=8192)throw Error("Дерево превышает 8192 ячейки.");
    if(!libraries||c.type===2)cells.set(path,(c.isExotic?"exotic · ":"")+c.hash().toString("hex"));
    c.refs.forEach((ref,i)=>visit(ref,path+"."+i));
  }
  visit(Cell.fromBase64(value),"root");return cells
}
export function Contract({diff,open,initial}:{diff:boolean;open:(id:WorkspaceId,address:string)=>void;initial:string}){
  const [input,setInput]=useState(initial),[address,setAddress]=useState(""),[block,setBlock]=useState(0),[old,setOld]=useState(""),[next,setNext]=useState("");
  const [result,setResult]=useState<State[]|null>(null),[changes,setChanges]=useState<string[]>([]),[part,setPart]=useState("code");
  const [error,fail]=useState(""),[busy,setBusy]=useState(false),[methods,setMethods]=useState<string[]>([]),[method,setMethod]=useState(""),[log,setLog]=useState<string[]>([]);
  const [auto,setAuto]=useState(false),[events,setEvents]=useState<string[]>([]);const previous=useRef<{addr:string;data:State;block:number}|null>(null);
  const [abis,setAbis]=useState<({name:string; document:Record<string,unknown>}|null)[]>([null,null]);
  const fileInputs=useRef<(HTMLInputElement|null)[]>([]);
  async function loadAbi(file:File|undefined,index:number){
    if(!file)return;
    try{
      if(file.size>1048576)throw Error("ABI > 1 MiB");
      const abi=JSON.parse(await file.text());
      if(!abi||typeof abi!=="object"||Array.isArray(abi))throw Error("ABI · JSON");
      setAbis(v=>v.map((item,i)=>i===index?{name:file.name,document:abi}:item));fail("")
    }catch(e){fail(errorText(e))}
  }
  const epoch=useRef(0);
  useEffect(()=>()=>{epoch.current++},[]);
  async function load(){
    const id=++epoch.current;setBusy(true);fail("");
    try{
      const addr=Address.parse(input.trim()),friendly=addr.toString(),raw=addr.toRawString();
      const b=diff&&next?Number(next):(await head()).last.seqno;
      const a=diff&&old?Number(old):Math.max(1,b-1);
      const states=await Promise.all((diff?[a,b]:[b]).map(async n=>(await archive<{account:State}>(n,friendly)).account));
      if(id!==epoch.current)return;
      const current=states[states.length-1];
      if(previous.current?.addr===raw&&previous.current.block!==b){
        const changed=["code","data"].filter(key=>previous.current!.data.state[key as "code"]!==current.state[key as "code"]);
        if(changed.length)setEvents(v=>[b+" · Изменение "+changed.join(", "),...v].slice(0,100))
      }
      previous.current={addr:raw,data:current,block:b};setAddress(raw);setBlock(b);setResult(states);
      if(diff){setOld(String(a));setNext(String(b))}
      else if(current.state.type==="active"){
        try{const info=await platform.inspectContractCode(raw,false);if(id===epoch.current){setMethods(info.methods);setMethod(v=>info.methods.includes(v)?v:info.methods[0]??"")}}
        catch{if(id===epoch.current)setMethods([])}
      }
    }catch(e){if(id===epoch.current){fail(errorText(e));setResult(null)}}
    finally{if(id===epoch.current)setBusy(false)}
  }
  useEffect(()=>{if(!auto||busy||diff)return;const t=setTimeout(()=>void load(),60000);return()=>clearTimeout(t)},[auto,busy,diff,input,result]);
  useEffect(()=>{if(!diff||result?.length!==2)return;
    if(part==="abi"){const [a,b]=abis.map(file=>file?.document);setChanges(!a||!b?[]:[...new Set([...Object.keys(a),...Object.keys(b)])].filter(k=>JSON.stringify(a[k])!==JSON.stringify(b[k])).map(k=>k+" · "+JSON.stringify(a[k]??null)+" → "+JSON.stringify(b[k]??null)));return}
    try{const [x,y]=result.map(r=>tree(r.state[part==="data"?"data":"code"],part==="libs"));
      setChanges([...new Set([...x.keys(),...y.keys()])].filter(k=>x.get(k)!==y.get(k)).map(k=>k+" · "+(x.get(k)??"∅")+" → "+(y.get(k)??"∅")))}
    catch(e){fail(errorText(e));setChanges([])}
  },[diff,result,part,abis]);
  function reset(){epoch.current++;setBusy(false);setResult(null);setAbis([null,null]);setLog([]);setMethods([]);setEvents([]);setAuto(false);previous.current=null}
  async function runMethod(){
    const id=++epoch.current;setBusy(true);
    try{const r=await platform.runGetMethod(address,false,method,[]);if(id===epoch.current)setLog(l=>[new Date().toLocaleTimeString()+" · "+method+" · exit "+r.exit_code+" · "+JSON.stringify(r.decoded??r.stack),...l].slice(0,30))}
    catch(e){if(id===epoch.current)fail(errorText(e))}finally{if(id===epoch.current)setBusy(false)}
  }
  return <div className="wallet-form"><section className="card"><div className="card-head"><h2>{diff?"Сравнение состояния по блокам":"Наблюдение за контрактом"}</h2><span className="badge">Mainnet</span></div><form className="card-body wallet-form" onSubmit={e=>{e.preventDefault();void load()}}>
    <label className="sandbox-field">Публичный адрес контракта<input required value={input} onChange={e=>{reset();setInput(e.target.value)}}/></label>
    {diff&&<div className="field-row">{["Исходный блок","Целевой блок"].map((_,i)=><label className="sandbox-field" key={i}>{i?"Целевой блок":"Исходный блок"}<input type="number" min="1" placeholder={i?"Последний":"Предыдущий"} value={i?next:old} onChange={e=>{reset();(i?setNext:setOld)(e.target.value)}}/></label>)}</div>}
    <div className="workspace-actions"><button className="btn solid" disabled={busy}>{busy?"Загрузка…":diff?"Сравнить блоки":"Получить состояние"}</button></div></form></section>
    {error&&<p className="error-box" role="alert">{error}</p>}{result&&<><section className="card"><div className="card-head"><h2>Блок {block}</h2><span className="badge">{result.at(-1)?.state.type}</span></div><div className="card-body wallet-form">
    <p>Баланс · {formatGram(result.at(-1)!.balance.coins)}</p>
    {result.at(-1)?.state.code&&<div className="tx-input-actions"><button className="card-link" onClick={()=>{const boc=result.at(-1)!.state.code;open("boc-explorer",address);setTimeout(()=>window.dispatchEvent(new CustomEvent("gramix:open-boc",{detail:boc})),0)}}>Открыть код в BOC Explorer</button></div>}
    {diff?<><Select label="Раздел сравнения" value={part} onValueChange={setPart} options={[{value:"code",label:"Дерево code cells"},{value:"data",label:"Ячейки storage"},{value:"libs",label:"Ссылки на библиотеки"},{value:"abi",label:"ABI · JSON"}]}/>{part==="abi"&&<div className="field-row">{[old,next].map((b,i)=><section key={i} className="wallet-form">
      <div className="contract-code-title"><strong>{i?"Целевой блок":"Исходный блок"}</strong><span>{b}</span></div>
      <div className="tx-input-actions"><button type="button" className="btn" aria-label={(i?"Целевой блок":"Исходный блок")+" · ABI JSON"} onClick={()=>fileInputs.current[i]?.click()}><Upload size={15}/>{abis[i]?"Заменить JSON":"Выбрать файл JSON"}</button>
      <input ref={node=>{fileInputs.current[i]=node}} hidden type="file" accept=".json,application/json" onChange={e=>{const file=e.target.files?.[0];e.target.value="";void loadAbi(file,i)}}/></div>
      {abis[i]&&<span className="field-help">{abis[i]?.name}</span>}</section>)}</div>}{(part!=="abi"||abis.every(Boolean))&&<p>Изменённых узлов · {changes.length}</p>}{changes.slice(0,100).map(x=><code className="benchmark-note" key={x}>{x}</code>)}{changes.length>100&&<p>Показаны первые 100 узлов.</p>}<p className="field-help">Пути отражают ссылки между ячейками. Для интерпретации полей storage и ABI нужна схема контракта.</p></>:
    <><div className="tx-input-actions"><button className="btn" onClick={()=>{if(!bookEntry(address,false))addressBook.add({raw:address,address:Address.parseRaw(address).toString(),label:"",testnet:false});addressBook.update(address,false,{watch:true});open("sentinel-watch",address)}}>Наблюдать в Watchtower</button><button className="btn" onClick={()=>open("sentinel-diff",address)}>Сравнить блоки</button></div><Checkbox checked={auto} onCheckedChange={setAuto}>Проверять изменения кода и storage каждую минуту</Checkbox>{events.map(x=><p key={x}>{x}</p>)}</>}</div></section>
    {!diff&&<><section className="card"><div className="card-head"><h2>Get-методы</h2></div><div className="card-body wallet-form">{methods.length?<div className="tx-input-actions"><Select label="Get-метод" value={method} onValueChange={setMethod} options={methods.map(m=>({value:m,label:m}))}/><button className="btn" disabled={busy} onClick={()=>void runMethod()}>Вызвать без аргументов</button></div>:<p>Имена методов недоступны.</p>}{log.map((x,i)=><code key={i} className="benchmark-note">{x}</code>)}</div></section><AddressHistory raw={address} testnet={false}/></>}</>}
    </div>
}
