import { monotonicFactory } from "ulid";

const ulid = monotonicFactory();

/**
 * Generate a sortable, unique ID.
 * Uses ULID: lexicographically sortable, 128-bit, URL-safe.
 */
export function generateId(): string {
  return ulid();
}

/**
 * Clamp a number between min and max (inclusive).
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Truncate a unix timestamp (ms) to the start of a given period.
 * All truncation is done in UTC for consistency across timezones.
 */
export function truncateToPeriod(
  timestampMs: number,
  period: "hour" | "day" | "week" | "month",
): number {
  const d = new Date(timestampMs);
  switch (period) {
    case "hour":
      d.setUTCMinutes(0, 0, 0);
      break;
    case "day":
      d.setUTCHours(0, 0, 0, 0);
      break;
    case "week": {
      const day = d.getUTCDay(); // 0 = Sunday
      d.setUTCDate(d.getUTCDate() - day);
      d.setUTCHours(0, 0, 0, 0);
      break;
    }
    case "month":
      d.setUTCDate(1);
      d.setUTCHours(0, 0, 0, 0);
      break;
  }
  return d.getTime();
}

/**
 * Format a number of bytes into a human-readable string.
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const safeI = clamp(i, 0, units.length - 1);
  return `${(bytes / Math.pow(1024, safeI)).toFixed(1)} ${units[safeI]}`;
}

/**
 * Format a duration in milliseconds to a human-readable string.
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ${Math.floor((ms % 60_000) / 1000)}s`;
  return `${Math.floor(ms / 3_600_000)}h ${Math.floor((ms % 3_600_000) / 60_000)}m`;
}

/**
 * Format a USD cost to a display string.
 */
export function formatCost(usd: number): string {
  if (usd < 0.01) return "<$0.01";
  return `$${usd.toFixed(2)}`;
}

/**
 * Format large numbers compactly (1000 → 1K, 1000000 → 1M).
 */
export function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

/**
 * Type-safe object entries.
 */
export function typedEntries<T extends object>(
  obj: T,
): [keyof T, T[keyof T]][] {
  return Object.entries(obj) as [keyof T, T[keyof T]][];
}

/**
 * Group an array by a key function.
 */
export function groupBy<T, K extends string | number>(
  arr: T[],
  keyFn: (item: T) => K,
): Record<K, T[]> {
  return arr.reduce(
    (acc, item) => {
      const key = keyFn(item);
      if (!acc[key]) acc[key] = [];
      acc[key]!.push(item);
      return acc;
    },
    {} as Record<K, T[]>,
  );
}

/**
 * Sleep for a given number of milliseconds.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Assert a value is never (exhaustive check).
 */
export function assertNever(x: never): never {
  throw new Error(`Unexpected value: ${JSON.stringify(x)}`);
}
