import { PROVIDER_PRICING } from "@meter/shared";

import type { AggregatedMetrics, Event, Session } from "@meter/shared";

/**
 * Calculate estimated cost in USD for a given event based on provider pricing tables.
 */
export function calculateEventCost(
  event: Event,
  pricingTable: typeof PROVIDER_PRICING = PROVIDER_PRICING,
): number {
  const provider = event.provider;
  const pricing = pricingTable[provider];

  if (!pricing) return 0;

  const tokensIn = event.tokensIn ?? 0;
  const tokensOut = event.tokensOut ?? 0;

  // Pricing is per 1M tokens
  const costIn = (tokensIn / 1_000_000) * pricing.inputPer1M;
  const costOut = (tokensOut / 1_000_000) * pricing.outputPer1M;

  return costIn + costOut;
}

/**
 * Calculate overall metrics from a set of sessions and events.
 * 
 * All calculations are stateless and pure.
 */
export function calculateMetrics(
  sessions: Session[],
  events: Event[],
  pricingTable: typeof PROVIDER_PRICING = PROVIDER_PRICING,
): AggregatedMetrics {
  const totalSessions = sessions.length;
  const totalEvents = events.length;

  let totalTokensIn = 0;
  let totalTokensOut = 0;
  let estimatedCostUsd = 0;

  let latencySum = 0;
  let latencyCount = 0;

  let accepts = 0;
  let rejects = 0;

  const activeHoursSet = new Set<string>();

  for (const event of events) {
    // Accumulate tokens
    totalTokensIn += event.tokensIn ?? 0;
    totalTokensOut += event.tokensOut ?? 0;

    // Accumulate cost
    estimatedCostUsd += calculateEventCost(event, pricingTable);

    // Latency for completion events
    if (event.type === "completion" && event.latencyMs !== null) {
      latencySum += event.latencyMs;
      latencyCount++;
    }

    // Acceptance rate
    if (event.type === "accept") {
      accepts++;
    } else if (event.type === "reject") {
      rejects++;
    }

    // Active hours (group by unique UTC hour string to avoid conflicts)
    const date = new Date(event.timestamp);
    const hourStr = `${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()}:${date.getUTCHours()}`;
    activeHoursSet.add(hourStr);
  }

  const totalTokens = totalTokensIn + totalTokensOut;

  // Averages
  const avgLatencyMs = latencyCount > 0 ? Math.round(latencySum / latencyCount) : null;

  const acceptRateDenom = accepts + rejects;
  const acceptRate = acceptRateDenom > 0 ? accepts / acceptRateDenom : null;

  const activeHours = activeHoursSet.size;

  return {
    totalSessions,
    totalEvents,
    totalTokensIn,
    totalTokensOut,
    totalTokens,
    estimatedCostUsd: estimatedCostUsd > 0 ? Number(estimatedCostUsd.toFixed(6)) : 0,
    acceptRate: acceptRate !== null ? Number(acceptRate.toFixed(4)) : null,
    avgLatencyMs,
    activeHours,
  };
}
