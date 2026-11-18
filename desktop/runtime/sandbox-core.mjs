/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE and LICENSING.md for details.
 */

// Общее ядро Sandbox: Node-скрипт приложения и Web Worker сайта.
import { Blockchain } from "@ton/sandbox";
import { toNano } from "@ton/core";

const example = { title: "Перевод и восстановление snapshot", accounts: ["alice", "bob"],
  steps: [{ from: "alice", to: "bob", amountTon: "0.1" }] };

export function validateScenario(value) {
  const scenario = value ?? example;
  if (typeof scenario.title !== "string" || scenario.title.length > 80 ||
      !Array.isArray(scenario.accounts) || scenario.accounts.length < 2 || scenario.accounts.length > 8 ||
      !Array.isArray(scenario.steps) || scenario.steps.length < 1 || scenario.steps.length > 20)
    throw new Error("Некорректная структура сценария.");
  const names = new Set();
  for (const name of scenario.accounts) {
    if (typeof name !== "string" || !/^[a-z][a-z0-9_-]{1,23}$/.test(name) || names.has(name))
      throw new Error("Имена аккаунтов должны быть уникальными и состоять из латиницы, цифр, _ или -.");
    names.add(name);
  }
  for (const step of scenario.steps) {
    if (!step || !names.has(step.from) || !names.has(step.to) || step.from === step.to ||
        typeof step.amountTon !== "string" || !/^(?:0|[1-9]\d*)(?:\.\d{1,9})?$/.test(step.amountTon))
      throw new Error("В шаге указан неверный аккаунт или сумма TON.");
    const amount = toNano(step.amountTon);
    if (amount <= 0n || amount > toNano("10"))
      throw new Error("Сумма перевода должна быть больше нуля и не превышать 10 TON.");
  }
  return scenario;
}

// Only structured local actions are accepted. User JavaScript is never evaluated.
export async function runScenario(value) {
  const scenario = validateScenario(value);
  const blockchain = await Blockchain.create();
  const accounts = new Map();
  for (const name of scenario.accounts)
    accounts.set(name, await blockchain.treasury(`gramix-sandbox-${name}`));
  const snapshot = blockchain.snapshot();
  const balancesBefore = Object.fromEntries(await Promise.all(scenario.accounts.map(async (name) =>
    [name, (await accounts.get(name).getBalance()).toString()])));
  const transactions = [];
  for (let index = 0; index < scenario.steps.length; index++) {
    const step = scenario.steps[index];
    const transfer = await accounts.get(step.from).send({ to: accounts.get(step.to).address,
      value: toNano(step.amountTon) });
    for (const transaction of transfer.transactions) transactions.push({
      step: index + 1, from: step.from, to: step.to, amountNanoton: toNano(step.amountTon).toString(),
      hash: transaction.hash().toString("hex"), logicalTime: transaction.lt.toString(),
      feesNanoton: transaction.totalFees.coins.toString(), oldStatus: transaction.oldStatus,
      endStatus: transaction.endStatus,
      aborted: transaction.description.type === "generic" ? transaction.description.aborted : null,
    });
  }
  const balancesAfter = Object.fromEntries(await Promise.all(scenario.accounts.map(async (name) =>
    [name, (await accounts.get(name).getBalance()).toString()])));
  await blockchain.loadFrom(snapshot);
  const balancesRestored = Object.fromEntries(await Promise.all(scenario.accounts.map(async (name) =>
    [name, (await accounts.get(name).getBalance()).toString()])));
  const snapshotsRestored = scenario.accounts.every((name) =>
    balancesBefore[name] === balancesRestored[name]);
  if (!snapshotsRestored || transactions.length === 0)
    throw new Error("Локальный сценарий не прошёл проверку состояния.");
  return { source: "local TON Sandbox", network: "simulation",
    scenario: scenario.title, accounts: Object.fromEntries(scenario.accounts.map((name) =>
      [name, accounts.get(name).address.toRawString()])), steps: scenario.steps,
    balancesBefore, balancesAfter, balancesRestored, snapshotsRestored, transactions,
  };
}

