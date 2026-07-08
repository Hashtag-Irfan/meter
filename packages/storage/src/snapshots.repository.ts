import type { IDBPDatabase } from "idb";

import type { ProviderId, Snapshot, TimePeriod } from "@meter/shared";
import { STORE_NAMES } from "@meter/shared";

import type { MeterDBSchema } from "./db.js";

// ─── Snapshots Repository ─────────────────────────────────────────────────────

/**
 * All database operations for the `snapshots` object store.
 *
 * Snapshots are pre-computed aggregation rollups stored to avoid expensive
 * re-computation over large event sets. They are keyed by (provider, period,
 * periodStart) — a compound natural key that maps to the compound index.
 */
export class SnapshotsRepository {
  constructor(private readonly db: IDBPDatabase<MeterDBSchema>) {}

  /**
   * Retrieve a snapshot by its ULID ID.
   */
  async get(id: string): Promise<Snapshot | undefined> {
    return this.db.get(STORE_NAMES.SNAPSHOTS, id);
  }

  /**
   * Look up a specific snapshot by its natural key (provider + period + start).
   * This is the primary read path for the analytics engine.
   */
  async getByKey(
    provider: ProviderId,
    period: TimePeriod,
    periodStart: number,
  ): Promise<Snapshot | undefined> {
    const key: [string, string, number] = [provider, period, periodStart];
    const results = await this.db.getAllFromIndex(
      STORE_NAMES.SNAPSHOTS,
      "by-provider-period-start",
      IDBKeyRange.only(key),
    );
    return results[0];
  }

  /**
   * Insert or replace a snapshot.
   */
  async put(snapshot: Snapshot): Promise<void> {
    await this.db.put(STORE_NAMES.SNAPSHOTS, snapshot);
  }

  /**
   * Get all snapshots for a provider, optionally scoped to a period type.
   */
  async queryByProvider(
    provider: ProviderId,
    period?: TimePeriod,
  ): Promise<Snapshot[]> {
    if (period !== undefined) {
      // Use compound index: provider + period
      const lower: [string, string, number] = [provider, period, 0];
      const upper: [string, string, number] = [provider, period, Date.now() * 2];
      const range = IDBKeyRange.bound(lower, upper);
      return this.db.getAllFromIndex(
        STORE_NAMES.SNAPSHOTS,
        "by-provider-period-start",
        range,
      );
    }
    return this.db.getAllFromIndex(
      STORE_NAMES.SNAPSHOTS,
      "by-provider",
      provider,
    );
  }

  /**
   * Get snapshots for a provider + period within a time range.
   */
  async queryRange(
    provider: ProviderId,
    period: TimePeriod,
    from: number,
    to: number,
  ): Promise<Snapshot[]> {
    const lower: [string, string, number] = [provider, period, from];
    const upper: [string, string, number] = [provider, period, to];
    const range = IDBKeyRange.bound(lower, upper);
    return this.db.getAllFromIndex(
      STORE_NAMES.SNAPSHOTS,
      "by-provider-period-start",
      range,
    );
  }

  /**
   * Delete all snapshots. Used to invalidate the cache after raw data changes.
   */
  async clear(): Promise<void> {
    await this.db.clear(STORE_NAMES.SNAPSHOTS);
  }

  /**
   * Delete all snapshots for a specific provider.
   */
  async clearByProvider(provider: ProviderId): Promise<void> {
    const tx = this.db.transaction(STORE_NAMES.SNAPSHOTS, "readwrite");
    const index = tx.store.index("by-provider");
    let cursor = await index.openCursor(provider);
    while (cursor) {
      await cursor.delete();
      cursor = await cursor.continue();
    }
    await tx.done;
  }
}
