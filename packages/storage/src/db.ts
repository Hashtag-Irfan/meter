import type { DBSchema, IDBPDatabase } from "idb";

import type { Event, Session, Snapshot } from "@meter/shared";
import { DB_NAME, DB_VERSION, STORE_NAMES } from "@meter/shared";

import { openDB } from "idb";

// ─── IndexedDB Schema ─────────────────────────────────────────────────────────

/**
 * Typed schema for METER's IndexedDB database.
 * Each object store is keyed and has named indexes defined here.
 *
 * Versioning: increment DB_VERSION in @meter/shared and add a migration
 * handler to the `upgrade` function below when changing this schema.
 */
export interface MeterDBSchema extends DBSchema {
  [STORE_NAMES.SESSIONS]: {
    key: string; // Session.id (ULID)
    value: Session;
    indexes: {
      "by-provider": string;       // Session.provider
      "by-started-at": number;     // Session.startedAt
      "by-project": string;        // Session.projectPath
      "by-provider-started": [string, number]; // [provider, startedAt] — compound
    };
  };
  [STORE_NAMES.EVENTS]: {
    key: string; // Event.id (ULID)
    value: Event;
    indexes: {
      "by-session": string;        // Event.sessionId
      "by-provider": string;       // Event.provider
      "by-type": string;           // Event.type
      "by-timestamp": number;      // Event.timestamp
      "by-session-timestamp": [string, number]; // [sessionId, timestamp] — compound
      "by-provider-timestamp": [string, number]; // [provider, timestamp] — compound
    };
  };
  [STORE_NAMES.SNAPSHOTS]: {
    key: string; // Snapshot.id (ULID)
    value: Snapshot;
    indexes: {
      "by-provider": string;       // Snapshot.provider
      "by-period": string;         // Snapshot.period
      "by-provider-period-start": [string, string, number]; // compound — primary lookup key
    };
  };
}

export type MeterDB = IDBPDatabase<MeterDBSchema>;

// ─── DB Factory ───────────────────────────────────────────────────────────────

let _db: MeterDB | null = null;

/**
 * Open (or reuse) the METER IndexedDB database.
 * Handles all schema migrations via the `upgrade` callback.
 *
 * @param factory - Optional IDBFactory override (used in tests with fake-indexeddb)
 */
export async function openMeterDB(factory?: IDBFactory): Promise<MeterDB> {
  if (_db) return _db;

  _db = await openDB<MeterDBSchema>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, _tx) {
      // ── Version 1: initial schema ─────────────────────────────────────────
      if (oldVersion < 1) {
        // sessions store
        const sessions = db.createObjectStore(STORE_NAMES.SESSIONS, {
          keyPath: "id",
        });
        sessions.createIndex("by-provider", "provider");
        sessions.createIndex("by-started-at", "startedAt");
        sessions.createIndex("by-project", "projectPath");
        sessions.createIndex("by-provider-started", ["provider", "startedAt"]);

        // events store
        const events = db.createObjectStore(STORE_NAMES.EVENTS, {
          keyPath: "id",
        });
        events.createIndex("by-session", "sessionId");
        events.createIndex("by-provider", "provider");
        events.createIndex("by-type", "type");
        events.createIndex("by-timestamp", "timestamp");
        events.createIndex("by-session-timestamp", ["sessionId", "timestamp"]);
        events.createIndex("by-provider-timestamp", ["provider", "timestamp"]);

        // snapshots store
        const snapshots = db.createObjectStore(STORE_NAMES.SNAPSHOTS, {
          keyPath: "id",
        });
        snapshots.createIndex("by-provider", "provider");
        snapshots.createIndex("by-period", "period");
        snapshots.createIndex("by-provider-period-start", [
          "provider",
          "period",
          "periodStart",
        ]);
      }

      // ── Future versions: add migrations here ─────────────────────────────
      // if (oldVersion < 2) { ... }

      console.warn(
        `[METER] DB migrated: v${oldVersion} → v${newVersion ?? DB_VERSION}`,
      );
    },

    blocked() {
      console.warn(
        "[METER] DB upgrade blocked — close other METER tabs to continue.",
      );
    },

    blocking() {
      // Another tab wants to upgrade. Close this connection gracefully.
      _db?.close();
      _db = null;
    },

    terminated() {
      console.error("[METER] DB connection unexpectedly terminated.");
      _db = null;
    },
  });

  return _db;
}

/**
 * Close the current database connection.
 * Useful in tests to reset state between test suites.
 */
export function closeMeterDB(): void {
  _db?.close();
  _db = null;
}
