import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { expandLogPaths } from "./paths.js";

import type {
  HostEnv,
  ParsedEvent,
  Platform,
  ProviderDefinition,
  ProviderPlugin,
} from "@meter/shared";


// ─── Node Host Environment ────────────────────────────────────────────────────
//
// This is the ONLY module in `@meter/providers` that imports Node built-ins.
// It is intentionally excluded from the package's public `index.ts` so that
// browser/extension bundles never pull in `node:fs`. Node hosts (CLI, desktop
// app) may import this module directly.

function toPlatform(platform: string): Platform {
  if (platform === "win32") return "windows";
  if (platform === "darwin") return "macos";
  return "linux";
}

/**
 * Build a `HostEnv` backed by the real Node filesystem/OS APIs.
 */
export function createNodeEnv(): HostEnv {
  return {
    platform: toPlatform(process.platform),
    homedir: () => os.homedir(),
    appData: () =>
      process.env["APPDATA"] ?? path.join(os.homedir(), "AppData", "Roaming"),
    existsSync: (p) => fs.existsSync(p),
    readdirSync: (dir) => fs.readdirSync(dir),
    statSync: (p) => ({ size: fs.statSync(p).size }),
    readFileSync: (p) => fs.readFileSync(p, "utf-8"),
    watchFile: (p, onUpdate) => {
      const watcher = fs.watch(
        p,
        { persistent: false },
        (event) => {
          if (event === "change") onUpdate();
        },
      );
      return () => watcher.close();
    },
  };
}

/**
 * Wrap a pure `ProviderDefinition` into a runtime `ProviderPlugin` that
 * performs all host-bound work through an injected `HostEnv`.
 */
export function createHostProvider(def: ProviderDefinition): ProviderPlugin {
  return {
    id: def.id,
    name: def.name,
    version: def.parser.version,
    icon: def.icon,
    parse: (raw, filePath) => def.parser.parse(raw, filePath),
    detect: async (env) => (def.detect ? def.detect(env) : false),
    getLogPaths: (env) => expandLogPaths(def, env),
    watch: (paths, onChange, env) =>
      watchPaths(def, paths, onChange, env),
  };
}

/**
 * Watch a set of log files, emitting only the events from newly appended
 * content on each change.
 */
function watchPaths(
  def: ProviderDefinition,
  paths: string[],
  onChange: (events: ParsedEvent[]) => void,
  env: HostEnv,
): () => void {
  const watchFile = env.watchFile;
  if (!watchFile) return () => {};

  const cleanups = paths.map((filePath) => {
    let lastLength = 0;
    try {
      lastLength = env.readFileSync(filePath).length;
    } catch {
      // File not present yet — start from 0 once it appears
    }

    return watchFile(filePath, async () => {
      try {
        const content = env.readFileSync(filePath);
        if (content.length <= lastLength) return; // nothing new
        const newContent = content.slice(lastLength);
        lastLength = content.length;
        const events = await def.parser.parse(newContent, filePath);
        if (events.length > 0) onChange(events);
      } catch {
        // Read error — ignore and keep watching
      }
    });
  });

  return () => cleanups.forEach((stop) => stop?.());
}
