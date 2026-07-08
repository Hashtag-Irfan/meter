// ─── Provider IDs ───────────────────────────────────────────────────────────

export const PROVIDER_IDS = [
  "claude-code",
  "codex",
  "cursor",
  "gemini-cli",
  "github-copilot",
  "cline",
  "roo-code",
  "continue",
  "aider",
] as const;

export type ProviderId = (typeof PROVIDER_IDS)[number];

// ─── Event Types ─────────────────────────────────────────────────────────────

export const EVENT_TYPES = [
  "prompt",
  "completion",
  "accept",
  "reject",
  "edit",
  "session_start",
  "session_end",
  "error",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

// ─── Time Periods ─────────────────────────────────────────────────────────────

export const TIME_PERIODS = ["hour", "day", "week", "month"] as const;
export type TimePeriod = (typeof TIME_PERIODS)[number];

// ─── DB ───────────────────────────────────────────────────────────────────────

export const DB_NAME = "meter";
export const DB_VERSION = 1;

export const STORE_NAMES = {
  SESSIONS: "sessions",
  EVENTS: "events",
  SNAPSHOTS: "snapshots",
} as const;

export type StoreName = (typeof STORE_NAMES)[keyof typeof STORE_NAMES];

// ─── Pricing (USD per 1M tokens, approximate) ─────────────────────────────────

export const PROVIDER_PRICING: Record<
  ProviderId,
  { inputPer1M: number; outputPer1M: number } | null
> = {
  "claude-code": { inputPer1M: 3.0, outputPer1M: 15.0 },
  codex: { inputPer1M: 1.5, outputPer1M: 6.0 },
  cursor: null, // subscription-based; cost estimation not applicable
  "gemini-cli": { inputPer1M: 0.075, outputPer1M: 0.3 },
  "github-copilot": null,
  cline: null,
  "roo-code": null,
  continue: null,
  aider: null,
};

// ─── UI ───────────────────────────────────────────────────────────────────────

export const SIDEBAR_WIDTH = 240;
export const CHART_COLORS = {
  primary: "hsl(263, 85%, 60%)",
  secondary: "hsl(220, 70%, 55%)",
  success: "hsl(142, 71%, 45%)",
  warning: "hsl(38, 92%, 50%)",
  danger: "hsl(0, 84%, 60%)",
  muted: "hsl(0, 0%, 40%)",
} as const;
