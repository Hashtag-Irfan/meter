import type { EventType, ProviderId, TimePeriod } from "./constants.js";

// ─── Core Domain Types ────────────────────────────────────────────────────────

/**
 * A single session with an AI coding assistant.
 * One session = one continuous working period (e.g., one terminal session).
 */
export interface Session {
  /** ULID — sortable, unique */
  id: string;
  provider: ProviderId;
  startedAt: number; // unix ms
  endedAt: number | null;
  /** Absolute path to the project being worked on */
  projectPath: string;
  /** Raw metadata from the provider log (provider-specific) */
  metadata: Record<string, unknown>;
}

/**
 * A granular event captured within a session.
 */
export interface Event {
  id: string;
  sessionId: string;
  provider: ProviderId;
  type: EventType;
  timestamp: number; // unix ms
  /** Tokens sent in the prompt */
  tokensIn: number | null;
  /** Tokens in the completion */
  tokensOut: number | null;
  /** Time from prompt submission to first token (ms) */
  latencyMs: number | null;
  /** Provider-specific payload — stored for extensibility */
  payload: Record<string, unknown>;
}

/**
 * A pre-aggregated rollup stored to avoid expensive re-computation.
 */
export interface Snapshot {
  id: string;
  provider: ProviderId;
  period: TimePeriod;
  /** Start of the period (unix ms, truncated to period boundary) */
  periodStart: number;
  metrics: AggregatedMetrics;
}

/**
 * The canonical set of metrics METER tracks.
 */
export interface AggregatedMetrics {
  totalSessions: number;
  totalEvents: number;
  totalTokensIn: number;
  totalTokensOut: number;
  totalTokens: number;
  /** USD, estimated from provider pricing table */
  estimatedCostUsd: number | null;
  /** 0–1 */
  acceptRate: number | null;
  avgLatencyMs: number | null;
  activeHours: number;
}

// ─── Plugin System Types ──────────────────────────────────────────────────────

/**
 * The operating system the host is running on.
 * Used to resolve platform-specific log directories without touching Node APIs.
 */
export type Platform = "macos" | "linux" | "windows";

/**
 * A minimal, environment-agnostic filesystem/OS surface.
 *
 * Provider packages must NEVER import `node:fs`, `node:os`, or `node:path`
 * directly (see ADR #2). Instead, the active host (CLI, Extension, Desktop
 * app) injects a `HostEnv` so the same provider code runs in browsers,
 * extensions, and Node. Every host-bound capability is expressed as a
 * function on this interface.
 */
export interface HostEnv {
  /** Current platform. */
  readonly platform: Platform;
  /** Returns the user's home directory. */
  homedir(): string;
  /** Returns the platform application-data directory (e.g. %APPDATA%). */
  appData(): string;
  /** Synchronous existence check for a path. */
  existsSync(path: string): boolean;
  /** List file names inside a directory. */
  readdirSync(dir: string): string[];
  /** Stat a file, returning at least its byte size. */
  statSync(path: string): { size: number };
  /** Read a file's full contents as a UTF-8 string. */
  readFileSync(path: string): string;
  /**
   * Subscribe to updates on a single file. Returns a cleanup function.
   * Optional — hosts that do not support file watching may omit it, in
   * which case `watch` degrades to a no-op.
   */
  watchFile?(path: string, onUpdate: () => void): () => void;
}

/**
 * A single log directory pattern expressed relative to a resolution root.
 * Pure data — no path joining happens at module load time.
 */
export interface LogDirPattern {
  /** Which platform this pattern applies to. `"all"` matches everywhere. */
  os: Platform | "all";
  /** Resolution root for the segments. */
  base: "home" | "appdata";
  /** Path segments appended to the base (order matters). */
  segments: string[];
}

/**
 * A PURE provider parser. No filesystem, no OS, no network.
 * The host reads raw files and passes the text here.
 */
export interface ProviderParser {
  /** Stable machine-readable identifier. */
  readonly id: ProviderId;
  /** Human-readable display name. */
  readonly name: string;
  /** Parser version, semver. */
  readonly version: string;
  /** URL or data-URI for the provider icon. */
  readonly icon: string;
  /**
   * Parse raw log content into normalized ParsedEvents.
   * @param raw      Raw file content as a string.
   * @param filePath Source file path (used only for project-path heuristics).
   */
  parse(raw: string, filePath: string): Promise<ParsedEvent[]>;
}

/**
 * A pure, declarative description of a provider. This is the "type
 * configuration" the registry is built from — no behavior beyond the
 * contained `parser` and optional `detect` closure. Adding a provider is
 * purely a data change here.
 */
export interface ProviderDefinition {
  id: ProviderId;
  name: string;
  icon: string;
  /** The pure parsing adapter. */
  parser: ProviderParser;
  /** Where this provider stores logs, per platform. */
  logDirs: LogDirPattern[];
  /** File extensions METER should ingest for this provider. */
  fileExtensions: string[];
  /** Optional environment-aware detection. Defaults to directory existence. */
  detect?(env: HostEnv): Promise<boolean>;
}

/**
 * Normalized event output from a provider parser.
 * This is what every ProviderParser.parse() must return.
 */
export interface ParsedEvent {
  /** Provider-native ID (used for deduplication) */
  nativeId: string;
  type: EventType;
  timestamp: number;
  tokensIn: number | null;
  tokensOut: number | null;
  latencyMs: number | null;
  projectPath: string;
  payload: Record<string, unknown>;
}

/**
 * The full, host-facing provider contract. It extends the pure
 * `ProviderParser` with environment-bound capabilities that require a
 * `HostEnv` (filesystem access, OS info). Because every host-bound method
 * receives its `HostEnv` as an argument, implementations stay free of
 * `node:*` imports and remain web-safe.
 *
 * Prefer `ProviderDefinition` + the registry for configuration; this
 * interface is the runtime shape a Node/CLI host wraps around a definition
 * via `createHostProvider`.
 */
export interface ProviderPlugin extends ProviderParser {
  /**
   * Detect whether this provider is installed on the current machine.
   * Should be fast and non-destructive.
   */
  detect(env: HostEnv): Promise<boolean>;

  /**
   * Return the absolute paths to log files for this provider.
   */
  getLogPaths(env: HostEnv): Promise<string[]>;

  /**
   * Watch log paths for new entries and emit parsed events.
   * @returns Cleanup function — call to stop watching.
   */
  watch(
    paths: string[],
    onChange: (events: ParsedEvent[]) => void,
    env: HostEnv,
  ): () => void;
}

// ─── Storage Types ────────────────────────────────────────────────────────────

export interface StorageAdapter {
  getSessions(filter?: SessionFilter): Promise<Session[]>;
  getSession(id: string): Promise<Session | undefined>;
  putSession(session: Session): Promise<void>;

  getEvents(filter?: EventFilter): Promise<Event[]>;
  putEvent(event: Event): Promise<void>;
  putEvents(events: Event[]): Promise<void>;

  getSnapshot(
    provider: ProviderId,
    period: TimePeriod,
    periodStart: number,
  ): Promise<Snapshot | undefined>;
  putSnapshot(snapshot: Snapshot): Promise<void>;

  clear(): Promise<void>;
}

export interface SessionFilter {
  provider?: ProviderId;
  from?: number;
  to?: number;
  projectPath?: string;
}

export interface EventFilter {
  sessionId?: string;
  provider?: ProviderId;
  type?: EventType;
  from?: number;
  to?: number;
}

// ─── UI Types ─────────────────────────────────────────────────────────────────

export interface TimeSeriesPoint {
  timestamp: number;
  value: number;
}

export interface ChartDataSeries {
  id: string;
  label: string;
  color: string;
  data: TimeSeriesPoint[];
}

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: string;
  badge?: string | number;
}

// ─── Result Type ──────────────────────────────────────────────────────────────

export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}
