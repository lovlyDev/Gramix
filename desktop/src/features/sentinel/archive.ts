/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

export type State={state:{type:"active"|"uninit"|"frozen";code?:string|null;data?:string|null;stateHash?:string};balance:{coins:string};last:null|{lt:string;hash:string}};
type Reply={ok:boolean;result:{last?:{seqno:number};config?:{bytes:string};state?:string;balance?:string;data?:string;code?:string;frozen_hash?:string;last_transaction_id?:State["last"]}};
let queue=Promise.resolve();
let lastRequest=0;
export function archive<T>(block?:number,account?:string):Promise<T>{
  const task=queue.then(async()=>{
    for(let attempt=0;;attempt++){
      const delay=Math.max(0,lastRequest+(attempt?2000*attempt:1250)-Date.now());
      if(delay)await new Promise(r=>setTimeout(r,delay));
      try{return await readArchive<T>(block,account)}
      catch(e){if(attempt>=3||!String(e).match(/429|\u043b\u0438\u043c\u0438\u0442|\u0447\u0430\u0441\u0442\u043e\u0442/i))throw e}
      finally{lastRequest=Date.now()}
    }
  });queue=task.then(()=>{},()=>{});return task
}
async function readArchive<T>(block?:number,account?:string):Promise<T>{
  if(block!==undefined&&(!Number.isSafeInteger(block)||block<1||block>4294967295))throw Error("Проверьте номер блока Mainnet.");
  let reply:Reply;
  if(__WEB__){
    const path=block===undefined?"getMasterchainInfo":account?"getAddressInformation?seqno="+block+"&address="+encodeURIComponent(account):"getConfigAll?seqno="+block;
    const res=await fetch("https://toncenter.com/api/v2/"+path,{signal:AbortSignal.timeout(12000),credentials:"omit",cache:"no-store"});
    if(!res.ok)throw Error("TON Center · HTTP "+res.status);reply=await res.json()
  }else{const {invoke}=await import("@tauri-apps/api/core");reply=await invoke<Reply>("sentinel_archive",{block,account})}
  if(!reply.ok)throw Error("TON Center: "+JSON.stringify(reply.result).slice(0,200));
  const r=reply.result;
  if(!block&&Number.isInteger(r.last?.seqno))return {last:r.last,now:Math.floor(Date.now()/1000)} as T;
  if(block&&!account&&r.config?.bytes)return {config:{cell:r.config.bytes}} as T;
  if(account&&r.state&&r.balance!==undefined){
    if(!["active","frozen","uninitialized"].includes(r.state))throw Error("TON Center · "+r.state);
    return {account:{state:{type:r.state==="uninitialized"?"uninit":r.state,code:r.code||null,data:r.data||null,stateHash:r.frozen_hash},balance:{coins:r.balance==="-1"?"0":String(r.balance)},last:r.last_transaction_id?.lt==="0"?null:r.last_transaction_id}} as T
  }
  throw Error("TON Center · "+JSON.stringify(r).slice(0,120))
}
export const head=()=>archive<{last:{seqno:number};now:number}>();
export type TraceNode={address:string;from:string;amount:string;fees:string;aborted:boolean|null;hash:string;parent:string|null;opcode:string;out:string[];asset:string;oldState:string;newState:string};
export type Trace={block:number;nodes:TraceNode[]};
export type SimulationInput={boc:string;from:string;to:string;amount:string;mode:string};
export function simulate(input:SimulationInput):Promise<Trace>{
  return new Promise((resolve,reject)=>{
    const worker=new Worker(new URL("../../workers/guardian.worker.ts",import.meta.url),{type:"module"});
    const done=()=>{worker.terminate();clearTimeout(timer)};
    const timer=setTimeout(()=>{done();reject(Error("Sandbox превысил лимит 60 секунд."))},60000);
    worker.onerror=e=>{done();reject(Error(e.message))};
    worker.onmessage=async({data})=>{
      if(data.request){
        try{const result=await archive(data.block,data.account);worker.postMessage({id:data.id,result})}
        catch(e){worker.postMessage({id:data.id,error:String(e)})}return
      }
      done();if(data.error)reject(Error(data.error));else resolve(data.trace)
    };worker.postMessage({input})
  })
}
