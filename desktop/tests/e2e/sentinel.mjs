/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

import assert from "node:assert/strict";
import {existsSync} from "node:fs";
import {chromium} from "playwright-core";
import {preview} from "vite";
import {Address} from "@ton/core";
import {defaultConfig} from "@ton/sandbox/dist/config/defaultConfig.js";
const browser=await chromium.launch({executablePath:[process.env.GRAMIX_E2E_BROWSER,"C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe","/usr/bin/chromium"].filter(Boolean).find(existsSync),headless:true});
const server=await preview({mode:"web",preview:{host:"127.0.0.1",port:1438,strictPort:true}});
try{
  const page=await browser.newPage({locale:"ru-RU",viewport:{width:1360,height:850}});
  if(process.env.GRAMIX_E2E_LIVE_ARCHIVE){page.on("response",r=>{if(r.url().includes("toncenter.com"))console.log(r.status(),r.url())});page.on("requestfailed",r=>console.log(r.failure()?.errorText,r.url().split("?")[0]))}
  const errors=[];page.on("pageerror",e=>errors.push(e.message));page.setDefaultTimeout(12000);
  const root="http://127.0.0.1:1438",raw="0:"+"1".repeat(64),to=Address.parseRaw(raw).toString();
  if(!process.env.GRAMIX_E2E_LIVE_ARCHIVE)await page.route("https://toncenter.com/api/v2/**",route=>{
    const url=route.request().url();const data=url.endsWith("getMasterchainInfo")?{last:{seqno:123}}:url.includes("getConfigAll")?{config:{bytes:defaultConfig}}:{state:"uninitialized",balance:"0",last_transaction_id:null};
    return route.fulfill({json:{ok:true,result:data}})
  });
  await page.route("https://tonapi.io/**",route=>{
    const url=route.request().url();return route.fulfill({json:url.includes("_bulk")?{accounts:["1","2","3"].map(digit=>({address:"0:"+digit.repeat(64),balance:3100000000,status:"active"}))}:url.includes("/events")?{events:[{event_id:"c".repeat(64),timestamp:Math.floor(Date.now()/1000),lt:3,actions:[{type:"TonTransfer",status:"ok",TonTransfer:{amount:1000000000,recipient:{address:raw}},simple_preview:{description:"Sentinel transfer"}}]}]}:url.includes("/rates")?{rates:{TON:{prices:{USD:2,RUB:160}}}}:url.includes("/nfts")?{nft_items:[{address:"0:"+"3".repeat(64),metadata:{name:"@sentinel"},collection:{name:"Telegram Usernames"}}]}:{balances:[]}})
  });
  await page.goto(root+"/sentinel-watch");await page.getByLabel("Публичный адрес",{exact:true}).fill(raw);
  await page.getByRole("button",{name:"Добавить адрес",exact:true}).click();
  await page.getByRole("combobox",{name:"Кошельки"}).waitFor();
  for (const digit of ["2","3"]) {
    await page.getByLabel("Публичный адрес",{exact:true}).fill("0:"+digit.repeat(64));
    await page.getByLabel("Название",{exact:true}).fill("Wallet "+digit);
    await page.getByRole("button",{name:"Добавить адрес",exact:true}).click();
    await page.getByRole("combobox",{name:"Кошельки"}).filter({hasText:"Wallet "+digit}).waitFor();
  }
  const portfolio = () => page.evaluate(() => {
    history.pushState({}, "", "/sentinel-portfolio");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
  await portfolio();
  await page.getByRole("button",{name:"Управлять кошельками"}).click();
  await page.getByRole("combobox",{name:"Кошельки"}).filter({hasText:"Wallet 3"}).waitFor();
  await portfolio();
  await page.getByText("Распределение активов",{exact:true}).waitFor();
  await page.locator(".nft-grid .nft-tile").getByText("@sentinel").first().click();
  await page.getByRole("dialog").waitFor();
  await page.keyboard.press("Escape");
  assert(await page.locator("main .token-row:visible").count()>=2);
  const download=page.waitForEvent("download");await page.getByRole("button",{name:"Скачать CSV"}).click();assert.equal((await download).suggestedFilename(),"gramix-portfolio.csv");
  await page.goto(root+"/sentinel-contract");await page.getByLabel("Публичный адрес контракта").fill(raw);await page.getByRole("button",{name:"Получить состояние"}).click();await page.getByRole("button",{name:"Наблюдать в Watchtower"}).waitFor();
  const checkbox=page.getByRole("checkbox",{name:/Проверять изменения/});
  const tick=await checkbox.boundingBox();
  assert(tick.width<=24 && tick.height<=24);
  await checkbox.click();
  assert.equal(await checkbox.getAttribute("aria-checked"),"true");
  for(const name of ["Наблюдать в Watchtower","Сравнить блоки"]){
    const rect=await page.getByRole("button",{name,exact:true}).boundingBox();
    assert(rect.width<300,name);
  }
  await page.goto(root+"/sentinel-diff");await page.getByLabel("Публичный адрес контракта").fill(raw);
  await page.getByRole("button",{name:"Сравнить блоки"}).click();
  try{await page.getByRole("combobox",{name:"Раздел сравнения"}).click({timeout:30000})}catch(e){throw Error(await page.locator("main").innerText(),{cause:e})}await page.getByRole("option",{name:"Ячейки storage"}).click();
  await page.getByRole("combobox",{name:"Раздел сравнения"}).click();
  await page.getByRole("option",{name:"ABI · JSON"}).click();
  const picker=page.waitForEvent("filechooser");
  await page.getByRole("button",{name:"Исходный блок · ABI JSON"}).click();
  await (await picker).setFiles({name:"first.json",mimeType:"application/json",buffer:Buffer.from('{"methods":[]}')});
  await page.getByText("first.json",{exact:true}).waitFor();
  await page.goto(root+"/sentinel-guardian");await page.getByLabel("Адрес отправителя").fill(Address.parseRaw("0:"+"2".repeat(64)).toString());
  await page.getByLabel("Контракт назначения").fill(to);await page.getByLabel("Сумма GRAM").fill("0.1");
  const button=page.getByRole("button",{name:"Запустить симуляцию"});
  const input=await page.getByLabel("Сумма GRAM").boundingBox(),pos=await button.boundingBox();
  assert(pos.y>input.y+input.height);
  await button.click();const go=page.getByRole("button",{name:"Открыть граф сообщений",exact:true});
  try{await go.waitFor({timeout:65000})}catch(e){throw Error((await page.locator("main").innerText()).slice(-1800),{cause:e})}
  await go.click();await page.getByText("Внешнее сообщение",{exact:true}).count();
  assert((await page.locator("main").innerText()).includes("Комиссия"));
  await page.goto(root+"/settings");assert.equal(await page.getByRole("tab",{name:"Telegram"}).count(),0);
  assert.equal(await page.locator('input[type="password"]:visible').count(),0);
  assert.deepEqual(errors,[]);console.log("Sentinel · адрес, сравнение, Radix Select, отступ, TVM, граф и веб-настройки — OK");
}finally{await browser.close();await server.close()}
