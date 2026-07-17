import type { HostEnv, ProviderDefinition } from "@meter/shared";

// ─── Platform-Agnostic Log Path Resolution ────────────────────────────────────
//
// This module is intentionally free of `node:fs`, `node:os`, and `node:path`.
// Every operation receives the bits of host state it needs via a `HostEnv`
// (or the narrower `PathEnv`) so the same code runs in browsers, Chrome
// extensions, and Node hosts. See ADR #2.

/** The subset of `HostEnv` that path resolution needs. */
export type PathEnv = Pick<HostEnv, "platform" | "homedir" | "appData">;

/**
 * Join path segments with `/`, dropping empty segments.
 * We normalize on `/` because provider log paths are always POSIX-style
 * (even on Windows the `~`-relative config dirs use forward slashes).
 */
export function joinPath(...segments: string[]): string {
  return segments.filter((s) => s.length > 0).join("/");
}

/**
 * Resolve the concrete log directories for a provider on the current
 * platform. Only patterns matching `env.platform` (or `"all"`) are emitted.
 */
export function resolveLogDirs(
  def: Pick<ProviderDefinition, "logDirs">,
  env: PathEnv,
): string[] {
  return def.logDirs
    .filter((pattern) => pattern.os === "all" || pattern.os === env.platform)
    .map((pattern) => {
      const root =
        pattern.base === "appdata" ? env.appData() : env.homedir();
      return joinPath(root, ...pattern.segments);
    });
}

/**
 * Check whether a file name has one of the supported log extensions.
 */
export function isSupportedLogFile(
  fileName: string,
  extensions: readonly string[],
): boolean {
  const ext = fileName.includes(".")
    ? fileName.slice(fileName.lastIndexOf(".")).toLowerCase()
    : "";
  return extensions.includes(ext);
}

/**
 * Expand a provider's log directories into concrete, existing file paths by
 * reading the directory listing through the injected `env`. Non-existent or
 * unreadable directories are skipped silently.
 */
export async function expandLogPaths(
  def: ProviderDefinition,
  env: HostEnv,
): Promise<string[]> {
  const dirs = resolveLogDirs(def, env);
  const files: string[] = [];

  for (const dir of dirs) {
    if (!env.existsSync(dir)) continue;
    let entries: string[];
    try {
      entries = env.readdirSync(dir);
    } catch {
      // Directory unreadable — skip silently
      continue;
    }
    for (const name of entries) {
      if (isSupportedLogFile(name, def.fileExtensions)) {
        files.push(joinPath(dir, name));
      }
    }
  }

  return files;
}

/**
 * Extract a project path from a log file path heuristically.
 * Falls back to the log directory if no project path can be determined.
 *
 * Claude Code embeds project paths in filenames like:
 *   <hash>_<encoded-project-path>.jsonl
 */
export function extractProjectPath(
  logFilePath: string,
  fallback = "unknown",
): string {
  const noExt = logFilePath.includes(".")
    ? logFilePath.slice(0, logFilePath.lastIndexOf("."))
    : logFilePath;
  const basename = noExt.includes("/")
    ? noExt.slice(noExt.lastIndexOf("/") + 1)
    : noExt;

  const parts = basename.split("_");
  if (parts.length > 1) {
    try {
      const decoded = decodeURIComponent(parts.slice(1).join("_"));
      if (decoded.startsWith("/") || /^[A-Za-z]:\\/.test(decoded)) {
        return decoded;
      }
    } catch {
      // ignore decoding errors
    }
  }

  return fallback;
}

/**
 * Default detection: a provider is "installed" if any of its resolved log
 * directories exist on disk.
 */
export async function defaultDetect(
  def: ProviderDefinition,
  env: HostEnv,
): Promise<boolean> {
  const dirs = resolveLogDirs(def, env);
  return dirs.some((dir) => {
    try {
      return env.existsSync(dir);
    } catch {
      return false;
    }
  });
}

/**
 * Resolve a relative path (e.g. `~/foo`) against a home directory without
 * using `node:path`. Kept for host convenience / legacy callers.
 */
export function resolveHome(filePath: string, home: string): string {
  if (filePath === "~" || filePath.startsWith("~/")) {
    return joinPath(home, filePath.slice(1));
  }
  return filePath;
}
