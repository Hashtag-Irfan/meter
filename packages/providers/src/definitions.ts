
import { ClaudeCodeProvider } from "./adapters/claude-code/index.js";
import { CodexProvider } from "./adapters/codex/index.js";
import { CursorProvider } from "./adapters/cursor/index.js";
import { StubProviderParser } from "./adapters/stub.js";
import { defaultDetect } from "./paths.js";

import type { LogDirPattern, ProviderDefinition, ProviderId } from "@meter/shared";

// ─── Provider Icon (Claude Code) ──────────────────────────────────────────────
// Inlined data-URI so the providers package stays asset-free and web-safe.

const CLAUDE_ICON =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMkM2LjQ3NyAyIDIgNi40NzcgMiAxMnM0LjQ3NyAxMCAxMCAxMCAxMC00LjQ3NyAxMC0xMFMxNy41MjMgMiAxMiAyem0wIDE4Yy00LjQxOCAwLTgtMy41ODItOC04czMuNTgyLTggOC04IDggMy41ODIgOCA4LTMuNTgyIDgtOCA4eiIgZmlsbD0iI0Q5N0I0NiIvPjwvc3ZnPg==";

// ─── Concrete Provider Definitions ────────────────────────────────────────────

const claudeCode: ProviderDefinition = {
  id: "claude-code",
  name: "Claude Code",
  icon: CLAUDE_ICON,
  parser: new ClaudeCodeProvider(),
  logDirs: [
    { os: "all", base: "home", segments: [".claude", "projects"] },
    {
      os: "linux",
      base: "home",
      segments: [".local", "share", "claude", "projects"],
    },
  ],
  fileExtensions: [".jsonl"],
  detect: (env) => defaultDetect(claudeCode, env),
};

const codex: ProviderDefinition = {
  id: "codex",
  name: "Codex",
  icon: "",
  parser: new CodexProvider(),
  logDirs: [
    { os: "all", base: "home", segments: [".codex", "sessions"] },
    {
      os: "windows",
      base: "appdata",
      segments: ["codex", "sessions"],
    },
  ],
  fileExtensions: [".jsonl"],
};

const cursor: ProviderDefinition = {
  id: "cursor",
  name: "Cursor",
  icon: "",
  parser: new CursorProvider(),
  logDirs: [
    {
      os: "macos",
      base: "home",
      segments: [
        "Library",
        "Application Support",
        "Cursor",
        "User",
        "workspaceStorage",
      ],
    },
    {
      os: "linux",
      base: "home",
      segments: [".config", "Cursor", "User", "workspaceStorage"],
    },
    {
      os: "windows",
      base: "appdata",
      segments: ["Cursor", "User", "workspaceStorage"],
    },
  ],
  fileExtensions: [".vscdb", ".jsonl"],
};

// ─── Stub Helper ──────────────────────────────────────────────────────────────

function stubDef(
  id: ProviderId,
  name: string,
  logDirs: LogDirPattern[],
  fileExtensions: string[],
): ProviderDefinition {
  return { id, name, icon: "", parser: new StubProviderParser(id, name), logDirs, fileExtensions };
}

const geminiCli = stubDef(
  "gemini-cli",
  "Gemini CLI",
  [
    { os: "all", base: "home", segments: [".gemini", "tmp"] },
    { os: "windows", base: "appdata", segments: ["gemini", "tmp"] },
  ],
  [".json"],
);

const githubCopilot = stubDef(
  "github-copilot",
  "GitHub Copilot",
  [
    { os: "all", base: "home", segments: [".copilot", "logs"] },
    { os: "windows", base: "appdata", segments: ["copilot", "logs"] },
  ],
  [".log", ".db"],
);

const cline = stubDef(
  "cline",
  "Cline",
  [
    {
      os: "windows",
      base: "appdata",
      segments: [
        "Code",
        "User",
        "globalStorage",
        "saoudrizwan.claude-dev",
        "tasks",
      ],
    },
  ],
  [".json"],
);

const rooCode = stubDef(
  "roo-code",
  "Roo Code",
  [
    {
      os: "windows",
      base: "appdata",
      segments: [
        "Code",
        "User",
        "globalStorage",
        "rooveterinaryinc.roo-cline",
        "tasks",
      ],
    },
  ],
  [".json"],
);

const continueDev = stubDef(
  "continue",
  "Continue.dev",
  [{ os: "all", base: "home", segments: [".continue"] }],
  [".json", ".sqlite"],
);

const aider = stubDef(
  "aider",
  "Aider",
  [
    { os: "all", base: "home", segments: [".aider"] },
    { os: "windows", base: "appdata", segments: ["aider"] },
  ],
  [".md"],
);

// ─── Registry Configuration ───────────────────────────────────────────────────
//
// This is the single source of truth the registry is built from. Adding a
// provider is a pure data change here — no class registration required.

export const PROVIDERS: Record<ProviderId, ProviderDefinition> = {
  "claude-code": claudeCode,
  codex,
  cursor,
  "gemini-cli": geminiCli,
  "github-copilot": githubCopilot,
  cline,
  "roo-code": rooCode,
  continue: continueDev,
  aider,
};
