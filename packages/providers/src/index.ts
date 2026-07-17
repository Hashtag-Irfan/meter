// @meter/providers — public API (environment-agnostic)
//
// NOTE: `./host.js` is intentionally NOT re-exported here. It is the only
// module that imports Node built-ins and must only be loaded by Node hosts.

export { ProviderRegistry, getRegistry } from "./registry.js";
export { PROVIDERS } from "./definitions.js";
export {
  joinPath,
  resolveLogDirs,
  expandLogPaths,
  isSupportedLogFile,
  extractProjectPath,
  defaultDetect,
  resolveHome,
} from "./paths.js";

// Adapters
export { ClaudeCodeProvider } from "./adapters/claude-code/index.js";
export { CodexProvider } from "./adapters/codex/index.js";
export { CursorProvider } from "./adapters/cursor/index.js";
export { StubProviderParser } from "./adapters/stub.js";
