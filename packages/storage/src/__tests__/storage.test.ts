import "fake-indexeddb/auto";
import { generateId } from "@meter/shared";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { closeMeterDB, openMeterDB } from "../db.js";
import { StorageService } from "../storage.service.js";

import type { Event, Session, Snapshot } from "@meter/shared";


// ─── Test Fixtures ────────────────────────────────────────────────────────────

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: generateId(),
    provider: "claude-code",
    startedAt: Date.now() - 3600_000,
    endedAt: Date.now(),
    projectPath: "/home/user/my-project",
    metadata: {},
    ...overrides,
  };
}

function makeEvent(sessionId: string, overrides: Partial<Event> = {}): Event {
  return {
    id: generateId(),
    sessionId,
    provider: "claude-code",
    type: "prompt",
    timestamp: Date.now(),
    tokensIn: 150,
    tokensOut: 800,
    latencyMs: 420,
    payload: {},
    ...overrides,
  };
}

function makeSnapshot(overrides: Partial<Snapshot> = {}): Snapshot {
  return {
    id: generateId(),
    provider: "claude-code",
    period: "day",
    periodStart: new Date("2025-06-15T00:00:00Z").getTime(),
    metrics: {
      totalSessions: 5,
      totalEvents: 42,
      totalTokensIn: 10_000,
      totalTokensOut: 50_000,
      totalTokens: 60_000,
      estimatedCostUsd: 0.75,
      acceptRate: 0.82,
      avgLatencyMs: 380,
      activeHours: 6,
    },
    ...overrides,
  };
}

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe("StorageService", () => {
  let storage: StorageService;

  beforeEach(async () => {
    const db = await openMeterDB();
    storage = new StorageService(db);
  });

  afterEach(async () => {
    await storage.clearAll();
    closeMeterDB();
  });

  // ── Sessions ──────────────────────────────────────────────────────────────

  describe("sessions", () => {
    it("puts and retrieves a session by ID", async () => {
      const session = makeSession();
      await storage.putSession(session);
      const result = await storage.getSession(session.id);
      expect(result).toEqual(session);
    });

    it("returns undefined for a missing session", async () => {
      const result = await storage.getSession("non-existent-id");
      expect(result).toBeUndefined();
    });

    it("upserts (replaces) a session", async () => {
      const session = makeSession();
      await storage.putSession(session);
      const updated = { ...session, projectPath: "/new/path" };
      await storage.putSession(updated);
      const result = await storage.getSession(session.id);
      expect(result?.projectPath).toBe("/new/path");
    });

    it("queries all sessions", async () => {
      await storage.putSession(makeSession());
      await storage.putSession(makeSession());
      const results = await storage.getSessions();
      expect(results).toHaveLength(2);
    });

    it("queries sessions by provider", async () => {
      await storage.putSession(makeSession({ provider: "claude-code" }));
      await storage.putSession(makeSession({ provider: "codex" }));
      const results = await storage.getSessions({ provider: "claude-code" });
      expect(results).toHaveLength(1);
      expect(results[0]?.provider).toBe("claude-code");
    });

    it("queries sessions by time range", async () => {
      const now = Date.now();
      const old = makeSession({ startedAt: now - 10_000_000 });
      const recent = makeSession({ startedAt: now - 1000 });
      await storage.putSession(old);
      await storage.putSession(recent);

      const results = await storage.getSessions({ from: now - 5_000_000 });
      expect(results).toHaveLength(1);
      expect(results[0]?.id).toBe(recent.id);
    });

    it("queries sessions by projectPath", async () => {
      await storage.putSession(makeSession({ projectPath: "/project-a" }));
      await storage.putSession(makeSession({ projectPath: "/project-b" }));
      const results = await storage.getSessions({ projectPath: "/project-a" });
      expect(results).toHaveLength(1);
    });

    it("counts sessions", async () => {
      await storage.putSession(makeSession());
      await storage.putSession(makeSession());
      expect(await storage.sessions.count()).toBe(2);
    });

    it("counts sessions by provider", async () => {
      await storage.putSession(makeSession({ provider: "claude-code" }));
      await storage.putSession(makeSession({ provider: "codex" }));
      expect(await storage.sessions.count("claude-code")).toBe(1);
    });
  });

  // ── Events ────────────────────────────────────────────────────────────────

  describe("events", () => {
    it("puts and retrieves an event", async () => {
      const session = makeSession();
      const event = makeEvent(session.id);
      await storage.putSession(session);
      await storage.putEvent(event);
      const result = await storage.events.get(event.id);
      expect(result).toEqual(event);
    });

    it("putMany inserts all events in one transaction", async () => {
      const session = makeSession();
      await storage.putSession(session);
      const events = Array.from({ length: 10 }, () => makeEvent(session.id));
      await storage.putEvents(events);
      const count = await storage.events.count({ sessionId: session.id });
      expect(count).toBe(10);
    });

    it("queries events by sessionId", async () => {
      const s1 = makeSession();
      const s2 = makeSession();
      await storage.putSession(s1);
      await storage.putSession(s2);
      await storage.putEvents([makeEvent(s1.id), makeEvent(s1.id), makeEvent(s2.id)]);
      const results = await storage.getEvents({ sessionId: s1.id });
      expect(results).toHaveLength(2);
    });

    it("queries events by provider", async () => {
      const session = makeSession();
      await storage.putSession(session);
      await storage.putEvent(makeEvent(session.id, { provider: "claude-code" }));
      await storage.putEvent(makeEvent(session.id, { provider: "codex" }));
      const results = await storage.getEvents({ provider: "claude-code" });
      expect(results).toHaveLength(1);
    });

    it("queries events by type", async () => {
      const session = makeSession();
      await storage.putSession(session);
      await storage.putEvent(makeEvent(session.id, { type: "prompt" }));
      await storage.putEvent(makeEvent(session.id, { type: "accept" }));
      const results = await storage.getEvents({ type: "prompt" });
      expect(results).toHaveLength(1);
      expect(results[0]?.type).toBe("prompt");
    });

    it("queries events by timestamp range", async () => {
      const now = Date.now();
      const session = makeSession();
      await storage.putSession(session);
      await storage.putEvent(makeEvent(session.id, { timestamp: now - 100_000 }));
      await storage.putEvent(makeEvent(session.id, { timestamp: now - 10 }));
      const results = await storage.getEvents({ from: now - 50_000 });
      expect(results).toHaveLength(1);
    });

    it("deleteBySession removes all events for a session", async () => {
      const s1 = makeSession();
      const s2 = makeSession();
      await storage.putSession(s1);
      await storage.putSession(s2);
      await storage.putEvents([makeEvent(s1.id), makeEvent(s1.id)]);
      await storage.putEvent(makeEvent(s2.id));
      await storage.events.deleteBySession(s1.id);
      expect(await storage.events.count({ sessionId: s1.id })).toBe(0);
      expect(await storage.events.count({ sessionId: s2.id })).toBe(1);
    });
  });

  // ── Snapshots ─────────────────────────────────────────────────────────────

  describe("snapshots", () => {
    it("puts and retrieves a snapshot by natural key", async () => {
      const snap = makeSnapshot();
      await storage.putSnapshot(snap);
      const result = await storage.getSnapshot(
        snap.provider,
        snap.period,
        snap.periodStart,
      );
      expect(result).toEqual(snap);
    });

    it("returns undefined for a missing snapshot", async () => {
      const result = await storage.getSnapshot("codex", "day", 0);
      expect(result).toBeUndefined();
    });

    it("upserts a snapshot", async () => {
      const snap = makeSnapshot();
      await storage.putSnapshot(snap);
      const updated = {
        ...snap,
        metrics: { ...snap.metrics, totalSessions: 99 },
      };
      await storage.putSnapshot(updated);
      const result = await storage.getSnapshot(
        snap.provider,
        snap.period,
        snap.periodStart,
      );
      expect(result?.metrics.totalSessions).toBe(99);
    });

    it("queries snapshots by provider and period", async () => {
      const daySnap = makeSnapshot({ period: "day" });
      const weekSnap = makeSnapshot({ id: generateId(), period: "week", periodStart: 0 });
      await storage.putSnapshot(daySnap);
      await storage.putSnapshot(weekSnap);
      const results = await storage.snapshots.queryByProvider("claude-code", "day");
      expect(results).toHaveLength(1);
      expect(results[0]?.period).toBe("day");
    });

    it("clearByProvider removes only that provider's snapshots", async () => {
      const claudeSnap = makeSnapshot({ provider: "claude-code" });
      const codexSnap = makeSnapshot({ id: generateId(), provider: "codex" });
      await storage.putSnapshot(claudeSnap);
      await storage.putSnapshot(codexSnap);
      await storage.invalidateSnapshots("claude-code");
      const claudeResults = await storage.snapshots.queryByProvider("claude-code");
      const codexResults = await storage.snapshots.queryByProvider("codex");
      expect(claudeResults).toHaveLength(0);
      expect(codexResults).toHaveLength(1);
    });
  });

  // ── Cascading Delete ──────────────────────────────────────────────────────

  describe("deleteSession (cascade)", () => {
    it("deletes session and all its events", async () => {
      const session = makeSession();
      await storage.putSession(session);
      await storage.putEvents([makeEvent(session.id), makeEvent(session.id)]);
      await storage.deleteSession(session.id);
      expect(await storage.getSession(session.id)).toBeUndefined();
      expect(await storage.events.count({ sessionId: session.id })).toBe(0);
    });
  });

  // ── clearAll ──────────────────────────────────────────────────────────────

  describe("clearAll", () => {
    it("removes all data", async () => {
      const session = makeSession();
      await storage.putSession(session);
      await storage.putEvent(makeEvent(session.id));
      await storage.putSnapshot(makeSnapshot());
      await storage.clearAll();
      expect(await storage.sessions.count()).toBe(0);
      expect(await storage.events.count()).toBe(0);
    });
  });

  // ── Stats ─────────────────────────────────────────────────────────────────

  describe("getStats", () => {
    it("returns accurate counts", async () => {
      const session = makeSession();
      await storage.putSession(session);
      await storage.putEvents([makeEvent(session.id), makeEvent(session.id)]);
      const stats = await storage.getStats();
      expect(stats.totalSessions).toBe(1);
      expect(stats.totalEvents).toBe(2);
    });
  });
});
