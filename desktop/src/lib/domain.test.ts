/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE for details.
 */

import { describe, expect, it } from "vitest";
import { domainFromInput } from "./domain";
import { parseValue } from "./links";

describe("домены и юзернеймы", () => {
  it("приводит ввод к имени домена", () => {
    expect(domainFromInput("Durov.ton")).toBe("durov.ton");
    expect(domainFromInput("@lovlyswag")).toBe("lovlyswag.t.me");
    expect(domainFromInput("https://t.me/lovlyswag")).toBe("lovlyswag.t.me");
    expect(domainFromInput("lovlyswag.t.me")).toBe("lovlyswag.t.me");
    expect(domainFromInput("sub.wallet.ton")).toBe("sub.wallet.ton");
  });
  it("не принимает адреса и мусор за домен", () => {
    expect(domainFromInput("EQBvW8Z5huBkMJYdnfAEM5JqTNkuWX3diqYENkWsIL0XggGG")).toBeNull();
    expect(domainFromInput("@abc")).toBeNull();
    expect(domainFromInput("example.com")).toBeNull();
    expect(domainFromInput("durov ton")).toBeNull();
  });
  it("поиск открывает «Проверку адреса» для домена", () => {
    expect(parseValue("durov.ton")?.kind).toBe("domain");
    expect(parseValue("https://tonviewer.com/wallet.ton")?.kind).toBe("domain");
    expect(parseValue("@lovlyswag")?.path).toBe("/address/lovlyswag.t.me");
  });
});
