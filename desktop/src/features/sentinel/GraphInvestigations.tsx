/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

import {useState} from "react";
import Select from "../../components/ui/Select";
import type {Transfer} from "./transferNetwork";

const storageKey="gramix.sentinel.investigations.v1";
export type Investigation={id:string; name:string; query:string; savedAt:number; notes:Record<string,string>};
export function readInvestigations(): Investigation[] {
  if(__WEB__)return [];
  try {
    const data:unknown=JSON.parse(localStorage.getItem(storageKey)??"[]");
    return Array.isArray(data) ? data.filter(item=>item && typeof item.id==="string" &&
      typeof item.name==="string" && typeof item.query==="string" && typeof item.savedAt==="number" &&
      item.notes && typeof item.notes==="object") : [];
  } catch { return []; }
}
export function storeInvestigations(views:Investigation[]) {
  localStorage.setItem(storageKey,JSON.stringify(views));
}
export function newConnections(items:Transfer[], timestamp:number, root:string) {
  const firstSeen=new Map<string,number>();
  for(const t of items){
    if(!t.ok || t.pending || !t.time || t.from===t.to || (t.from!==root && t.to!==root))continue;
    const peer=t.from===root?t.to:t.from;
    firstSeen.set(peer,Math.min(firstSeen.get(peer)??Infinity,t.time));
  }
  return [...firstSeen].filter(([,time])=>time>Math.floor(timestamp/1000)).map(([raw])=>raw);
}
export function GraphInvestigations({views,active,canSave,restore,save,remove}:{
  views:Investigation[];active:Investigation|undefined;canSave:boolean;
  restore:(view:Investigation)=>void;save:(name:string,update?:boolean)=>boolean;remove:(id:string)=>void;
}) {
  const [choice,setChoice]=useState(""), [name,setName]=useState("");
  const selected=views.find(view=>view.id===choice)??active??views[0];
  return <section className="card">
    <div className="card-head"><h2>Сохранённые разборы</h2></div>
    <div className="card-body wallet-form">
      <p className="field-help">Адрес, фильтры, раскрытые связи и заметки хранятся на этом компьютере.</p>
      {views.length>0 && <div className="workspace-actions">
        <Select label="Сохранённый разбор" value={selected?.id??""} onValueChange={setChoice}
          options={views.map(view=>({value:view.id,label:view.name}))}/>
        <button className="btn" onClick={()=>{if(selected)restore(selected);}}>Открыть</button>
        <button className="card-link" onClick={()=>{if(selected)remove(selected.id);}}>Удалить разбор</button>
      </div>}
      <form className="workspace-actions" onSubmit={e=>{e.preventDefault();if(canSave&&name.trim()&&save(name.trim()))setName("");}}>
        <input className="address-input" aria-label="Название разбора" placeholder="Название разбора" value={name} maxLength={80} onChange={e=>setName(e.target.value)}/>
        <button className="btn" disabled={!canSave||!name.trim()}>Сохранить новый разбор</button>
        {active && <button type="button" className="btn" disabled={!canSave} onClick={()=>save(active.name,true)}>Обновить разбор</button>}
      </form>
    </div>
  </section>;
}
