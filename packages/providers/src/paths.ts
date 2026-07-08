import path from "node:path";
import os from "node:os";

// ─── Platform-Aware Log Path Resolution ──────────────────────────────────────

/**
 * Resolve a path relative to the user's home directory.
 * Works on macOS, Linux, and Windows.
 *
 * @example
 * resolveHome("~/.claude/logs") // => "/Users/alice/.claude/logs"
 */
export function resolveHome(filePath: string): string {
  if (filePath.startsWith("~/") || filePath === "~") {
    return path.join(os.homedir(), filePath.slice(2));
  }
  return filePath;
}

/**
 * Canonical log directories for each supported provider.
 * Returns an array because some providers write logs to multiple locations
 * depending on the OS or installation method.
 */
export const PROVIDER_LOG_DIRS: Record<string, string[]> = {
  "claude-code": [
    resolveHome("~/.claude/logs"),
    // Claude Code may also write to an XDG-style location on Linux
    ...(process.platform === "linux"
      ? [path.join(os.homedir(), ".local", "share", "claude", "logs")]
      : []),
  ],
  codex: [
    resolveHome("~/.codex/logs"),
    // Windows: %APPDATA%\codex\logs
    ...(process.platform === "win32"
      ? [path.join(process.env["APPDATA"] ?? os.homedir(), "codex", "logs")]
      : []),
  ],
  cursor: [
    // macOS
    ...(process.platform === "darwin"
      ? [
          path.join(
            os.homedir(),
            "Library",
            "Application Support",
            "Cursor",
            "logs",
          ),
        ]
      : []),
    // Linux
    ...(process.platform === "linux"
      ? [path.join(os.homedir(), ".config", "Cursor", "logs")]
      : []),
    // Windows
    ...(process.platform === "win32"
      ? [
          path.join(
            process.env["APPDATA"] ?? os.homedir(),
            "Cursor",
            "logs",
          ),
        ]
      : []),
  ],
};

/**
 * Check whether a file path has a supported log extension.
 */
export function isSupportedLogFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return ext === ".jsonl" || ext === ".log" || ext === ".json";
}

/**
 * Extract a project path from a log file path heuristically.
 * Falls back to the log directory if no project path can be determined.
 */
export function extractProjectPath(
  logFilePath: string,
  fallback = "unknown",
): string {
  // Claude Code embeds project paths in filenames like:
  // <hash>_<encoded-project-path>.jsonl
  const basename = path.basename(logFilePath, path.extname(logFilePath));
  const parts = basename.split("_");
  if (parts.length > 1) {
    // Attempt to decode the second segment as a URL-encoded path
    try {
      const decoded = decodeURIComponent(parts.slice(1).join("_"));
      if (decoded.startsWith("/") || decoded.match(/^[A-Za-z]:\\/)) {
        return decoded;
      }
    } catch {
      // ignore decoding errors
    }
  }
  return fallback;
}
