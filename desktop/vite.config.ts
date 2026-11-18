/*
 * Copyright (C) 2026 lovlydev.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Gramix.
 *
 * See LICENSE and LICENSING.md for details.
 */

import { execSync } from "node:child_process";
import { copyFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const file = (path: string) => fileURLToPath(new URL(path, import.meta.url));

// Сайт GitHub Pages: 404.html нужен для прямых ссылок вида /address/…, CNAME — для домена.
function pagesFiles(): Plugin {
  return {
    name: "gramix-pages-files",
    apply: "build",
    closeBundle() {
      copyFileSync(file("./dist-web/index.html"), file("./dist-web/404.html"));
      writeFileSync(file("./dist-web/CNAME"), "gram.lovlydev.ru\n");
    },
  };
}

function commit() {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA;
  try { return execSync("git rev-parse HEAD", { encoding: "utf8" }).trim(); } catch { return ""; }
}

export default defineConfig(({ mode }) => {
  const web = mode === "web";
  return {
    plugins: [react(), tailwindcss(), ...(web ? [pagesFiles()] : [])],
    clearScreen: false,
    // Приложение и сайт собираются из одного кода; модули платформы и телеметрии
    // подменяются здесь, поэтому код телеметрии физически не попадает в приложение.
    resolve: {
      alias: {
        "@platform": file(web ? "./src/platform/web.ts" : "./src/platform/desktop.ts"),
        "@telemetry": file(web ? "./src/telemetry/web.tsx" : "./src/telemetry/noop.ts"),
      },
    },
    define: { __WEB__: JSON.stringify(web), __COMMIT__: JSON.stringify(web ? commit() : "") },
    worker: { format: "es" },
    server: { port: web ? 1421 : 1420, strictPort: true,
      watch: { ignored: ["**/src-tauri/target/**", "**/runtime/bundle/**"] } },
    envPrefix: ["VITE_", "TAURI_ENV_*"],
    build: web
      ? { target: "es2022", outDir: "dist-web", emptyOutDir: true }
      : { target: "chrome105" },
  };
});
