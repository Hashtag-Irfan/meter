export interface SessionEvent {
  sessionId: string;
  timestamp: Date;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  model: string;
  provider: "claude-code" | "cursor" | "copilot";
  project: string;
  costUsd: number;
}

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

export function generateMockSessions(): SessionEvent[] {
  const projects = ["Meter", "VakilAssist", "OfflineRx", "MaxScenes"];
  const events: SessionEvent[] = [];

  for (let day = 29; day >= 0; day--) {
    const sessionsToday = randomBetween(2, 8);
    for (let s = 0; s < sessionsToday; s++) {
      const input = randomBetween(800, 12000);
      const output = randomBetween(200, 4000);
      const cache = randomBetween(0, input * 0.6);
      const cost = input * 0.000003 + output * 0.000015;

      const ts = daysAgo(day);
      ts.setHours(randomBetween(8, 23), randomBetween(0, 59));

      events.push({
        sessionId: crypto.randomUUID(),
        timestamp: ts,
        inputTokens: input,
        outputTokens: output,
        cacheReadTokens: Math.floor(cache),
        model: "claude-sonnet-4-5",
        provider: "claude-code",
        project: projects[randomBetween(0, projects.length - 1)] ?? "Meter",
        costUsd: cost,
      });
    }
  }

  return events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

export function aggregateByDay(events: SessionEvent[]) {
  const map = new Map<string, { date: string; tokens: number; cost: number; sessions: number }>();

  for (const e of events) {
    const key = e.timestamp.toISOString().slice(0, 10);
    const existing = map.get(key) ?? { date: key, tokens: 0, cost: 0, sessions: 0 };
    existing.tokens += e.inputTokens + e.outputTokens;
    existing.cost += e.costUsd;
    existing.sessions += 1;
    map.set(key, existing);
  }

  return Array.from(map.values());
}
