/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Address } from "@ton/core";
import { Download, Link, Maximize, Minimize, SlidersHorizontal, X } from "lucide-react";
import { GraphInvestigations, newConnections, readInvestigations, storeInvestigations, type Investigation } from "./GraphInvestigations";
import { TransferComparison } from "./TransferComparison";
import TransferCharts from "./TransferCharts";
import Checkbox from "../../components/ui/Checkbox";
import {useAddressBook} from "../../lib/addressBook";
import Select from "../../components/ui/Select";
import { copyText } from "../../lib/clipboard";
import { errorText } from "../../lib/errors";
import { formatGram } from "../../lib/format";
import { getHistory, type HistoryEvent } from "../../lib/market";
import { saveFile } from "../../lib/save";
import { graphSvg, viewport } from "./graphViewport";
import { request } from "./activityService";
import { friendly, transfers, type Transfer } from "./transferNetwork";
import { positionNetwork, type LayoutRequest } from "./graphLayout";

const emptyRows: Transfer[]=[];
const params = new URLSearchParams(location.search);
const shared = __WEB__ && ["/transfer-graph", "/transfer-graph/"].includes(location.pathname);
const initial = shared ? params.get("address") ?? "" : "";
function graphColors(){
  const css=getComputedStyle(document.documentElement);
  return ["--surface","--text","--text-muted","--accent"].map(key=>css.getPropertyValue(key).trim());
}
export default function TransferGraph() {
  const [input, setInput] = useState(initial), [root, setRoot] = useState("");
  const book=useAddressBook();
  const [query,setQuery]=useState(()=>new URLSearchParams(shared?params:""));
  const opt=(key:string,fallback="")=>query.get(key)??fallback;
  function options(values:Record<string,string>){setQuery(old=>{
    const next=new URLSearchParams(old);
    for(const [k,v] of Object.entries(values)){if(v)next.set(k,v);else next.delete(k);}
    return next;
  });}
  const [search,setSearch]=useState(""), [pairDirection,setPairDirection]=useState<"in"|"out"|null>(null);
  const [collapsed,setCollapsed]=useState<string[]>(shared?params.getAll("collapse"):[]);
  const chart=useRef<SVGSVGElement>(null),panel=useRef<HTMLElement>(null);
  const [layout, setLayout] = useState(shared && ["web","flow","time"].includes(params.get("layout")??"") ? params.get("layout")! : "tree");
  const [colors,setColors]=useState(graphColors);
  const [filtersOpen,setFiltersOpen]=useState(false);
  useEffect(()=>{
    const refresh=()=>setColors(graphColors());
    const observer=new MutationObserver(refresh);
    observer.observe(document.documentElement,{attributes:true,attributeFilter:["data-theme","style"]});
    refresh();
    return ()=>observer.disconnect();
  },[]);
  const [limit,setLimit] = useState(30), [items,setItems] = useState<Transfer[]>([]);
  const [investigations,setInvestigations]=useState(readInvestigations), [activeInvestigation,setActiveInvestigation]=useState("");
  const [comparison,setComparison]=useState(false), [comparisonRange,setComparisonRange]=useState<{from:number;to:number;address:string}|null>(null);
  const [recentLimit,setRecentLimit]=useState(10);
  const [linkedEvent,setLinkedEvent]=useState<HistoryEvent|null>(null);
  const eventId=useRef("");
  const [loadedCount,setLoadedCount]=useState(0);
  const [selected, select] = useState(""), [busy,setBusy] = useState(false), [message,note] = useState("");
  const [fullscreen,setFullscreen]=useState<HTMLElement|null>(null);
  useEffect(()=>{
    const sync=()=>setFullscreen(document.fullscreenElement as HTMLElement|null);
    document.addEventListener("fullscreenchange",sync);
    return ()=>document.removeEventListener("fullscreenchange",sync);
  },[]);
  const graphElement = useRef<SVGSVGElement>(null), view = useRef<ReturnType<typeof viewport> | null>(null), generation = useRef(0);
  const cursors = useRef(new Map<string,string|null>()), ids = useRef(new Set<string>());
  const connected = useRef(new Set<string>());

  const flushPending=useRef<()=>void>(()=>{});
  async function load(raw:string) {
    const run = ++generation.current, active = () => run === generation.current;
    const visited = new Set<string>();
    const beforeCount=ids.current.size;
    let pending: Transfer[]=[];
    let lastPaint=-Infinity, lastCount=-Infinity;
    function flush() {
      if(!active())return;
      setLoadedCount(ids.current.size);
      if(!pending.length)return;
      const batch=pending; pending=[]; lastPaint=performance.now();
      setItems(previous=>previous.concat(batch));
    }
    flushPending.current=flush;
    setBusy(true); note("");
    try {
      let cursor = cursors.current.get(raw);
      while (active() && cursor !== null) {
        const before = cursor ?? undefined;
        const page = await request(() => getHistory(raw,false,before),active);
        if (!active()) return;
        const match=eventId.current && page.events.find(event=>event.id.toLowerCase()===eventId.current);
        if(match)setLinkedEvent(match);
        const added = transfers(raw,page.events).filter(t => {
          if (ids.current.has(t.id)) return false;
          ids.current.add(t.id); connected.current.add(t.from); connected.current.add(t.to); return true;
        });
        pending.push(...added);
        const now=performance.now();
        // Keep progress responsive without rebuilding the SVG for every API page.
        if(now-lastCount>=200){setLoadedCount(ids.current.size);lastCount=now;}
        const largeHistory=ids.current.size>=1200;
        const refreshDelay=largeHistory ? 1800 : 500;
        const batchSize=largeHistory ? 1200 : 150;
        if(now-lastPaint>=refreshDelay || pending.length>=batchSize && now-lastPaint>=350)flush();
        cursor = page.events.length ? page.next : null;
        if (cursor && visited.has(cursor)) throw Error("API повторил курсор истории.");
        if (cursor) visited.add(cursor);
        cursors.current.set(raw,cursor);
      }
      if(active() && ids.current.size===beforeCount && raw!==root && connected.current.has(raw))note("История проверена. Все найденные переводы уже есть на графе.");
    } catch(e) { if(active()) note(errorText(e)); }
    finally { flush(); if(active()) setBusy(false); }
  }
  async function build(value:string, expand: string[] = [], restored?:URLSearchParams) {
    try {
      if (Address.isFriendly(value) && Address.parseFriendly(value).isTestOnly) throw Error("Выберите публичный адрес Mainnet.");
      const raw = Address.parse(value).toRawString();
      if(restored)setQuery(restored);
      else if(root && root!==raw){options({focus:"",asset:"",min:"",from:"",until:""});setCollapsed([]);setSearch("");}
      if(!restored){
        setActiveInvestigation("");
        options({event:""});
      }
      const requested=restored?.get("event")??"";
      eventId.current=/^[a-f0-9]{64}$/i.test(requested)?requested.toLowerCase():"";
      setLinkedEvent(null);setRecentLimit(10);setComparisonRange(null);
      shortLabels.current.clear();
      setRoot(raw); setItems([]); setLoadedCount(0); connected.current.clear(); ids.current.clear(); cursors.current.clear(); select("");
      const expectedRoot = generation.current + 1;
      await load(raw);
      if (generation.current !== expectedRoot) return;
      for (const peer of expand) {
        if (!cursors.current.has(raw) || cursors.current.get(raw) !== null ) break;
        if (!connected.current.has(peer) || cursors.current.has(peer)) continue;
        const expected = generation.current + 1;
        await load(peer);
        if (generation.current !== expected) break;
      }
    } catch { note("Введите корректный адрес Mainnet."); }
  }
  useEffect(() => {
    if (initial) void build(initial,params.getAll("expand"),params);
    return () => { generation.current++; };
  }, []);
  const analytic=layout==="flow" || layout==="time", focus=Address.isRaw(opt("focus"))?opt("focus"):"", anchor=focus||root;
  const names=useMemo(()=>new Map(book.filter(w=>!w.testnet&&w.label).map(w=>[w.raw,w.label])),[book]);
  function label(raw:string){if(!raw)return "";const f=friendly(raw);return names.get(raw) || f.slice(0,6)+"…"+f.slice(-5);}
  const flow=layout==="flow";
  const days=Number(opt("days","0")), min=flow?opt("min"):"", dir=opt("dir","all");
  const start=Number(opt("from")),end=Number(opt("until"));
  const indexed=useMemo(()=>{
    const byAddress=new Map<string,Transfer[]>();
    for(const t of items)for(const raw of new Set([t.from,t.to])){
      const list=byAddress.get(raw)??[];list.push(t);byAddress.set(raw,list);
    }
    return byAddress;
  },[items]);
  function reachable(skip=""){
    const visible=new Set<Transfer>(),queue=new Set([root]);
    for(const raw of queue){
      if(raw===skip || collapsed.includes(raw))continue;
      for(const t of indexed.get(raw)??[]){
        visible.add(t);const peer=t.from===raw?t.to:t.from;
        if(cursors.current.has(peer))queue.add(peer);
      }
    }
    return visible;
  }
  const scoped=useMemo(()=>[...reachable()],[indexed,root,collapsed,busy]);
  const available=useMemo(()=>scoped.filter(t=>
    (!analytic || t.from===anchor || t.to===anchor) &&
    (!flow || (t.ok && !t.pending && /^\d+$/.test(t.units)))
  ),[scoped,analytic,flow,anchor]);
  const assets=useMemo(()=>new Map(available.map(t=>[t.asset,t.symbol])),[available]);
  const defaultAsset=flow ? (assets.has("GRAM")?"GRAM":assets.keys().next().value??"GRAM") : "all";
  const wanted=opt("asset");
  const asset=assets.has(wanted)?wanted:defaultAsset;
  const hasSpam=available.some(t=>t.scam), hasSelf=available.some(t=>t.from===t.to);
  const hideSpam=hasSpam && opt("spam")==="1", hideSelf=hasSelf && opt("self")==="1";
  const showDirection=dir!=="all" || available.some(t=>t.from===anchor && t.to!==anchor) && available.some(t=>t.to===anchor && t.from!==anchor)
    || !analytic && available.some(t=>t.from!==anchor && t.to!==anchor);
  const filterCount=[days>0,asset!==defaultAsset,dir!=="all",Number(min)>0,hideSpam,hideSelf,start>0].filter(Boolean).length;
  const filtered=useMemo(()=>available.filter(t=>{
    if(days && t.time<Date.now()/1000-days*86400 || asset!=="all" && t.asset!==asset)return false;
    if(dir==="in" && t.to!==anchor || dir==="out" && t.from!==anchor)return false;
    if(hideSpam && t.scam || hideSelf && t.from===t.to)return false;
    if(asset!=="all" && min && Number(min)>0){
      if(!/^\d+$/.test(t.units))return false;
      const [whole,fraction=""]=min.split(".");
      if(!/^\d+$/.test(whole)||!/^[0-9]*$/.test(fraction))return false;
      const scale=Math.max(t.decimals,fraction.length);
      if(BigInt(t.units)*10n**BigInt(scale-t.decimals)<BigInt(whole+fraction)*10n**BigInt(scale-fraction.length))return false;
    }
    return true;
  }),[available,days,asset,dir,anchor,min,hideSpam,hideSelf]);
  const rows=useMemo(()=>filtered.filter(t=>(!start||t.time>=start)&&(!end||t.time<end)),[filtered,start,end]);
  const layoutWorker=useRef<Worker|null>(null);
  const layoutId=useRef(0);
  const [workerGraph,setWorkerGraph]=useState<{rows:Transfer[];graph:ReturnType<typeof positionNetwork>}|null>(null);
  const large=!analytic && rows.length>=500;
  useEffect(()=>{
    if(!large)return;
    try{layoutWorker.current=new Worker(new URL("./graphLayout.worker.ts",import.meta.url),{type:"module"});}
    catch{return;}
    return ()=>{layoutWorker.current?.terminate();layoutWorker.current=null;};
  },[large]);
  useEffect(()=>{
    if(!large)return;
    const worker=layoutWorker.current;
    const radial=layout==="web";
    const fallback=()=>setWorkerGraph({rows,graph:positionNetwork(root,rows,radial)});
    if(!worker){fallback();return;}
    const id=++layoutId.current;
    worker.onmessage=({data})=>{if(data.id===id)setWorkerGraph({rows,graph:data.graph});};
    worker.onerror=fallback;
    const job:LayoutRequest={id,root,radial,edges:rows.map(({from,to})=>({from,to}))};
    worker.postMessage(job);
    return ()=>{worker.onmessage=null;worker.onerror=null;};
  },[large,root,rows,layout]);
  const shortLabels=useRef(new Map<string,string>());
  const layoutRows=large || analytic ? emptyRows : rows;
  const radial=layout==="web";
  const network=useMemo(()=>{
    if(large && workerGraph?.graph.points[0]?.raw===root && workerGraph.graph.radial===radial)return workerGraph.graph;
    return positionNetwork(root,layoutRows,radial);
  },[large,workerGraph,root,radial,layoutRows]);
  const graph = useMemo(()=>{
    const labels=new Map<string,string>();
    for(const {raw} of network.points){
      if(!raw)continue;
      let short=shortLabels.current.get(raw);
      if(short===undefined){
        const full=friendly(raw);
        short=full.slice(0,5)+"…"+full.slice(-5);
        shortLabels.current.set(raw,short);
      }
      labels.set(raw,names.get(raw)??short);
    }
    return {...network,labels};
  },[network,names]);
  function openNode(raw:string){setLimit(30);setPairDirection(null);setComparisonRange(null);select(raw);}
  useEffect(() => {
    if (!graphElement.current) return;
    const controller=viewport(graphElement.current,openNode);
    view.current=controller;
    return () => { controller.destroy();view.current=null; };
  },[root,analytic]);
  useEffect(()=>{view.current?.update(graph,colors,focus);},[graph,colors,focus,analytic]);
  const detail = useMemo(()=>(comparisonRange?items:rows).filter(t=>{
    if(!selected)return false;
    if(comparisonRange)return t.ok && !t.pending && t.time>=comparisonRange.from && t.time<comparisonRange.to &&
      t.from!==t.to && (t.from===comparisonRange.address && t.to===selected || t.to===comparisonRange.address && t.from===selected);
    if(!pairDirection)return t.from===selected || t.to===selected;
    if(!t.ok || t.pending || !/^\d+$/.test(t.units))return false;
    return pairDirection==="in" ? t.to===anchor && t.from===selected : t.from===anchor && t.to===selected;
  }),[selected,rows,pairDirection,anchor,comparisonRange,items]);
  const canCollapse=useMemo(()=>{
    if(!selected || pairDirection || selected===root || collapsed.includes(selected) || !cursors.current.has(selected))return false;
    const remaining=reachable(selected);
    return rows.some(t=>!remaining.has(t));
  },[selected,pairDirection,root,collapsed,rows,busy]);
  function shareUrl() {
    const url = new URL("/transfer-graph", __WEB__ ? location.origin : "https://gram.lovlydev.ru");
    url.search=query.toString();
    if(!flow)url.searchParams.delete("min");
    if(layout!=="time")url.searchParams.delete("step");
    if(!hideSpam)url.searchParams.delete("spam");
    if(!hideSelf)url.searchParams.delete("self");
    if(asset===defaultAsset)url.searchParams.delete("asset");
    for(const k of ["expand","collapse","theme"])url.searchParams.delete(k);
    for(const [k,v] of Object.entries({address:friendly(root),layout}))url.searchParams.set(k,v);
    for(const raw of collapsed)url.searchParams.append("collapse",raw);
    for (const peer of cursors.current.keys()) if (peer !== root) url.searchParams.append("expand",peer);
    return url.href;
  }
  const investigation=investigations.find(view=>view.id===activeInvestigation);
  const recent=useMemo(()=>investigation && !busy ? newConnections(items,investigation.savedAt,root) : [],[investigation,items,busy,root]);

  function persistViews(updated:Investigation[]) {
    try { storeInvestigations(updated);setInvestigations(updated);return true; }
    catch(e){note(errorText(e));return false;}
  }
  function saveInvestigation(name:string,update=false){
    const previous=update?investigation:undefined;
    const id=previous?.id??crypto.randomUUID();
    const view={id,name,query:new URL(shareUrl()).search,savedAt:Date.now(),notes:previous?.notes??investigation?.notes??{}};
    if(!persistViews(previous?investigations.map(item=>item.id===id?view:item):[...investigations,view]))return false;
    setActiveInvestigation(id);setRecentLimit(10);return true;
  }
  function restore(view:Investigation){
    const stored=new URLSearchParams(view.query), address=stored.get("address")??"";
    if(!Address.isRaw(address)&&!Address.isFriendly(address)){note("Введите корректный адрес Mainnet.");return;}
    const mode=stored.get("layout")??"tree";
    setLayout(["tree","web","time","flow"].includes(mode)?mode:"tree");
    setInput(address);setCollapsed(stored.getAll("collapse"));setActiveInvestigation(view.id);
    void build(address,stored.getAll("expand"),stored);
  }
  const selectedNote=investigation?.notes[selected]??"";
  const [noteDraft,setNoteDraft]=useState<string|null>(null);
  useEffect(()=>setNoteDraft(null),[selected,activeInvestigation]);
  function saveNote(){
    if(!investigation || noteDraft===null)return;
    const notes={...investigation.notes};
    if(noteDraft.trim())notes[selected]=noteDraft.trim();else delete notes[selected];
    if(persistViews(investigations.map(view=>view.id===investigation.id?{...view,notes}:view)))setNoteDraft(null);
  }
  async function share(){
    try { await copyText(shareUrl()); note("Ссылка скопирована. Вставьте её в Notion как Embed."); }
    catch(e) { note(errorText(e)); }
  }
  return <div className="wallet-form"><section className="card"><div className="card-head"><h2>Граф переводов</h2><span className="badge">Mainnet</span></div>
    <form className="card-body wallet-form" onSubmit={e=>{e.preventDefault();build(input.trim());}}>
      <label className="sandbox-field">Публичный адрес<input required value={input} onChange={e=>setInput(e.target.value)}/></label>
      <div className="workspace-actions"><button className="btn solid">Построить граф</button>
      {busy && <button className="btn" type="button" onClick={()=>{flushPending.current();generation.current++;setBusy(false);}}>Остановить</button>}</div>
    </form></section>
    {!__WEB__ && <GraphInvestigations views={investigations} active={investigation} canSave={!!root&&!busy}
      restore={restore} save={saveInvestigation} remove={id=>{
        if(persistViews(investigations.filter(view=>view.id!==id)) && activeInvestigation===id)setActiveInvestigation("");
      }}/>}
    {eventId.current && <section className="card"><div className="card-head"><h2>Событие Watchtower</h2>
      <button className="card-link" onClick={()=>{eventId.current="";setLinkedEvent(null);options({event:"",from:"",until:""});}}>Показать всю историю</button></div>
      <div className="card-body wallet-form">
        <p className="muted">{linkedEvent?new Date(linkedEvent.time*1000).toLocaleString():busy?"Загружаю историю…":"Событие отсутствует в загруженной истории."}</p>
        {linkedEvent?.actions.map((action,i)=><div className="settings-control" key={i}>
          <div><strong>{action.title}</strong><span>{action.ok?"Подтверждено":"Ошибка"}</span></div>
          <span>{action.amountNano?formatGram(action.amountNano,9):action.value}</span></div>)}
      </div></section>}
    {investigation && recent.length>0 && <section className="card"><div className="card-head">
      <h2>Связи после сохранения</h2><span className="badge">{recent.length}</span></div><div className="card-body wallet-form">
      <p className="field-help">{new Date(investigation.savedAt).toLocaleString()} · {investigation.name}</p>
      <div className="workspace-actions">{recent.slice(0,recentLimit).map(raw=><button className="card-link" key={raw}
        onClick={()=>{openNode(raw);setComparisonRange({from:Math.floor(investigation.savedAt/1000)+1,to:Infinity,address:root});}}>{label(raw)}</button>)}</div>
      {recent.length>recentLimit && <button className="card-link" onClick={()=>setRecentLimit(n=>n+20)}>Показать ещё</button>}
      </div></section>}
    {root && <section ref={panel} className="card"><div className="card-head"><h2>Связи адреса</h2><span className="badge">{(analytic?rows.filter(t=>t.from===anchor || t.to===anchor):rows).length} / {loadedCount}</span></div>
      <div className="card-body wallet-form">
        <div className="workspace-actions" style={{alignItems:"center",justifyContent:"space-between"}}>
        <div className="workspace-actions" style={{alignItems:"center"}}>
        <Select portalContainer={fullscreen} label="Раскладка" value={layout} onValueChange={setLayout} options={[{value:"tree",label:"Дерево"},{value:"web",label:"Паутина"},{value:"flow",label:"Поток средств"},{value:"time",label:"Активность по времени"}]}/>
        {layout==="time" && <Select portalContainer={fullscreen} label="Шаг времени" value={opt("step","day")} onValueChange={v=>options({step:v})} options={[{value:"hour",label:"По часам"},{value:"day",label:"По дням"}]}/>}
        <button className="btn" aria-expanded={comparison} onClick={()=>setComparison(v=>!v)}>Сравнить периоды</button>
        <button className="btn" aria-expanded={filtersOpen} aria-controls="transfer-graph-filters" onClick={()=>setFiltersOpen(v=>!v)}>
          <SlidersHorizontal size={15}/> Фильтры {filterCount>0 && <span className="badge">{filterCount}</span>}
        </button></div>
        <div className="workspace-actions">
        <button className="btn" title="Скачать SVG" aria-label="Скачать SVG" disabled={large && (workerGraph?.rows!==rows || workerGraph.graph.radial!==radial) || analytic && !(layout==="time"?filtered:rows).some(t=>t.from===anchor||t.to===anchor)} onClick={()=>{
          const svg=analytic?chart.current?.cloneNode(true) as SVGSVGElement|undefined:new DOMParser().parseFromString(graphSvg(graph,colors,focus),"image/svg+xml").documentElement;
          if(!svg)return;
          const [x,y,w,h]=svg.getAttribute("viewBox")!.split(/\s+/).map(Number);
          const stamp=new Date(), ns="http://www.w3.org/2000/svg";
          const title=document.createElementNS(ns,"text");
          const scale=Math.max(1,w/900);
          const pad=48*scale, reportWidth=Math.max(w,900);
          svg.setAttribute("viewBox",[x,y-pad,reportWidth,h+pad].join(" "));
          const header=document.createElementNS(ns,"rect");
          for(const [key,v] of Object.entries({x,y:y-pad,width:reportWidth,height:pad,fill:colors[0]}))header.setAttribute(key,String(v));
          title.setAttribute("x",String(x+10*scale));title.setAttribute("y",String(y-pad+18*scale));
          title.setAttribute("font-size",String(13*scale));title.setAttribute("fill",colors[1]);
          title.textContent=[stamp.toLocaleString(),label(anchor),layout,asset==="all"?"Все активы":assets.get(asset)??asset].join(" · ");
          const subtitle=title.cloneNode() as SVGTextElement;
          subtitle.setAttribute("y",String(y-9*scale));
          subtitle.textContent=[days?days+" d":"∞",dir,min?("≥ "+min):"",hideSpam?"Скрыть спам":"",hideSelf?"Скрыть переводы себе":"",
            start?new Date(start*1000).toLocaleString():"",end?new Date(end*1000).toLocaleString():""].filter(Boolean).join(" · ");
          svg.append(header,title,subtitle);
          const meta=document.createElementNS("http://www.w3.org/2000/svg","metadata");
          meta.textContent=JSON.stringify({created:new Date().toISOString(),view:shareUrl(),transfers:rows.length});svg.prepend(meta);
          void saveFile("gramix-transfers.svg",new XMLSerializer().serializeToString(svg),"image/svg+xml");
        }}><Download size={16}/></button>
        <button className="btn" title="Скопировать ссылку" aria-label="Скопировать ссылку" onClick={()=>void share()}><Link size={16}/></button>
        <button className="btn" title="Полный экран" aria-label="Полный экран" onClick={()=>{const element=panel.current;
          if(document.fullscreenElement) void document.exitFullscreen().catch(e=>note(errorText(e)));
          else if(element) void element.requestFullscreen().catch(e=>note(errorText(e)));}}>{fullscreen?<Minimize size={16}/>:<Maximize size={16}/>}</button>
        </div></div>
        {filtersOpen && <div id="transfer-graph-filters" className="wallet-form">
        <div className="workspace-actions" style={{alignItems:"flex-end"}}>
        <Select portalContainer={fullscreen} label="Период" value={String(days)} onValueChange={v=>options({days:v,from:"",until:""})} options={[{value:"0",label:"Всё время"},{value:"1",label:"За день"},{value:"7",label:"За неделю"},{value:"30",label:"За месяц"}]}/>
        {(assets.size>1 || asset!==defaultAsset) && <Select portalContainer={fullscreen} label="Актив" value={asset} onValueChange={v=>options({asset:v,min:""})} options={[
          ...(flow?[]:[{value:"all",label:"Все активы"}]),
          ...Array.from(assets,([value,symbol])=>({value,label:symbol+(value.includes(":")?" · "+value.slice(-5):"")}))]}/>}
        {showDirection && <Select portalContainer={fullscreen} label="Направление" value={dir} onValueChange={v=>options({dir:v})} options={[{value:"all",label:"Оба направления"},{value:"in",label:"Входящие"},{value:"out",label:"Исходящие"}]}/>}
        {flow && <label className="sandbox-field"><input type="number" min="0" step="any" aria-label="Минимальная сумма" placeholder="Минимальная сумма" value={min} onChange={e=>options({min:e.target.value})}/></label>}
        </div>{(hasSpam || hasSelf || filterCount>0) && <div className="workspace-actions" style={{alignItems:"center"}}>
        {hasSpam && <Checkbox checked={hideSpam} onCheckedChange={v=>options({spam:v?"1":""})}>Скрыть спам</Checkbox>}
        {hasSelf && <Checkbox checked={hideSelf} onCheckedChange={v=>options({self:v?"1":""})}>Скрыть переводы себе</Checkbox>}
        {filterCount>0 && <button className="card-link" onClick={()=>options({days:"",asset:"",dir:"",min:"",spam:"",self:"",from:"",until:""})}>Сбросить фильтры</button>}
        </div>}</div>}
        {(start>0 || focus) && <div className="workspace-actions">
        {start>0 && <button className="btn" onClick={()=>options({from:"",until:""})}>{new Date(start*1000).toLocaleString()} — {new Date(end*1000).toLocaleString()} ×</button>}
        {focus && <button className="btn" onClick={()=>options({focus:""})}>{label(focus)} ×</button>}
        </div>}
        {!analytic && <div className="workspace-actions" style={{alignItems:"flex-end"}}>
        <label className="sandbox-field">Найти адрес или имя<input value={search} onChange={e=>setSearch(e.target.value)}/></label>
        <button className="btn" disabled={!search.trim()} onClick={()=>{
          const q=search.trim().toLowerCase();
          const p=graph.points.find(p=>[p.raw,friendly(p.raw),names.get(p.raw)??""].some(v=>v.toLowerCase().includes(q)));
          if(p)view.current?.center(p.raw);else note("Адрес не найден в выборке.");
        }}>Найти</button>
        <button className="btn" aria-label="Уменьшить масштаб" onClick={()=>view.current?.zoom(1/1.5)}>−</button>
        <button className="btn" aria-label="Увеличить масштаб" onClick={()=>view.current?.zoom(1.5)}>+</button>
        <button className="btn" onClick={()=>view.current?.fit()}>Вписать граф</button>
        </div>}
        {comparison && <TransferComparison key={anchor} items={items} root={anchor} label={label} open={(raw,from,to)=>{
          openNode(raw);setComparisonRange({from,to,address:anchor});
        }}/>}
        {analytic ? <TransferCharts key={layout+root+opt("step")+asset+dir+anchor} rows={layout==="time"?filtered:rows} anchor={anchor} label={label} colors={colors} chart={chart}
          pair={(raw,direction)=>{setComparisonRange(null);setPairDirection(direction);select(raw);setLimit(30);}} range={(a,b)=>options({from:String(a),until:String(b)})}
          timeline={layout==="time"} step={opt("step")==="hour"?3600:86400} start={start} end={end}/> : <div style={{position:"relative",background:colors[0]}}>
          <svg ref={graphElement} className="transfer-graph-viewport" tabIndex={0} fontFamily="var(--font)" fontSize={12} aria-label="Граф переводов" style={{display:"block",width:"100%",height:fullscreen?"calc(100dvh - 160px)":"clamp(320px, 65vh, 1100px)",touchAction:"none",cursor:"grab",position:"relative",userSelect:"none"}}/></div>}
        {(!analytic || busy) && <p className="muted">{busy ? "Загружаю историю…" : !items.length && cursors.current.get(root)===null ? "В выборке нет событий." : graph.points.length>=1200 || graph.edges.length>=1800 ? "Нажмите на группу с числом, чтобы приблизить адреса." : "Нажмите на адрес, чтобы посмотреть переводы и раскрыть связи."}</p>}
      </div></section>}
    {message && <p className="field-help" role="status">{message}</p>}
    <Dialog.Root open={!!selected} onOpenChange={v=>{if(!v)select("");}}><Dialog.Portal container={document.fullscreenElement as HTMLElement | null}><Dialog.Overlay className="dialog-overlay"/>
      {selected && <Dialog.Content className="dialog-content wallet-form" aria-describedby={undefined}>
        <Dialog.Close className="nft-close" aria-label="Закрыть"><X size={16}/></Dialog.Close><Dialog.Title>{pairDirection==="in"?"Получено от адреса":pairDirection==="out"?"Отправлено на адрес":"Переводы адреса"}</Dialog.Title>
        <code style={{overflowWrap:"anywhere"}}>{friendly(selected)}</code>
        {!__WEB__ && investigation && <div className="wallet-form">
          <label className="sandbox-field">Заметка об адресе<textarea rows={2} maxLength={300} value={noteDraft??selectedNote} onChange={e=>setNoteDraft(e.target.value)} /></label>
          {noteDraft!==null && <div className="workspace-actions"><button className="btn" onClick={saveNote}>Сохранить заметку</button></div>}
        </div>}
        {!analytic && !comparisonRange && <div className="workspace-actions">
        {focus!==selected && <button className="btn" onClick={()=>{options({focus:selected});view.current?.center(selected);select("");}}>Показать окружение</button>}
        {canCollapse && <button className="btn" onClick={()=>{setCollapsed(v=>[...v,selected]);select("");}}>Скрыть связи адреса</button>}
        {(collapsed.includes(selected) || cursors.current.get(selected)!==null) && <button className="btn" disabled={busy} onClick={()=>{setCollapsed(v=>v.filter(raw=>raw!==selected));if(cursors.current.get(selected)!==null)void load(selected);select("");}}>{collapsed.includes(selected)?"Вернуть связи на граф":cursors.current.has(selected)?"Продолжить загрузку":"Загрузить связи адреса"}</button>}</div>}
        {detail.slice(0,limit).map(t=><article className="card" key={t.id}><div className="card-body wallet-form">
          <b>{t.from===t.to ? "Перевод себе" : t.from===(pairDirection?anchor:selected) ? "Исходящий перевод" : "Входящий перевод"} · {t.type==="TonTransfer" ? formatGram(t.amount,9) : t.amount || t.type}</b>
          <small className="muted">{new Date(t.time*1000).toLocaleString()} · {t.pending?"В обработке":t.ok?"Подтверждено":"Ошибка"}</small>
          <small className="muted" style={{overflowWrap:"anywhere"}}>{friendly(t.from===selected?t.to:t.from)}</small>
          {t.comment && <span>{t.comment}</span>}{t.nft && <small>NFT · {t.nft}</small>}
          <small className="muted" style={{overflowWrap:"anywhere"}}>{t.id.split("/")[0]}</small>{t.scam && <small>Спам</small>}</div></article>)}
        {detail.length>limit && <button className="btn" onClick={()=>setLimit(n=>n+30)}>Показать ещё</button>}
      </Dialog.Content>}</Dialog.Portal></Dialog.Root>
  </div>;
}
