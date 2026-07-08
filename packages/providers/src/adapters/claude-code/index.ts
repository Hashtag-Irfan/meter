import fs from "node:fs";
import path from "node:path";

import { PROVIDER_LOG_DIRS, extractProjectPath, isSupportedLogFile } from "../../paths.js";

import type { ParsedEvent, ProviderPlugin } from "@meter/shared";


// ─── Claude Code Log Format ───────────────────────────────────────────────────
//
// Claude Code writes one JSON object per line (JSONL) to:
//   ~/.claude/logs/<hash>_<project>.jsonl
//
// Each line is one of several message types. The schema below covers
// what Claude Code 1.x emits. Fields may evolve across versions — the
// parser is intentionally lenient (unknown fields are preserved in `payload`).

interface ClaudeRawEntry {
  type?: string;
  timestamp?: string | number;
  // Prompt / request fields
  message?: {
    role?: string;
    content?: string | Array<{ type: string; text?: string }>;
  };
  // Usage / completion fields
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    cache_read_input_tokens?: number;
    cache_creation_input_tokens?: number;
  };
  // Timing
  duration_ms?: number;
  // Model info
  model?: string;
  // Session info
  session_id?: string;
  cwd?: string;
  // Everything else preserved
  [key: string]: unknown;
}

// ─── Claude Code Provider ─────────────────────────────────────────────────────

export class ClaudeCodeProvider implements ProviderPlugin {
  readonly id = "claude-code" as const;
  readonly name = "Claude Code";
  readonly version = "1.0.0";
  readonly icon =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMkM2LjQ3NyAyIDIgNi40NzcgMiAxMnM0LjQ3NyAxMCAxMCAxMCAxMC00LjQ3NyAxMC0xMFMxNy41MjMgMiAxMiAyem0wIDE4Yy00LjQxOCAwLTgtMy41ODItOC04czMuNTgyLTggOC04IDggMy41ODIgOCA4LTMuNTgyIDgtOCA4eiIgZmlsbD0iI0Q5N0I0NiIvPjwvc3ZnPg==";

  // ── ProviderPlugin interface ──────────────────────────────────────────────

  async detect(): Promise<boolean> {
    const dirs = PROVIDER_LOG_DIRS["claude-code"] ?? [];
    return dirs.some((dir) => {
      try {
        return fs.existsSync(dir);
      } catch {
        return false;
      }
    });
  }

  async getLogPaths(): Promise<string[]> {
    const dirs = PROVIDER_LOG_DIRS["claude-code"] ?? [];
    const logFiles: string[] = [];

    for (const dir of dirs) {
      try {
        if (!fs.existsSync(dir)) continue;
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isFile() && isSupportedLogFile(entry.name)) {
            logFiles.push(path.join(dir, entry.name));
          }
        }
      } catch {
        // Directory unreadable — skip silently
      }
    }

    return logFiles;
  }

  async parse(raw: string, filePath: string): Promise<ParsedEvent[]> {
    const lines = raw.split("\n").filter((l) => l.trim().length > 0);
    const projectPath = extractProjectPath(filePath);
    const events: ParsedEvent[] = [];

    for (const line of lines) {
      try {
        const entry = JSON.parse(line) as ClaudeRawEntry;
        const parsed = this.parseEntry(entry, projectPath);
        if (parsed !== null) {
          events.push(parsed);
        }
      } catch {
        // Malformed JSON line — skip, don't crash
      }
    }

    return events;
  }

  watch(paths: string[], onChange: (events: ParsedEvent[]) => void): () => void {
    const watchers = paths.map((filePath) => {
      let lastSize = 0;
      try {
        lastSize = fs.statSync(filePath).size;
      } catch {
        // File doesn't exist yet — start from 0
      }

      const watcher = fs.watch(filePath, { persistent: false }, async (event) => {
        if (event !== "change") return;
        try {
          const stat = fs.statSync(filePath);
          if (stat.size <= lastSize) return; // No new content

          // Read only the new bytes
          const fd = fs.openSync(filePath, "r");
          const buffer = Buffer.alloc(stat.size - lastSize);
          fs.readSync(fd, buffer, 0, buffer.length, lastSize);
          fs.closeSync(fd);
          lastSize = stat.size;

          const newContent = buffer.toString("utf-8");
          const newEvents = await this.parse(newContent, filePath);
          if (newEvents.length > 0) {
            onChange(newEvents);
          }
        } catch {
          // File read error — log but don't crash the watcher
        }
      });

      return watcher;
    });

    return () => watchers.forEach((w) => w.close());
  }

  // ── Private parsing logic ─────────────────────────────────────────────────

  private parseEntry(
    entry: ClaudeRawEntry,
    projectPath: string,
  ): ParsedEvent | null {
    const timestamp = this.parseTimestamp(entry.timestamp);
    if (timestamp === null) return null;

    const type = this.mapEntryType(entry);
    if (type === null) return null;

    const nativeId = this.buildNativeId(entry, timestamp);
    const tokensIn = this.extractTokensIn(entry);
    const tokensOut = this.extractTokensOut(entry);

    return {
      nativeId,
      type,
      timestamp,
      tokensIn,
      tokensOut,
      latencyMs: typeof entry.duration_ms === "number" ? entry.duration_ms : null,
      projectPath: entry.cwd ?? projectPath,
      payload: this.sanitizePayload(entry),
    };
  }

  private parseTimestamp(raw: string | number | undefined): number | null {
    if (raw === undefined || raw === null) return null;
    if (typeof raw === "number") return raw;
    const parsed = Date.parse(raw);
    return isNaN(parsed) ? null : parsed;
  }

  /**
   * Map Claude Code's raw `type` field to METER's canonical EventType.
   * Returns null for entries we don't want to track.
   */
  private mapEntryType(entry: ClaudeRawEntry): ParsedEvent["type"] | null {
    const t = entry.type?.toLowerCase() ?? "";
    const role = entry.message?.role?.toLowerCase() ?? "";

    // Prompts — user messages going to Claude
    if (t === "user" || role === "user") return "prompt";

    // Completions — Claude's responses
    if (t === "assistant" || role === "assistant") return "completion";

    // Tool result / code acceptance patterns
    if (t === "tool_result" || t === "tool_use") return "accept";

    // Session lifecycle
    if (t === "session_start" || t === "start") return "session_start";
    if (t === "session_end" || t === "end") return "session_end";

    // Error entries
    if (t === "error") return "error";

    return null;
  }

  private buildNativeId(entry: ClaudeRawEntry, timestamp: number): string {
    // Use session_id + timestamp as a stable deduplication key
    const sessionPart = entry.session_id ?? "unknown";
    const typePart = entry.type ?? "unknown";
    return `claude-code:${sessionPart}:${typePart}:${timestamp}`;
  }

  private extractTokensIn(entry: ClaudeRawEntry): number | null {
    const usage = entry.usage;
    if (!usage) return null;
    const base = usage.input_tokens ?? 0;
    const cacheRead = usage.cache_read_input_tokens ?? 0;
    const cacheCreate = usage.cache_creation_input_tokens ?? 0;
    const total = base + cacheRead + cacheCreate;
    return total > 0 ? total : null;
  }

  private extractTokensOut(entry: ClaudeRawEntry): number | null {
    const tokens = entry.usage?.output_tokens;
    return typeof tokens === "number" && tokens > 0 ? tokens : null;
  }

  /**
   * Strip large/noisy fields from payload to keep storage lean.
   * The raw content of prompts/completions is intentionally NOT stored
   * to preserve privacy — we only store metrics.
   */
  private sanitizePayload(entry: ClaudeRawEntry): Record<string, unknown> {
    const { message: _msg, usage, duration_ms, type: _type, timestamp: _timestamp, ...rest } = entry;
    return {
      model: rest.model,
      session_id: rest.session_id,
      ...(usage ? { usage } : {}),
      ...(duration_ms !== undefined ? { duration_ms } : {}),
    };
  }
}
