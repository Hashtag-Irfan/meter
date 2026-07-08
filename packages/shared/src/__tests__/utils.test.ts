import { describe, expect, it } from "vitest";

import {
  PROVIDER_IDS,
  clamp,
  err,
  formatCompact,
  formatCost,
  formatDuration,
  generateId,
  groupBy,
  ok,
  truncateToPeriod,
} from "../src/index.js";

describe("constants", () => {
  it("should include the three initial providers", () => {
    expect(PROVIDER_IDS).toContain("claude-code");
    expect(PROVIDER_IDS).toContain("codex");
    expect(PROVIDER_IDS).toContain("cursor");
  });
});

describe("generateId", () => {
  it("should return a non-empty string", () => {
    const id = generateId();
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });

  it("should return unique values", () => {
    const ids = new Set(Array.from({ length: 1000 }, generateId));
    expect(ids.size).toBe(1000);
  });

  it("should be lexicographically sortable (monotonic)", () => {
    const ids = Array.from({ length: 10 }, generateId);
    const sorted = [...ids].sort();
    expect(ids).toEqual(sorted);
  });
});

describe("clamp", () => {
  it("clamps to min", () => expect(clamp(-5, 0, 10)).toBe(0));
  it("clamps to max", () => expect(clamp(15, 0, 10)).toBe(10));
  it("returns value when within range", () => expect(clamp(5, 0, 10)).toBe(5));
});

describe("truncateToPeriod", () => {
  const ts = new Date("2025-06-15T14:37:22.500Z").getTime();

  it("truncates to hour", () => {
    const result = new Date(truncateToPeriod(ts, "hour"));
    expect(result.getUTCMinutes()).toBe(0);
    expect(result.getUTCSeconds()).toBe(0);
  });

  it("truncates to day", () => {
    const result = new Date(truncateToPeriod(ts, "day"));
    expect(result.getUTCHours()).toBe(0);
    expect(result.getUTCMinutes()).toBe(0);
  });
});

describe("formatDuration", () => {
  it("formats ms under 1 second", () => expect(formatDuration(500)).toBe("500ms"));
  it("formats seconds", () => expect(formatDuration(3500)).toBe("3.5s"));
  it("formats minutes", () => expect(formatDuration(90_000)).toBe("1m 30s"));
});

describe("formatCost", () => {
  it("shows < $0.01 for tiny costs", () => expect(formatCost(0.001)).toBe("<$0.01"));
  it("formats normal cost", () => expect(formatCost(1.234)).toBe("$1.23"));
});

describe("formatCompact", () => {
  it("formats thousands", () => expect(formatCompact(1500)).toBe("1.5K"));
  it("formats millions", () => expect(formatCompact(2_000_000)).toBe("2.0M"));
  it("leaves small numbers alone", () => expect(formatCompact(42)).toBe("42"));
});

describe("groupBy", () => {
  it("groups items by key", () => {
    const items = [
      { type: "a", val: 1 },
      { type: "b", val: 2 },
      { type: "a", val: 3 },
    ];
    const result = groupBy(items, (i) => i.type);
    expect(result["a"]).toHaveLength(2);
    expect(result["b"]).toHaveLength(1);
  });
});

describe("Result type helpers", () => {
  it("ok creates a success result", () => {
    const r = ok(42);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBe(42);
  });

  it("err creates a failure result", () => {
    const r = err(new Error("oops"));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toBe("oops");
  });
});
