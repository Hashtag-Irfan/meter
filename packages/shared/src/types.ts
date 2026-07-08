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
 * Normalized event output from a provider parser.
 * This is what every ProviderPlugin.parse() must return.
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
 * The contract every provider plugin must implement.
 * Add a new provider by creating a class that satisfies this interface.
 */
export interface ProviderPlugin {
  /** Stable machine-readable identifier */
  readonly id: ProviderId;
  /** Human-readable display name */
  readonly name: string;
  /** Plugin version, semver */
  readonly version: string;
  /** URL or data-URI for the provider icon */
  readonly icon: string;

  /**
   * Detect whether this provider is installed on the current machine.
   * Should be fast and non-destructive.
   */
  detect(): Promise<boolean>;

  /**
   * Return the absolute paths to log files / directories for this provider.
   */
  getLogPaths(): Promise<string[]>;

  /**
   * Parse raw log content into normalized ParsedEvents.
   * @param raw   - Raw file content
   * @param filePath - Source file path (for error context)
   */
  parse(raw: string, filePath: string): Promise<ParsedEvent[]>;

  /**
   * Watch log paths for new entries.
   * @returns Cleanup function — call to stop watching.
   */
  watch(paths: string[], onChange: (events: ParsedEvent[]) => void): () => void;
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
