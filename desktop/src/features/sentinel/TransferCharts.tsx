/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

import {useLayoutEffect,useMemo, useRef, useState, type RefObject} from "react";
import type {Transfer} from "./transferNetwork";

export function quantity(value:bigint,decimals:number) {
  const digits=value.toString().padStart(decimals+1,"0");
  if(!decimals)return digits;
  const fraction=digits.slice(-decimals).replace(/0+$/,"");
  return digits.slice(0,-decimals)+(fraction?"."+fraction:"");
}
type Props={rows:Transfer[]; anchor:string; label:(raw:string)=>string; colors:string[];
  chart:RefObject<SVGSVGElement|null>; pair:(raw:string,direction:"in"|"out")=>void; range:(start:number,end:number)=>void;
  timeline:boolean; step:number; start:number; end:number};
export default function TransferCharts({rows,anchor,label,colors,chart,pair,range,timeline,step,start,end}:Props){
  const [hover,setHover]=useState(-1),[begin,setBegin]=useState(-1);
  const [zoom,setZoom]=useState(1),[active,setActive]=useState("");
  const pane=useRef<HTMLDivElement>(null);
  const drag=useRef<{x:number;y:number;left:number;top:number;moved:boolean}|null>(null);
  const dragging=useRef(false);
  const {left,right,bins,unit,decimals}=useMemo(()=>{
    const left=new Map<string,bigint>(),right=new Map<string,bigint>(), bins=new Map<number,[number,number]>();
    let unit="",decimals=0;
    for(const t of rows){
      if(t.to!==anchor && t.from!==anchor)continue;
      const time=Math.floor(t.time/step)*step;
      const counts=bins.get(time)??[0,0];
      if(t.to===anchor) counts[0]++;
      if(t.from===anchor) counts[1]++;
      bins.set(time,counts);
      if(timeline || !t.ok || t.pending || !/^\d+$/.test(t.units))continue;
      const amount=BigInt(t.units);unit=t.symbol;decimals=t.decimals;
      if(t.to===anchor)left.set(t.from,(left.get(t.from)??0n)+amount);
      if(t.from===anchor)right.set(t.to,(right.get(t.to)??0n)+amount);
    }
    const sort=(m:Map<string,bigint>)=>Array.from(m).sort((a,b)=>a[1]>b[1]?-1:a[1]<b[1]?1:0);
    return {left:sort(left),right:sort(right),bins,unit,decimals};
  },[rows,anchor,step,timeline]);
  const [bg,ink,line,accent]=colors;
  const hasFlow=!timeline && !!(left.length || right.length);
  useLayoutEffect(()=>{
    const el=pane.current;
    if(!hasFlow || !el)return;
    el.scrollLeft=el.clientWidth*.25;
    el.scrollTop=60;
  },[hasFlow,anchor]);
  if(timeline){
    const times=Array.from(bins.keys()).sort((a,b)=>a-b);
    if(!times.length)return <p className="muted">В выборке нет событий.</p>;
    const lo=times[0],hi=times[times.length-1]+step;
    // Combine adjacent buckets when the time span is wider than the chart.
    const stride=Math.max(1,Math.ceil((hi-lo)/step/100)), slots=Math.ceil((hi-lo)/(step*stride));
    const data=Array.from({length:slots},()=>[0,0]);
    for(const [t,c] of bins){const v=data[Math.floor((t-lo)/(step*stride))];v[0]+=c[0];v[1]+=c[1];}
    const max=Math.max(1,...data.flat()),dx=930/slots;
    const span=stride*step;
    const date=(sec:number)=>new Date(sec*1000).toLocaleDateString(undefined,{day:"numeric",month:"short",year:"2-digit"});
    const instant=(sec:number)=>step===3600 && span<86400?new Date(sec*1000).toLocaleString(undefined,{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}):date(sec);
    function indexAt(e:React.PointerEvent<SVGSVGElement>){
      const svg=e.currentTarget;
      const point=new DOMPoint(e.clientX,e.clientY).matrixTransform(svg.getScreenCTM()!.inverse());
      return Math.max(0,Math.min(slots-1,Math.floor((point.x-46)/dx)));
    }
    const index=hover>=0 && hover<slots?hover:-1;
    const chosen=(i:number)=>begin>=0 && index>=0 ? i>=Math.min(begin,index)&&i<=Math.max(begin,index) : end>lo+i*span && start<lo+(i+1)*span;
    return <div className="wallet-form">
      <div className="card-head"><h3>Активность по времени</h3><small className="muted">{index>=0?instant(lo+index*span):date(lo)+" — "+date(hi-1)}</small></div>
      <div className="workspace-actions"><span className="badge">↓ Входящие · {index>=0?data[index][0]:data.reduce((n,v)=>n+v[0],0)}</span>
        <span className="badge">↑ Исходящие · {index>=0?data[index][1]:data.reduce((n,v)=>n+v[1],0)}</span></div>
      <svg ref={chart} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 220" style={{width:"100%",background:bg,touchAction:"none",cursor:"crosshair"}} aria-label="Активность по времени"
        onPointerDown={e=>{if(e.button!==0)return;const i=indexAt(e);setBegin(i);setHover(i);e.currentTarget.setPointerCapture(e.pointerId);}}
        onPointerMove={e=>setHover(indexAt(e))} onPointerLeave={()=>{if(begin<0)setHover(-1);}} onPointerCancel={()=>setBegin(-1)}
        onPointerUp={e=>{if(begin<0)return;const i=indexAt(e);range(lo+Math.min(i,begin)*span,Math.min(hi,lo+(Math.max(i,begin)+1)*span));setBegin(-1);}}>
        <rect width="100%" height="100%" fill={bg}/>
        {[32,99,166].map((y,i)=><g key={y}><path d={`M46 ${y}H976`} stroke={line} opacity={i===1?.6:.22}/><text x="37" y={y+4} textAnchor="end" fill={line} fontSize="12">{i===1?0:max}</text></g>)}
        {data.map(([a,b],i)=>{const t=lo+i*span,x=46+i*dx,w=Math.min(28,dx*.76),mid=x+(dx-w)/2;
          return <g key={t} role="button" tabIndex={0} aria-label={instant(t)+" · ↓ "+a+" · ↑ "+b} style={{outline:"none"}}
            onFocus={()=>setHover(i)} onBlur={()=>setHover(-1)} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();range(t,Math.min(hi,t+span));}}}>
            <rect x={x} y="18" width={dx} height="163" fill={accent} opacity={chosen(i)?.12:i===index?.07:0}/>
            {i===index && <path d={`M${x+dx/2} 16v164`} stroke={accent} strokeDasharray="3 4"/>}
            <rect x={mid} y={99-67*a/max} width={w} height={67*a/max} rx="2" fill={accent}/>
            <rect x={mid} y="100" width={w} height={67*b/max} rx="2" fill={ink} opacity=".72"/></g>})}
        {[...new Set([0,Math.floor((slots-1)/2),slots-1])].map(i=><text key={i} x={46+(i+.5)*dx} y="204" textAnchor={slots===1?"middle":i===0?"start":i===slots-1?"end":"middle"} fontSize="12" fill={ink}>{instant(lo+i*span)}</text>)}
      </svg><p className="field-help">Потяните по шкале, чтобы выбрать период.</p></div>;
  }
  if(!left.length&&!right.length)return <p className="muted">В выборке нет событий.</p>;
  const height=Math.max(240,90+Math.max(left.length,right.length)*42);
  const hub=Math.min(height/2,235);
  const max=[left[0]?.[1]??0n,right[0]?.[1]??0n].reduce((a,b)=>a>b?a:b);
  function changeZoom(next:number){
    const el=pane.current;if(!el)return;
    const factor=next/zoom, x=el.scrollLeft+el.clientWidth/2,y=el.scrollTop+el.clientHeight/2;
    setZoom(next);requestAnimationFrame(()=>el.scrollTo(x*factor-el.clientWidth/2,y*factor-el.clientHeight/2));
  }
  return <div className="wallet-form"><div className="workspace-actions" style={{alignItems:"center"}}>
    <button className="btn" aria-label="Уменьшить масштаб" disabled={zoom<=.6} onClick={()=>changeZoom(Math.max(.6,zoom/1.25))}>−</button>
    <button className="card-link" onClick={()=>changeZoom(1)}>{Math.round(zoom*100)} %</button>
    <button className="btn" aria-label="Увеличить масштаб" disabled={zoom>=3} onClick={()=>changeZoom(Math.min(3,zoom*1.25))}>+</button>
    <small className="muted">Потяните схему для перемещения. Нажмите на линию для просмотра переводов.</small></div>
    <div ref={pane} className="tx-inspector" style={{overflow:"auto",maxHeight:"65vh",background:bg,touchAction:"none",cursor:"grab"}}
      onPointerDown={e=>{if(e.button!==0)return;const el=e.currentTarget;dragging.current=false;drag.current={x:e.clientX,y:e.clientY,left:el.scrollLeft,top:el.scrollTop,moved:false};}}
      onPointerMove={e=>{const d=drag.current;if(!d||!e.buttons)return;const dx=e.clientX-d.x,dy=e.clientY-d.y;
        if(!d.moved && Math.hypot(dx,dy)<4)return;
        d.moved=true;dragging.current=true;const el=e.currentTarget;el.setPointerCapture(e.pointerId);el.scrollTo(d.left-dx,d.top-dy);}}
      onPointerCancel={()=>{drag.current=null;}} onPointerUp={()=>{drag.current=null;}}>
    <div style={{boxSizing:"content-box",width:`${zoom*100}%`,minWidth:760*zoom,padding:"60px 25%"}}>
    <svg ref={chart} xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 1000 ${height}`} style={{display:"block",width:"100%",background:bg,userSelect:"none"}}>
      <rect width="100%" height="100%" fill={bg}/>
      {[left,right].map((side,j)=>{const x=j?984:16;
        return <g key={j} textAnchor={j?"end":"start"} fill={ink}><text x={x} y="25" fontSize="15" fontWeight="600">{j?"Отправлено":"Получено"}</text>
          <text x={x} y="46" fontSize="13" fill={line}>{quantity(side.reduce((n,v)=>n+v[1],0n),decimals)} {unit}</text></g>})}
      {[left,right].map((side,j)=>side.map(([raw,value],i)=>{const y=82+i*42,x=j?720:280,key=j+raw,hot=active===key;
        const curve=`M500 ${hub} C${(500+x)/2} ${hub} ${(500+x)/2} ${y} ${x} ${y}`;
        return <g key={key} role="button" tabIndex={0} style={{outline:"none",cursor:"pointer"}}
          onPointerEnter={()=>setActive(key)} onPointerLeave={()=>setActive("")} onFocus={()=>setActive(key)} onBlur={()=>setActive("")}
          onClick={()=>{if(!dragging.current)pair(raw,j?"out":"in");}} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();pair(raw,j?"out":"in");}}}>
          <title>{label(raw)} · {quantity(value,decimals)} {unit}</title>
          <path d={curve} stroke="transparent" strokeWidth="12" fill="none"/>
          <path d={curve} stroke={hot?accent:j?line:accent} strokeLinecap="round" opacity={hot?1:.6} strokeWidth={Math.max(1,Number(value*1400n/(max||1n))/100)} fill="none"/>
          <rect x={j?724:8} y={y-18} width="268" height="38" rx="7" fill={accent} opacity={hot?.13:0}/>

          <g textAnchor={j?"start":"end"}><text x={j?736:264} y={y-2} fill={ink} fontSize="13">{label(raw)}</text>
          <text x={j?736:264} y={y+13} fill={line} fontSize="11">{quantity(value,decimals)} {unit}</text></g></g>}))}
      <rect x="425" y={hub-16} width="150" height="32" rx="8" fill={bg} stroke={line}/><text x="500" y={hub+4} textAnchor="middle" fontSize="13" fill={ink}>{label(anchor)}</text>
    </svg></div></div></div>;
}
