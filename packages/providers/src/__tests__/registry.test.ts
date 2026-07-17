import { describe, expect, it } from "vitest";

import { ClaudeCodeProvider } from "../adapters/claude-code/index.js";
import { CodexProvider } from "../adapters/codex/index.js";
import { PROVIDERS } from "../definitions.js";
import { ProviderRegistry, getRegistry } from "../registry.js";

import type { HostEnv, ProviderDefinition } from "@meter/shared";

function fakeEnv(existing: string[] = []): HostEnv {
  return {
    platform: "linux",
    homedir: () => "/home/user",
    appData: () => "/home/user/AppData",
    existsSync: (p) => existing.includes(p),
    readdirSync: () => [],
    statSync: () => ({ size: 0 }),
    readFileSync: () => "",
  };
}

function claudeDef(overrides: Partial<ProviderDefinition> = {}): ProviderDefinition {
  return {
    id: "claude-code",
    name: "Claude Code",
    icon: "",
    parser: new ClaudeCodeProvider(),
    logDirs: [{ os: "all", base: "home", segments: [".claude", "projects"] }],
    fileExtensions: [".jsonl"],
    ...overrides,
  };
}

describe("ProviderRegistry", () => {
  it("registers and retrieves a provider definition", () => {
    const registry = new ProviderRegistry([]);
    const def = claudeDef();
    registry.register(def);
    expect(registry.get("claude-code")).toBe(def);
  });

  it("returns undefined for an unregistered provider", () => {
    const registry = new ProviderRegistry([
      {
        id: "codex",
        name: "Codex",
        icon: "",
        parser: new CodexProvider(),
        logDirs: [],
        fileExtensions: [".jsonl"],
      },
    ]);
    expect(registry.get("claude-code")).toBeUndefined();
  });

  it("throws when registering the same ID twice", () => {
    const registry = new ProviderRegistry([]);
    registry.register(claudeDef());
    expect(() => registry.register(claudeDef())).toThrow(/already registered/);
  });

  it("lists all registered provider IDs", () => {
    const registry = new ProviderRegistry([
      claudeDef(),
      {
        id: "codex",
        name: "Codex",
        icon: "",
        parser: new CodexProvider(),
        logDirs: [],
        fileExtensions: [".jsonl"],
      },
    ]);
    expect(registry.list()).toContain("claude-code");
    expect(registry.list()).toContain("codex");
    expect(registry.list()).toHaveLength(2);
  });

  it("detectAll returns a map with all registered providers", async () => {
    const registry = new ProviderRegistry([claudeDef()]);
    const results = await registry.detectAll(fakeEnv());
    expect(results.has("claude-code")).toBe(true);
    // No directories exist in the fake env → not detected
    expect(results.get("claude-code")).toBe(false);
  });

  it("detectAll detects providers whose log dirs exist", async () => {
    const registry = new ProviderRegistry([claudeDef()]);
    const results = await registry.detectAll(
      fakeEnv(["/home/user/.claude/projects"]),
    );
    expect(results.get("claude-code")).toBe(true);
  });

  it("parse returns empty array for unregistered provider", async () => {
    const registry = new ProviderRegistry();
    const result = await registry.parse("cursor", "raw data", "/log.jsonl");
    expect(result).toEqual([]);
  });

  it("parse delegates to the registered parser", async () => {
    const registry = new ProviderRegistry([claudeDef()]);
    const events = await registry.parse(
      "claude-code",
      '{"type":"user","timestamp":"2025-06-15T09:00:00.000Z","cwd":"/p"}',
      "/logs/x.jsonl",
    );
    expect(events).toHaveLength(1);
    expect(events[0]!.type).toBe("prompt");
  });

  it("getLogPaths expands existing directories and filters by extension", async () => {
    const registry = new ProviderRegistry([claudeDef()]);
    const env: HostEnv = {
      ...fakeEnv(["/home/user/.claude/projects"]),
      readdirSync: () => ["a.jsonl", "b.log"],
    };
    const paths = await registry.getLogPaths("claude-code", env);
    expect(paths).toContain("/home/user/.claude/projects/a.jsonl");
    expect(paths).not.toContain("/home/user/.claude/projects/b.log");
  });

  it("supports method chaining on register()", () => {
    const registry = new ProviderRegistry([]);
    expect(() =>
      registry
        .register(claudeDef())
        .register({
          id: "codex",
          name: "Codex",
          icon: "",
          parser: new CodexProvider(),
          logDirs: [],
          fileExtensions: [".jsonl"],
        }),
    ).not.toThrow();
  });

  it("getRegistry returns a registry preloaded with all providers", () => {
    const registry = getRegistry();
    expect(registry.list().sort()).toEqual(Object.keys(PROVIDERS).sort());
  });
});
