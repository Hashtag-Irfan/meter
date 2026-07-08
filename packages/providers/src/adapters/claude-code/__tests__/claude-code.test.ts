import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, it } from "vitest";

import { ClaudeCodeProvider } from "../index.js";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.join(__dirname, "../__fixtures__");

function readFixture(name: string): string {
  return fs.readFileSync(path.join(FIXTURES_DIR, name), "utf-8");
}

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe("ClaudeCodeProvider", () => {
  const provider = new ClaudeCodeProvider();

  describe("metadata", () => {
    it("has the correct id", () => {
      expect(provider.id).toBe("claude-code");
    });

    it("has a display name", () => {
      expect(provider.name).toBe("Claude Code");
    });

    it("has a version", () => {
      expect(provider.version).toMatch(/^\d+\.\d+\.\d+/);
    });
  });

  describe("parse — basic session fixture", () => {
    const raw = readFixture("session-basic.jsonl");
    let events: Awaited<ReturnType<typeof provider.parse>>;

    beforeEach(async () => {
      events = await provider.parse(raw, "/logs/session-basic.jsonl");
    });

    it("parses the expected number of events (skips unknowns)", () => {
      // session_start + user + assistant + tool_use + user + assistant + error + session_end = 8
      expect(events).toHaveLength(8);
    });

    it("parses a prompt event correctly", () => {
      const prompt = events.find((e) => e.type === "prompt");
      expect(prompt).toBeDefined();
      expect(prompt?.timestamp).toBe(new Date("2025-06-15T09:00:05.000Z").getTime());
      expect(prompt?.tokensIn).toBeNull(); // user messages have no usage
    });

    it("parses a completion event with token counts", () => {
      const completions = events.filter((e) => e.type === "completion");
      expect(completions).toHaveLength(2);

      const first = completions[0]!;
      expect(first.tokensIn).toBe(150); // input_tokens: 150
      expect(first.tokensOut).toBe(820); // output_tokens: 820
      expect(first.latencyMs).toBe(3500);
    });

    it("sums cache tokens into tokensIn", () => {
      const completions = events.filter((e) => e.type === "completion");
      const second = completions[1]!;
      // input_tokens(320) + cache_read(150) = 470
      expect(second.tokensIn).toBe(470);
    });

    it("parses a session_start event", () => {
      const start = events.find((e) => e.type === "session_start");
      expect(start).toBeDefined();
      expect(start?.timestamp).toBe(new Date("2025-06-15T09:00:00.000Z").getTime());
    });

    it("parses a session_end event", () => {
      const end = events.find((e) => e.type === "session_end");
      expect(end).toBeDefined();
    });

    it("parses a tool_use as accept", () => {
      const accepts = events.filter((e) => e.type === "accept");
      expect(accepts.length).toBeGreaterThanOrEqual(1);
    });

    it("parses an error event", () => {
      const error = events.find((e) => e.type === "error");
      expect(error).toBeDefined();
    });

    it("populates nativeId consistently (no undefined)", () => {
      events.forEach((e) => {
        expect(e.nativeId).toBeTruthy();
        expect(e.nativeId).toContain("claude-code:");
      });
    });

    it("does NOT include raw message content in payload (privacy)", () => {
      events.forEach((e) => {
        expect(e.payload).not.toHaveProperty("message");
        // Ensure content strings are not stored
        const payloadStr = JSON.stringify(e.payload);
        expect(payloadStr).not.toContain("Can you help me refactor");
      });
    });

    it("sets projectPath from cwd field", () => {
      const prompt = events.find((e) => e.type === "prompt");
      expect(prompt?.projectPath).toBe("/home/user/my-project");
    });
  });

  describe("parse — session with cache fixture", () => {
    const raw = readFixture("session-with-cache.jsonl");
    let events: Awaited<ReturnType<typeof provider.parse>>;

    beforeEach(async () => {
      events = await provider.parse(raw, "/logs/session-with-cache.jsonl");
    });

    it("handles large token counts correctly", () => {
      const completions = events.filter((e) => e.type === "completion");
      expect(completions.length).toBeGreaterThanOrEqual(1);

      const first = completions[0]!;
      // input_tokens(200) + cache_read(500) + cache_creation(200) = 900
      expect(first.tokensIn).toBe(900);
      expect(first.tokensOut).toBe(3500);
    });

    it("parses multiple tool_result events as accept", () => {
      const accepts = events.filter((e) => e.type === "accept");
      expect(accepts).toHaveLength(2);
    });

    it("stores model in payload", () => {
      const completion = events.find((e) => e.type === "completion");
      expect(completion?.payload["model"]).toBe("claude-opus-4-5");
    });
  });

  describe("parse — edge cases fixture", () => {
    const raw = readFixture("session-edge-cases.jsonl");
    let events: Awaited<ReturnType<typeof provider.parse>>;

    beforeEach(async () => {
      events = await provider.parse(raw, "/logs/edge-cases.jsonl");
    });

    it("does not throw on malformed JSON lines", () => {
      // If we get here, no exception was thrown
      expect(events).toBeDefined();
    });

    it("skips lines with no mappable type", () => {
      // "completely unexpected fields only" has no type → skipped
      // "assistant with no timestamp" → skipped (null timestamp)
      expect(events.length).toBeLessThan(5);
    });

    it("parses numeric timestamps correctly", () => {
      const withNumericTs = events.find(
        (e) => e.type === "completion" && e.tokensIn !== null,
      );
      expect(withNumericTs).toBeDefined();
      expect(withNumericTs?.timestamp).toBe(1750150800000);
    });

    it("handles missing usage gracefully (null tokens)", () => {
      const promptEvents = events.filter((e) => e.type === "prompt");
      promptEvents.forEach((e) => {
        // Prompts never have usage in this fixture
        expect(e.tokensOut).toBeNull();
      });
    });
  });

  describe("parse — empty input", () => {
    it("returns empty array for empty string", async () => {
      const result = await provider.parse("", "/logs/empty.jsonl");
      expect(result).toEqual([]);
    });

    it("returns empty array for whitespace-only input", async () => {
      const result = await provider.parse("   \n  \n  ", "/logs/empty.jsonl");
      expect(result).toEqual([]);
    });
  });

  describe("watch — cleanup", () => {
    it("returns a cleanup function that can be called without error", () => {
      const cleanup = provider.watch([], () => {});
      expect(() => cleanup()).not.toThrow();
    });
  });
});
