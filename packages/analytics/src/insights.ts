import { calculateEventCost } from "./metrics.js";

import type { Event, Session } from "@meter/shared";

export interface Insight {
  id: string;
  title: string;
  description: string;
  type: "info" | "warning" | "success" | "cost";
}

/**
 * Generate automated qualitative insights from session and event data.
 */
export function generateInsights(sessions: Session[], events: Event[]): Insight[] {
  const insights: Insight[] = [];
  if (events.length === 0) return insights;

  // Sort events chronologically to evaluate sequences
  const sortedEvents = [...events].sort((a, b) => a.timestamp - b.timestamp);

  // Heuristic 1: Loop Friction Detection (consecutive rejections)
  let consecutiveRejections = 0;
  let maxConsecutiveRejections = 0;

  for (const event of sortedEvents) {
    if (event.type === "reject") {
      consecutiveRejections++;
      maxConsecutiveRejections = Math.max(maxConsecutiveRejections, consecutiveRejections);
    } else if (event.type === "accept" || event.type === "completion") {
      consecutiveRejections = 0;
    }
  }

  if (maxConsecutiveRejections >= 5) {
    insights.push({
      id: "ai-friction-loop",
      title: "AI Friction Detected",
      description: `We detected a sequence of ${maxConsecutiveRejections} consecutive suggestion rejections. Consider dividing your task into smaller prompts.`,
      type: "warning",
    });
  }

  // Heuristic 2: Peak Activity Hour Detection
  const hourCounts = new Array<number>(24).fill(0);
  for (const event of events) {
    const hour = new Date(event.timestamp).getUTCHours();
    const existing = hourCounts[hour] ?? 0;
    hourCounts[hour] = existing + 1;
  }

  let peakHour = 0;
  let maxCount = 0;
  for (let h = 0; h < 24; h++) {
    const count = hourCounts[h] ?? 0;
    if (count > maxCount) {
      maxCount = count;
      peakHour = h;
    }
  }

  if (maxCount > 0) {
    const formattedHour = String(peakHour).padStart(2, "0");
    insights.push({
      id: "peak-activity",
      title: "Peak Productivity Window",
      description: `Your most active coding hour with AI assistants is around ${formattedHour}:00 UTC.`,
      type: "info",
    });
  }

  // Heuristic 3: High Cost Warnings
  let totalCost = 0;
  const costByProvider = new Map<string, number>();

  for (const event of events) {
    const cost = calculateEventCost(event);
    totalCost += cost;
    costByProvider.set(event.provider, (costByProvider.get(event.provider) ?? 0) + cost);
  }

  if (totalCost > 5.0) {
    let highestProvider = "";
    let highestCost = 0;

    for (const [provider, cost] of costByProvider.entries()) {
      if (cost > highestCost) {
        highestCost = cost;
        highestProvider = provider;
      }
    }

    if (highestProvider) {
      const percentage = Math.round((highestCost / totalCost) * 100);
      insights.push({
        id: "cost-driver",
        title: "Cost Driver Alert",
        description: `Your cumulative spend is $${totalCost.toFixed(2)}. ${highestProvider} represents ${percentage}% of total spend ($${highestCost.toFixed(2)}).`,
        type: "cost",
      });
    }
  }

  return insights;
}

/**
 * Generate a clean Markdown summary of developer-AI daily activity.
 * Useful for daily standup bulletins or timesheets.
 */
export function generateDailyStandup(sessions: Session[], events: Event[]): string {
  if (events.length === 0) {
    return "### Daily AI Coding Standup\n\nNo activity logged for the selected period.";
  }

  // Create a fast map of sessionId -> projectPath
  const sessionProjectMap = new Map<string, string>();
  for (const session of sessions) {
    sessionProjectMap.set(session.id, session.projectPath);
  }

  // Group by project path
  const projectStats = new Map<
    string,
    { prompts: number; accepts: number; cost: number; sessions: Set<string> }
  >();

  for (const event of events) {
    const proj = sessionProjectMap.get(event.sessionId) || "unknown";
    if (!projectStats.has(proj)) {
      projectStats.set(proj, { prompts: 0, accepts: 0, cost: 0, sessions: new Set() });
    }

    const stats = projectStats.get(proj)!;
    stats.sessions.add(event.sessionId);

    if (event.type === "prompt") stats.prompts++;
    if (event.type === "accept") stats.accepts++;
    stats.cost += calculateEventCost(event);
  }

  let output = "### Daily AI Coding Standup\n\n";
  output += "**Active Projects & Activity**:\n";

  for (const [project, stats] of projectStats.entries()) {
    const folderName = project.split(/[/\\]/).pop() || project;
    const sessionCount = stats.sessions.size;
    const costStr = stats.cost > 0 ? ` (Est. Cost: $${stats.cost.toFixed(4)})` : "";
    output += `- **${folderName}** (Path: \`${project}\`)${costStr}:\n`;
    output += `  - Active sessions: ${sessionCount}\n`;
    output += `  - Prompts sent: ${stats.prompts}\n`;
    output += `  - Suggestions accepted: ${stats.accepts}\n`;
  }

  return output.trim();
}
