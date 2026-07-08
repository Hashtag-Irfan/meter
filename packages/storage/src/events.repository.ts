import type { IDBPDatabase } from "idb";

import type { Event, EventFilter } from "@meter/shared";
import { STORE_NAMES } from "@meter/shared";

import type { MeterDBSchema } from "./db.js";

// ─── Events Repository ────────────────────────────────────────────────────────

/**
 * All database operations for the `events` object store.
 */
export class EventsRepository {
  constructor(private readonly db: IDBPDatabase<MeterDBSchema>) {}

  /**
   * Retrieve a single event by ID.
   */
  async get(id: string): Promise<Event | undefined> {
    return this.db.get(STORE_NAMES.EVENTS, id);
  }

  /**
   * Insert or replace a single event.
   */
  async put(event: Event): Promise<void> {
    await this.db.put(STORE_NAMES.EVENTS, event);
  }

  /**
   * Insert or replace multiple events in a single transaction.
   * This is the hot path — provider adapters will call this frequently.
   */
  async putMany(events: Event[]): Promise<void> {
    if (events.length === 0) return;
    const tx = this.db.transaction(STORE_NAMES.EVENTS, "readwrite");
    await Promise.all([
      ...events.map((e) => tx.store.put(e)),
      tx.done,
    ]);
  }

  /**
   * Delete an event by ID.
   */
  async delete(id: string): Promise<void> {
    await this.db.delete(STORE_NAMES.EVENTS, id);
  }

  /**
   * Query events with optional filters.
   * Chooses the most selective index automatically.
   */
  async query(filter: EventFilter = {}): Promise<Event[]> {
    const { sessionId, provider, type, from, to } = filter;

    let events: Event[];

    if (sessionId !== undefined && (from !== undefined || to !== undefined)) {
      // Compound index for session + time range
      const lower = [sessionId, from ?? 0] as [string, number];
      const upper = [sessionId, to ?? Date.now()] as [string, number];
      const range = IDBKeyRange.bound(lower, upper);
      events = await this.db.getAllFromIndex(
        STORE_NAMES.EVENTS,
        "by-session-timestamp",
        range,
      );
    } else if (sessionId !== undefined) {
      events = await this.db.getAllFromIndex(
        STORE_NAMES.EVENTS,
        "by-session",
        sessionId,
      );
    } else if (provider !== undefined && (from !== undefined || to !== undefined)) {
      // Compound index for provider + time range
      const lower = [provider, from ?? 0] as [string, number];
      const upper = [provider, to ?? Date.now()] as [string, number];
      const range = IDBKeyRange.bound(lower, upper);
      events = await this.db.getAllFromIndex(
        STORE_NAMES.EVENTS,
        "by-provider-timestamp",
        range,
      );
    } else if (provider !== undefined) {
      events = await this.db.getAllFromIndex(
        STORE_NAMES.EVENTS,
        "by-provider",
        provider,
      );
    } else if (from !== undefined || to !== undefined) {
      const range = IDBKeyRange.bound(from ?? 0, to ?? Date.now());
      events = await this.db.getAllFromIndex(
        STORE_NAMES.EVENTS,
        "by-timestamp",
        range,
      );
    } else {
      events = await this.db.getAll(STORE_NAMES.EVENTS);
    }

    // Apply remaining in-memory filters
    if (type !== undefined) {
      events = events.filter((e) => e.type === type);
    }

    return events;
  }

  /**
   * Count total events (optionally scoped to a session or provider).
   */
  async count(filter: Pick<EventFilter, "sessionId" | "provider"> = {}): Promise<number> {
    if (filter.sessionId !== undefined) {
      return this.db.countFromIndex(
        STORE_NAMES.EVENTS,
        "by-session",
        filter.sessionId,
      );
    }
    if (filter.provider !== undefined) {
      return this.db.countFromIndex(
        STORE_NAMES.EVENTS,
        "by-provider",
        filter.provider,
      );
    }
    return this.db.count(STORE_NAMES.EVENTS);
  }

  /**
   * Delete all events for a given session.
   * Used when a session is deleted.
   */
  async deleteBySession(sessionId: string): Promise<void> {
    const tx = this.db.transaction(STORE_NAMES.EVENTS, "readwrite");
    const index = tx.store.index("by-session");
    let cursor = await index.openCursor(sessionId);
    while (cursor) {
      await cursor.delete();
      cursor = await cursor.continue();
    }
    await tx.done;
  }

  /**
   * Delete all events. Used for data wipe.
   */
  async clear(): Promise<void> {
    await this.db.clear(STORE_NAMES.EVENTS);
  }
}
