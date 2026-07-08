import { describe, expect, it } from "vitest";

import { ClaudeCodeProvider } from "../adapters/claude-code/index.js";
import { CodexProvider } from "../adapters/codex/index.js";
import { ProviderRegistry } from "../registry.js";

describe("ProviderRegistry", () => {
  it("registers and retrieves a provider", () => {
    const registry = new ProviderRegistry();
    const plugin = new ClaudeCodeProvider();
    registry.register(plugin);
    expect(registry.get("claude-code")).toBe(plugin);
  });

  it("returns undefined for an unregistered provider", () => {
    const registry = new ProviderRegistry();
    expect(registry.get("codex")).toBeUndefined();
  });

  it("throws when registering the same ID twice", () => {
    const registry = new ProviderRegistry();
    registry.register(new ClaudeCodeProvider());
    expect(() => registry.register(new ClaudeCodeProvider())).toThrow(
      /already registered/,
    );
  });

  it("lists all registered provider IDs", () => {
    const registry = new ProviderRegistry();
    registry.register(new ClaudeCodeProvider());
    registry.register(new CodexProvider());
    expect(registry.list()).toContain("claude-code");
    expect(registry.list()).toContain("codex");
    expect(registry.list()).toHaveLength(2);
  });

  it("detectAll returns a map with all registered providers", async () => {
    const registry = new ProviderRegistry();
    registry.register(new ClaudeCodeProvider());
    registry.register(new CodexProvider());
    const results = await registry.detectAll();
    expect(results.has("claude-code")).toBe(true);
    expect(results.has("codex")).toBe(true);
    // Codex stub always returns false
    expect(results.get("codex")).toBe(false);
  });

  it("parse returns empty array for unregistered provider", async () => {
    const registry = new ProviderRegistry();
    const result = await registry.parse("cursor", "raw data", "/log.jsonl");
    expect(result).toEqual([]);
  });

  it("supports method chaining on register()", () => {
    const registry = new ProviderRegistry();
    expect(() =>
      registry.register(new ClaudeCodeProvider()).register(new CodexProvider()),
    ).not.toThrow();
  });
});
