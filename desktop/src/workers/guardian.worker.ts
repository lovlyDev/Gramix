/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

import "../lib/buffer-shim";
import "../lib/process-shim";
import {Blockchain,RemoteBlockchainStorage} from "@ton/sandbox";
import {Address,Cell,loadMessage,internal,toNano,type Message,type AccountState} from "@ton/core";
import {Buffer} from "buffer";
import type {TraceNode,State,SimulationInput} from "../features/sentinel/archive";
let seq=0;
const pending=new Map<number,{ok:(v:unknown)=>void;fail:(e:Error)=>void}>();
function read<T>(block?:number,account?:string):Promise<T>{
  return new Promise((ok,fail)=>{const id=++seq;pending.set(id,{ok:v=>ok(v as T),fail});self.postMessage({request:true,id,block,account})})
}
async function execute(input:SimulationInput){
  let msg:Message;
  if(input.mode==="boc"){
    const s=input.boc.trim();if(!s||s.length>131072)throw Error("Введите BOC сообщения до 64 КиБ.");
    const bytes=Buffer.from(s,/^[0-9a-f]+$/i.test(s)?"hex":"base64");if(bytes.length>65536)throw Error("BOC слишком велик.");
    const cells=Cell.fromBoc(bytes);if(cells.length!==1)throw Error("Ожидается один корень BOC.");
    msg=loadMessage(cells[0].beginParse());
  }else{
    const m=internal({to:Address.parse(input.to),value:toNano(input.amount),bounce:true});
    if(m.info.type!=="internal"||m.info.value.coins<=0n)throw Error("Введите положительную сумму GRAM.");
    msg={...m,info:{...m.info,src:Address.parse(input.from)}}
  }
  const latest=await read<{last:{seqno:number};now:number}>(),block=latest.last.seqno;
  const config=await read<{config:{cell:string}}>(block);
  const storage=new RemoteBlockchainStorage({getLastBlockSeqno:async()=>block,async getAccount(n,addr){
    const {account:a}=await read<{account:State}>(n,addr.toString());let state:AccountState;
    if(a.state.type==="active")state={type:"active",state:{code:a.state.code?Cell.fromBase64(a.state.code):undefined,data:a.state.data?Cell.fromBase64(a.state.data):undefined}};
    else if(a.state.type==="frozen")state={type:"frozen",stateHash:BigInt("0x"+Buffer.from(a.state.stateHash!,"base64").toString("hex"))};
    else state={type:"uninit"};
    return {state,balance:BigInt(a.balance.coins),lastTransaction:a.last?{lt:BigInt(a.last.lt),hash:Buffer.from(a.last.hash,"base64")}:undefined}
  }},block);
  const chain=await Blockchain.create({storage,config:Cell.fromBase64(config.config.cell)});chain.now=latest.now;
  const nodes:TraceNode[]=[];
  for await(const tx of await chain.sendMessageIter(msg)){
    if(nodes.length>=64)throw Error("Трасса превысила 64 транзакции.");
    const info=tx.inMessage?.info,body=tx.inMessage?.body.beginParse();
    const op=body&&body.remainingBits>=32?body.loadUint(32):null;
    let asset="";if(op===0x0f8a7ea5||op===0x178d4519||op===0x5fcc3d14){
      asset=op===0x5fcc3d14?"Сообщение передачи NFT":"Сообщение перевода Jetton";
      if(op!==0x5fcc3d14&&body&&body.remainingBits>=68){body.skip(64);asset+=" · "+body.loadCoins().toString()+" базовых единиц"}
    }
    nodes.push({hash:tx.hash().toString("hex"),parent:tx.parent?.hash().toString("hex")??null,
      address:info?.dest?.toString()??tx.address.toString(16),from:info?.src?.toString()??"Внешнее сообщение",amount:info?.type==="internal"?info.value.coins.toString():"0",
      fees:tx.totalFees.coins.toString(),aborted:tx.description.type==="generic"?tx.description.aborted:null,
      oldState:tx.oldStatus,newState:tx.endStatus,opcode:op===null?"—":"0x"+op.toString(16).padStart(8,"0"),asset,
      out:tx.outMessages.values().map(m=>m.info.dest?.toString()??"Внешнее сообщение")})
  }
  return {block,nodes}
}
self.onmessage=async({data})=>{
  if(data.id){const p=pending.get(data.id);pending.delete(data.id);if(data.error)p?.fail(Error(data.error));else p?.ok(data.result);return}
  try{self.postMessage({trace:await execute(data.input)})}catch(e){self.postMessage({error:e instanceof Error?e.message:String(e)})}
};
