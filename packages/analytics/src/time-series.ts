import { truncateToPeriod } from "@meter/shared";

import { calculateEventCost } from "./metrics.js";

import type { Event, TimePeriod, TimeSeriesPoint } from "@meter/shared";

/**
 * Generate a complete, sorted time-series dataset from an event array.
 * 
 * Automatically initializes empty intervals in the date range with zero value
 * to prevent chart rendering gaps.
 * 
 * @param events - Raw events array
 * @param period - Truncation window (hour, day, week, month)
 * @param from - Start boundary timestamp
 * @param to - End boundary timestamp
 * @param metric - The numeric metric to aggregate
 */
export function generateTimeSeries(
  events: Event[],
  period: TimePeriod,
  from: number,
  to: number,
  metric: "tokens" | "cost" | "events" | "latency" = "events",
): TimeSeriesPoint[] {
  const buckets = new Map<number, Event[]>();

  // 1. Initialize all bucket intervals
  let current = truncateToPeriod(from, period);
  const endLimit = truncateToPeriod(to, period);

  // Safety break to prevent infinite loops on invalid range parameters
  let safetyCounter = 0;
  const maxIterations = 5000;

  while (current <= endLimit && safetyCounter < maxIterations) {
    buckets.set(current, []);

    const d = new Date(current);
    switch (period) {
      case "hour":
        d.setUTCHours(d.getUTCHours() + 1);
        break;
      case "day":
        d.setUTCDate(d.getUTCDate() + 1);
        break;
      case "week":
        d.setUTCDate(d.getUTCDate() + 7);
        break;
      case "month":
        d.setUTCMonth(d.getUTCMonth() + 1);
        break;
    }
    current = d.getTime();
    safetyCounter++;
  }

  // 2. Classify events into their bucket intervals
  for (const event of events) {
    const bucketStart = truncateToPeriod(event.timestamp, period);
    if (buckets.has(bucketStart)) {
      buckets.get(bucketStart)!.push(event);
    }
  }

  // 3. Compute final metrics
  const points: TimeSeriesPoint[] = [];

  for (const [timestamp, bucketEvents] of buckets.entries()) {
    let value = 0;

    switch (metric) {
      case "events":
        value = bucketEvents.length;
        break;
      case "tokens":
        value = bucketEvents.reduce(
          (sum, e) => sum + (e.tokensIn ?? 0) + (e.tokensOut ?? 0),
          0,
        );
        break;
      case "cost": {
        const cost = bucketEvents.reduce((sum, e) => sum + calculateEventCost(e), 0);
        value = Number(cost.toFixed(6));
        break;
      }
      case "latency": {
        const completions = bucketEvents.filter(
          (e) => e.type === "completion" && e.latencyMs !== null,
        );
        if (completions.length > 0) {
          const sum = completions.reduce((acc, e) => acc + (e.latencyMs ?? 0), 0);
          value = Math.round(sum / completions.length);
        } else {
          value = 0;
        }
        break;
      }
    }

    points.push({ timestamp, value });
  }

  // Ensure output is sorted chronologically
  return points.sort((a, b) => a.timestamp - b.timestamp);
}
