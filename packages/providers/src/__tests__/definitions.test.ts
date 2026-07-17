import { PROVIDER_IDS } from "@meter/shared";
import { describe, expect, it } from "vitest";


import { PROVIDERS } from "../definitions.js";
import { ProviderRegistry } from "../registry.js";

describe("PROVIDERS configuration", () => {
  it("declares a definition for every known provider id", () => {
    for (const id of PROVIDER_IDS) {
      expect(PROVIDERS[id], `missing definition for ${id}`).toBeDefined();
      expect(PROVIDERS[id]!.id).toBe(id);
    }
  });

  it("every definition carries a parser and log dirs", () => {
    for (const def of Object.values(PROVIDERS)) {
      expect(def.parser).toBeDefined();
      expect(Array.isArray(def.logDirs)).toBe(true);
      expect(Array.isArray(def.fileExtensions)).toBe(true);
      expect(def.fileExtensions.length).toBeGreaterThan(0);
    }
  });

  it("the default registry is preloaded with all providers", () => {
    const registry = new ProviderRegistry();
    expect(registry.list().sort()).toEqual([...PROVIDER_IDS].sort());
  });

  it("claude-code parser actually parses a minimal entry", async () => {
    const events = await PROVIDERS["claude-code"].parser.parse(
      '{"type":"user","timestamp":"2025-06-15T09:00:00.000Z","cwd":"/p"}',
      "/logs/x.jsonl",
    );
    expect(events).toHaveLength(1);
    expect(events[0]!.type).toBe("prompt");
  });
});
