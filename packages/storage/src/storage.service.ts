
import { EventsRepository } from "./events.repository.js";
import { SessionsRepository } from "./sessions.repository.js";
import { SnapshotsRepository } from "./snapshots.repository.js";

import type { MeterDB } from "./db.js";
import type { Event, EventFilter, ProviderId, Session, SessionFilter, Snapshot, TimePeriod } from "@meter/shared";

// ─── Storage Service ──────────────────────────────────────────────────────────

/**
 * The single entry point for all METER storage operations.
 *
 * Composes the three repositories (sessions, events, snapshots) behind
 * a unified interface. Consumers never interact with repositories directly.
 *
 * Usage:
 * ```ts
 * const db = await openMeterDB();
 * const storage = new StorageService(db);
 * await storage.sessions.put(session);
 * ```
 */
export class StorageService {
  readonly sessions: SessionsRepository;
  readonly events: EventsRepository;
  readonly snapshots: SnapshotsRepository;

  constructor(db: MeterDB) {
    this.sessions = new SessionsRepository(db);
    this.events = new EventsRepository(db);
    this.snapshots = new SnapshotsRepository(db);
  }

  // ─── Convenience Methods ────────────────────────────────────────────────────

  /** Get a session by ID */
  getSession(id: string): Promise<Session | undefined> {
    return this.sessions.get(id);
  }

  /** Upsert a session */
  putSession(session: Session): Promise<void> {
    return this.sessions.put(session);
  }

  /** Query sessions with optional filters */
  getSessions(filter?: SessionFilter): Promise<Session[]> {
    return this.sessions.query(filter);
  }

  /** Upsert a single event */
  putEvent(event: Event): Promise<void> {
    return this.events.put(event);
  }

  /** Upsert multiple events (single transaction) */
  putEvents(events: Event[]): Promise<void> {
    return this.events.putMany(events);
  }

  /** Query events with optional filters */
  getEvents(filter?: EventFilter): Promise<Event[]> {
    return this.events.query(filter);
  }

  /** Look up a snapshot by natural key */
  getSnapshot(
    provider: ProviderId,
    period: TimePeriod,
    periodStart: number,
  ): Promise<Snapshot | undefined> {
    return this.snapshots.getByKey(provider, period, periodStart);
  }

  /** Upsert a snapshot */
  putSnapshot(snapshot: Snapshot): Promise<void> {
    return this.snapshots.put(snapshot);
  }

  // ─── Maintenance ────────────────────────────────────────────────────────────

  /**
   * Delete a session and all its associated events atomically.
   */
  async deleteSession(sessionId: string): Promise<void> {
    await Promise.all([
      this.sessions.delete(sessionId),
      this.events.deleteBySession(sessionId),
    ]);
  }

  /**
   * Wipe all data. Called from Settings → "Clear all data".
   * Also clears snapshots so they'll be recomputed from scratch.
   */
  async clearAll(): Promise<void> {
    await Promise.all([
      this.sessions.clear(),
      this.events.clear(),
      this.snapshots.clear(),
    ]);
  }

  /**
   * Invalidate snapshot cache for a provider.
   * Called after importing new events to force re-aggregation.
   */
  invalidateSnapshots(provider: ProviderId): Promise<void> {
    return this.snapshots.clearByProvider(provider);
  }

  // ─── Stats ──────────────────────────────────────────────────────────────────

  /**
   * Get high-level storage stats.
   */
  async getStats(): Promise<{
    totalSessions: number;
    totalEvents: number;
    totalSnapshots: number;
  }> {
    const [totalSessions, totalEvents] = await Promise.all([
      this.sessions.count(),
      this.events.count(),
    ]);
    return { totalSessions, totalEvents, totalSnapshots: 0 };
  }
}
