import { describe, expect, it } from "vitest";

import {
  defaultDetect,
  expandLogPaths,
  extractProjectPath,
  isSupportedLogFile,
  joinPath,
  resolveLogDirs,
} from "../paths.js";

import type { HostEnv, ProviderDefinition } from "@meter/shared";

describe("joinPath", () => {
  it("joins non-empty segments with slashes", () => {
    expect(joinPath("/home/user", ".claude", "projects")).toBe(
      "/home/user/.claude/projects",
    );
  });

  it("drops empty segments", () => {
    expect(joinPath("/home", "", "user")).toBe("/home/user");
  });
});

describe("resolveLogDirs", () => {
  const def: Pick<ProviderDefinition, "logDirs"> = {
    logDirs: [
      { os: "all", base: "home", segments: [".claude", "projects"] },
      { os: "linux", base: "home", segments: [".config", "claude"] },
      { os: "windows", base: "appdata", segments: ["Claude", "logs"] },
    ],
  };

  it("resolves all + matching-platform patterns", () => {
    const dirs = resolveLogDirs(def, {
      platform: "linux",
      homedir: () => "/home/u",
      appData: () => "/home/u/AppData",
    });
    expect(dirs).toContain("/home/u/.claude/projects");
    expect(dirs).toContain("/home/u/.config/claude");
    expect(dirs).not.toContain("/home/u/AppData/Claude/logs");
  });

  it("resolves windows appdata pattern on windows", () => {
    const dirs = resolveLogDirs(def, {
      platform: "windows",
      homedir: () => "C:/Users/u",
      appData: () => "C:/Users/u/AppData/Roaming",
    });
    expect(dirs).toContain("C:/Users/u/.claude/projects");
    expect(dirs).toContain("C:/Users/u/AppData/Roaming/Claude/logs");
  });
});

describe("isSupportedLogFile", () => {
  it("matches declared extensions case-insensitively", () => {
    expect(isSupportedLogFile("a.jsonl", [".jsonl"])).toBe(true);
    expect(isSupportedLogFile("a.JSONL", [".jsonl"])).toBe(true);
    expect(isSupportedLogFile("a.log", [".jsonl"])).toBe(false);
  });

  it("returns false for files without an extension", () => {
    expect(isSupportedLogFile("README", [".jsonl"])).toBe(false);
  });
});

describe("extractProjectPath", () => {
  it("decodes a url-encoded project path embedded in the filename", () => {
    const fp =
      "/home/u/.claude/projects/abc123_%2Fhome%2Fuser%2Fmy-project.jsonl";
    expect(extractProjectPath(fp)).toBe("/home/user/my-project");
  });

  it("falls back when no encoded path is present", () => {
    expect(extractProjectPath("/logs/session-basic.jsonl")).toBe("unknown");
    expect(extractProjectPath("/logs/x.jsonl", "fallback")).toBe("fallback");
  });
});

describe("defaultDetect", () => {
  const def: ProviderDefinition = {
    id: "claude-code",
    name: "Claude Code",
    icon: "",
    parser: { id: "claude-code", name: "x", version: "0.0.0", icon: "", parse: async () => [] },
    logDirs: [{ os: "all", base: "home", segments: [".claude", "projects"] }],
    fileExtensions: [".jsonl"],
  };

  it("is true when a resolved dir exists", async () => {
    const env = fakeEnv(["/home/u/.claude/projects"]);
    expect(await defaultDetect(def, env)).toBe(true);
  });

  it("is false when no resolved dir exists", async () => {
    const env = fakeEnv([]);
    expect(await defaultDetect(def, env)).toBe(false);
  });
});

describe("expandLogPaths", () => {
  const def: ProviderDefinition = {
    id: "claude-code",
    name: "Claude Code",
    icon: "",
    parser: { id: "claude-code", name: "x", version: "0.0.0", icon: "", parse: async () => [] },
    logDirs: [{ os: "all", base: "home", segments: [".claude", "projects"] }],
    fileExtensions: [".jsonl"],
  };

  it("lists only files matching the configured extensions", async () => {
    const env = fakeEnv(["/home/u/.claude/projects"], ["a.jsonl", "b.log"]);
    const paths = await expandLogPaths(def, env);
    expect(paths).toEqual(["/home/u/.claude/projects/a.jsonl"]);
  });

  it("returns empty when the directory is absent", async () => {
    const env = fakeEnv([]);
    expect(await expandLogPaths(def, env)).toEqual([]);
  });
});

function fakeEnv(existing: string[] = [], files: string[] = []): HostEnv {
  return {
    platform: "linux",
    homedir: () => "/home/u",
    appData: () => "/home/u/AppData",
    existsSync: (p) => existing.includes(p),
    readdirSync: () => files,
    statSync: () => ({ size: 0 }),
    readFileSync: () => "",
  };
}
