/*
 * Copyright (C) 2026 [COPYRIGHT HOLDER].
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of VANTIX.
 *
 * VANTIX is dual-licensed under the GNU Affero General
 * Public License v3.0 and a separate commercial license.
 *
 * See LICENSE and LICENSING.md for details.
 */

import { describe, expect, it } from "vitest";
import { parseTolkProject } from "./builderProject";

describe("Tolk project import", () => {
  it("accepts nested source files and a valid entrypoint", () => {
    expect(parseTolkProject({ entrypoint: "src/main.tolk", files: {
      "src/main.tolk": "import \"lib/math\";", "lib/math.tolk": "fun sum() {}",
    } }).files["lib/math.tolk"]).toBe("fun sum() {}");
  });

  it("rejects traversal, missing entrypoints, case collisions and oversized projects", () => {
    expect(() => parseTolkProject({ entrypoint: "../main.tolk",
      files: { "../main.tolk": "" } })).toThrow(/имя/);
    expect(() => parseTolkProject({ entrypoint: "missing.tolk",
      files: { "main.tolk": "" } })).toThrow(/Входной/);
    expect(() => parseTolkProject({ entrypoint: "main.tolk",
      files: { "main.tolk": "", "MAIN.tolk": "" } })).toThrow(/регистром/);
    expect(() => parseTolkProject({ entrypoint: "main.tolk",
      files: { "main.tolk": "x".repeat(130 * 1024) } })).toThrow(/128 КиБ/);
  });
});
