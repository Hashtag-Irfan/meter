
import { STORE_NAMES } from "@meter/shared";

import type { MeterDBSchema } from "./db.js";
import type { Session, SessionFilter } from "@meter/shared";
import type { IDBPDatabase } from "idb";

// ─── Sessions Repository ──────────────────────────────────────────────────────

/**
 * All database operations for the `sessions` object store.
 * Pure data-access — no business logic, no side effects beyond IndexedDB.
 */
export class SessionsRepository {
  constructor(private readonly db: IDBPDatabase<MeterDBSchema>) {}

  /**
   * Retrieve a single session by its ID.
   */
  async get(id: string): Promise<Session | undefined> {
    return this.db.get(STORE_NAMES.SESSIONS, id);
  }

  /**
   * Insert or replace a session.
   */
  async put(session: Session): Promise<void> {
    await this.db.put(STORE_NAMES.SESSIONS, session);
  }

  /**
   * Insert or replace multiple sessions in a single transaction.
   */
  async putMany(sessions: Session[]): Promise<void> {
    const tx = this.db.transaction(STORE_NAMES.SESSIONS, "readwrite");
    await Promise.all([
      ...sessions.map((s) => tx.store.put(s)),
      tx.done,
    ]);
  }

  /**
   * Delete a session by ID.
   */
  async delete(id: string): Promise<void> {
    await this.db.delete(STORE_NAMES.SESSIONS, id);
  }

  /**
   * Query sessions with optional filters.
   * All filtering is applied in-memory after the index range scan.
   */
  async query(filter: SessionFilter = {}): Promise<Session[]> {
    const { provider, from, to, projectPath } = filter;

    let sessions: Session[];

    if (provider !== undefined && (from !== undefined || to !== undefined)) {
      // Use compound index for provider + time range
      const lower = [provider, from ?? 0] as [string, number];
      const upper = [provider, to ?? Date.now()] as [string, number];
      const range = IDBKeyRange.bound(lower, upper);
      sessions = await this.db.getAllFromIndex(
        STORE_NAMES.SESSIONS,
        "by-provider-started",
        range,
      );
    } else if (provider !== undefined) {
      sessions = await this.db.getAllFromIndex(
        STORE_NAMES.SESSIONS,
        "by-provider",
        provider,
      );
    } else if (from !== undefined || to !== undefined) {
      const range = IDBKeyRange.bound(from ?? 0, to ?? Date.now());
      sessions = await this.db.getAllFromIndex(
        STORE_NAMES.SESSIONS,
        "by-started-at",
        range,
      );
    } else {
      sessions = await this.db.getAll(STORE_NAMES.SESSIONS);
    }

    // Apply remaining in-memory filters
    if (projectPath !== undefined) {
      sessions = sessions.filter((s) => s.projectPath === projectPath);
    }

    return sessions;
  }

  /**
   * Count total sessions (optionally scoped to a provider).
   */
  async count(provider?: string): Promise<number> {
    if (provider !== undefined) {
      return this.db.countFromIndex(
        STORE_NAMES.SESSIONS,
        "by-provider",
        provider,
      );
    }
    return this.db.count(STORE_NAMES.SESSIONS);
  }

  /**
   * Delete all sessions. Used for data wipe.
   */
  async clear(): Promise<void> {
    await this.db.clear(STORE_NAMES.SESSIONS);
  }
}
