import { describe, expect, it } from "vitest";

import {
  calculateEventCost,
  calculateMetrics,
  generateDailyStandup,
  generateInsights,
  generateTimeSeries,
} from "../index.js";

import type { Event, Session } from "@meter/shared";


// ─── Test Fixtures ────────────────────────────────────────────────────────────

const SESS_1: Session = {
  id: "sess_1",
  provider: "claude-code",
  startedAt: 1750032000000, // 2025-06-15 00:00:00 UTC
  endedAt: 1750035600000, // 2025-06-15 01:00:00 UTC
  projectPath: "/home/user/project-alpha",
  metadata: {},
};

const SESS_2: Session = {
  id: "sess_2",
  provider: "cursor",
  startedAt: 1750039200000, // 2025-06-15 02:00:00 UTC
  endedAt: null,
  projectPath: "/home/user/project-beta",
  metadata: {},
};

const EVENTS: Event[] = [
  // Session 1: Claude Code
  {
    id: "evt_1",
    sessionId: "sess_1",
    provider: "claude-code",
    type: "prompt",
    timestamp: 1750032005000,
    tokensIn: 1000,
    tokensOut: null,
    latencyMs: null,
    payload: {},
  },
  {
    id: "evt_2",
    sessionId: "sess_1",
    provider: "claude-code",
    type: "completion",
    timestamp: 1750032008000,
    tokensIn: null,
    tokensOut: 2000,
    latencyMs: 3000,
    payload: {},
  },
  {
    id: "evt_3",
    sessionId: "sess_1",
    provider: "claude-code",
    type: "accept",
    timestamp: 1750032010000,
    tokensIn: null,
    tokensOut: null,
    latencyMs: null,
    payload: {},
  },
  // Session 2: Cursor (Subscription-based pricing is null)
  {
    id: "evt_4",
    sessionId: "sess_2",
    provider: "cursor",
    type: "prompt",
    timestamp: 1750039205000,
    tokensIn: 500,
    tokensOut: null,
    latencyMs: null,
    payload: {},
  },
  {
    id: "evt_5",
    sessionId: "sess_2",
    provider: "cursor",
    type: "completion",
    timestamp: 1750039210000,
    tokensIn: null,
    tokensOut: 800,
    latencyMs: 5000,
    payload: {},
  },
  {
    id: "evt_6",
    sessionId: "sess_2",
    provider: "cursor",
    type: "reject",
    timestamp: 1750039212000,
    tokensIn: null,
    tokensOut: null,
    latencyMs: null,
    payload: {},
  },
];

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe("calculateEventCost", () => {
  it("calculates cost for known provider with input tokens", () => {
    const event: Event = {
      id: "test",
      sessionId: "test",
      provider: "claude-code",
      type: "prompt",
      timestamp: Date.now(),
      tokensIn: 1_000_000, // Claude Code pricing is $3.00/1M input tokens
      tokensOut: 0,
      latencyMs: null,
      payload: {},
    };
    expect(calculateEventCost(event)).toBe(3.0);
  });

  it("calculates cost for known provider with output tokens", () => {
    const event: Event = {
      id: "test",
      sessionId: "test",
      provider: "claude-code",
      type: "completion",
      timestamp: Date.now(),
      tokensIn: 0,
      tokensOut: 1_000_000, // Claude Code pricing is $15.00/1M output tokens
      latencyMs: null,
      payload: {},
    };
    expect(calculateEventCost(event)).toBe(15.0);
  });

  it("returns 0 for providers without cost tables (Cursor)", () => {
    const event: Event = {
      id: "test",
      sessionId: "test",
      provider: "cursor",
      type: "prompt",
      timestamp: Date.now(),
      tokensIn: 5000,
      tokensOut: 10000,
      latencyMs: null,
      payload: {},
    };
    expect(calculateEventCost(event)).toBe(0);
  });
});

describe("calculateMetrics", () => {
  it("calculates aggregates correctly", () => {
    const metrics = calculateMetrics([SESS_1, SESS_2], EVENTS);

    expect(metrics.totalSessions).toBe(2);
    expect(metrics.totalEvents).toBe(6);
    expect(metrics.totalTokensIn).toBe(1500);
    expect(metrics.totalTokensOut).toBe(2800);
    expect(metrics.totalTokens).toBe(4300);

    // Claude Code Session 1 pricing:
    // Prompt: 1000 tokensIn * $3.00/1M = $0.003
    // Completion: 2000 tokensOut * $15.00/1M = $0.030
    // Total = $0.033
    expect(metrics.estimatedCostUsd).toBe(0.033);

    // Average latency: (3000 + 5000) / 2 = 4000
    expect(metrics.avgLatencyMs).toBe(4000);

    // Acceptance rate: 1 accept, 1 reject = 50% (0.5000)
    expect(metrics.acceptRate).toBe(0.5);

    // Active hours: sess_1 runs at hour 0, sess_2 runs at hour 2 -> 2 unique hours
    expect(metrics.activeHours).toBe(2);
  });

  it("handles empty arrays gracefully", () => {
    const metrics = calculateMetrics([], []);
    expect(metrics.totalSessions).toBe(0);
    expect(metrics.totalEvents).toBe(0);
    expect(metrics.acceptRate).toBeNull();
    expect(metrics.avgLatencyMs).toBeNull();
    expect(metrics.activeHours).toBe(0);
  });
});

describe("generateTimeSeries", () => {
  const tStart = 1750032000000; // 2025-06-15 00:00:00 UTC
  const tEnd = 1750042800000; // 2025-06-15 03:00:00 UTC

  it("groups events by hour intervals", () => {
    const series = generateTimeSeries(EVENTS, "hour", tStart, tEnd, "events");

    // Starts at 00:00, ends at 03:00 -> 4 hour buckets (00, 01, 02, 03)
    expect(series).toHaveLength(4);

    // First bucket (00:00 UTC) has events from Claude Code (evt_1, evt_2, evt_3)
    expect(series[0]?.value).toBe(3);

    // Second bucket (01:00 UTC) has 0 events
    expect(series[1]?.value).toBe(0);

    // Third bucket (02:00 UTC) has events from Cursor (evt_4, evt_5, evt_6)
    expect(series[2]?.value).toBe(3);
  });

  it("aggregates tokens metric over daily intervals", () => {
    const series = generateTimeSeries(EVENTS, "day", tStart, tEnd, "tokens");
    expect(series).toHaveLength(1); // entire window is inside 1 day
    expect(series[0]?.value).toBe(4300);
  });

  it("aggregates latency metric correctly", () => {
    const series = generateTimeSeries(EVENTS, "day", tStart, tEnd, "latency");
    expect(series[0]?.value).toBe(4000); // (3000 + 5000) / 2
  });

  it("aggregates cost metric correctly", () => {
    const series = generateTimeSeries(EVENTS, "day", tStart, tEnd, "cost");
    expect(series[0]?.value).toBe(0.033);
  });
});

describe("generateInsights", () => {
  it("flags consecutive prompt rejections as loop friction", () => {
    const loopEvents: Event[] = [
      { id: "1", sessionId: "s", provider: "claude-code", type: "reject", timestamp: 1, tokensIn: null, tokensOut: null, latencyMs: null, payload: {} },
      { id: "2", sessionId: "s", provider: "claude-code", type: "reject", timestamp: 2, tokensIn: null, tokensOut: null, latencyMs: null, payload: {} },
      { id: "3", sessionId: "s", provider: "claude-code", type: "reject", timestamp: 3, tokensIn: null, tokensOut: null, latencyMs: null, payload: {} },
      { id: "4", sessionId: "s", provider: "claude-code", type: "reject", timestamp: 4, tokensIn: null, tokensOut: null, latencyMs: null, payload: {} },
      { id: "5", sessionId: "s", provider: "claude-code", type: "reject", timestamp: 5, tokensIn: null, tokensOut: null, latencyMs: null, payload: {} },
    ];
    const insights = generateInsights([], loopEvents);
    const friction = insights.find((i) => i.id === "ai-friction-loop");
    expect(friction).toBeDefined();
    expect(friction?.type).toBe("warning");
  });

  it("flags peak active hours", () => {
    const insights = generateInsights([], EVENTS);
    const peak = insights.find((i) => i.id === "peak-activity");
    expect(peak).toBeDefined();
    expect(peak?.description).toContain("00:00 UTC"); // 3 events at hour 0, 3 at hour 2. Sort returns 0.
  });

  it("identifies top cost drivers", () => {
    const highCostEvents: Event[] = Array.from({ length: 5 }, (_, i) => ({
      id: `h_${i}`,
      sessionId: "s",
      provider: "claude-code",
      type: "prompt",
      timestamp: Date.now(),
      tokensIn: 500_000, // 5 * 500k = 2.5M tokensIn -> cost > $5.00
      tokensOut: 200_000,
      latencyMs: null,
      payload: {},
    }));

    const insights = generateInsights([], highCostEvents);
    const costDriver = insights.find((i) => i.id === "cost-driver");
    expect(costDriver).toBeDefined();
    expect(costDriver?.description).toContain("claude-code");
  });
});

describe("generateDailyStandup", () => {
  it("creates standup bullet list for projects", () => {
    const standup = generateDailyStandup([SESS_1, SESS_2], EVENTS);
    expect(standup).toContain("Daily AI Coding Standup");
    expect(standup).toContain("project-alpha");
    expect(standup).toContain("project-beta");
    expect(standup).toContain("Suggestions accepted: 1");
  });

  it("handles empty standup requests", () => {
    const standup = generateDailyStandup([], []);
    expect(standup).toContain("No activity logged");
  });
});
