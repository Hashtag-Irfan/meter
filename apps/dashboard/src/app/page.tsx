"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

import { generateMockSessions, aggregateByDay } from "../lib/mock-data";

export default function Dashboard() {
  const sessions = useMemo(() => generateMockSessions(), []);
  const daily = useMemo(() => aggregateByDay(sessions), [sessions]);

  const totalTokens = sessions.reduce((s, e) => s + e.inputTokens + e.outputTokens, 0);
  const totalCost = sessions.reduce((s, e) => s + e.costUsd, 0);
  const totalSessions = sessions.length;
  const avgCostPerDay = totalCost / 30;

  const last7 = daily.slice(-7);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans">
      {/* Header */}
      <header className="border-b border-white/10 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-white rounded-sm" />
          <span className="font-semibold tracking-tight text-lg">METER</span>
        </div>
        <span className="text-xs text-white/40">Last 30 days</span>
      </header>

      <main className="px-8 py-8 max-w-6xl mx-auto space-y-8">
        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total Tokens", value: (totalTokens / 1000).toFixed(1) + "K" },
            { label: "Total Sessions", value: totalSessions.toString() },
            { label: "Total Cost", value: "$" + totalCost.toFixed(2) },
            { label: "Avg Cost / Day", value: "$" + avgCostPerDay.toFixed(2) },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/5 rounded-xl p-5 border border-white/10">
              <p className="text-xs text-white/40 mb-1">{stat.label}</p>
              <p className="text-2xl font-semibold tracking-tight">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Token usage chart */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <h2 className="text-sm font-medium text-white/60 mb-6">Token Usage — 30 Days</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={daily}>
              <defs>
                <linearGradient id="tokenGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ffffff" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis
                dataKey="date"
                tick={{ fill: "#ffffff40", fontSize: 11 }}
                tickFormatter={(d) => d.slice(5)}
                interval={4}
              />
              <YAxis
                tick={{ fill: "#ffffff40", fontSize: 11 }}
                tickFormatter={(v) => (v / 1000).toFixed(0) + "K"}
              />
              <Tooltip
                contentStyle={{ background: "#1a1a1a", border: "1px solid #ffffff20", borderRadius: 8 }}
                labelStyle={{ color: "#ffffff80" }}
                formatter={(v: number) => [(v / 1000).toFixed(1) + "K tokens"]}
              />
              <Area
                type="monotone"
                dataKey="tokens"
                stroke="#ffffff"
                strokeWidth={1.5}
                fill="url(#tokenGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Cost + Sessions row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <h2 className="text-sm font-medium text-white/60 mb-6">Daily Cost — Last 7 Days</h2>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={last7}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#ffffff40", fontSize: 11 }}
                  tickFormatter={(d) => d.slice(5)}
                />
                <YAxis
                  tick={{ fill: "#ffffff40", fontSize: 11 }}
                  tickFormatter={(v) => "$" + v.toFixed(2)}
                />
                <Tooltip
                  contentStyle={{ background: "#1a1a1a", border: "1px solid #ffffff20", borderRadius: 8 }}
                  formatter={(v: number) => ["$" + v.toFixed(3)]}
                />
                <Bar dataKey="cost" fill="#ffffff20" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <h2 className="text-sm font-medium text-white/60 mb-6">Sessions — Last 7 Days</h2>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={last7}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#ffffff40", fontSize: 11 }}
                  tickFormatter={(d) => d.slice(5)}
                />
                <YAxis tick={{ fill: "#ffffff40", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: "#1a1a1a", border: "1px solid #ffffff20", borderRadius: 8 }}
                  formatter={(v: number) => [v + " sessions"]}
                />
                <Bar dataKey="sessions" fill="#ffffff15" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent sessions */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <h2 className="text-sm font-medium text-white/60 mb-4">Recent Sessions</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-white/30 text-xs border-b border-white/10">
                <th className="text-left pb-3">Time</th>
                <th className="text-left pb-3">Project</th>
                <th className="text-right pb-3">Input</th>
                <th className="text-right pb-3">Output</th>
                <th className="text-right pb-3">Cost</th>
              </tr>
            </thead>
            <tbody>
              {sessions
                .slice(-10)
                .reverse()
                .map((s) => (
                  <tr key={s.sessionId} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3 text-white/50">
                      {s.timestamp.toLocaleDateString()}{" "}
                      {s.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="py-3">{s.project}</td>
                    <td className="py-3 text-right text-white/60">
                      {(s.inputTokens / 1000).toFixed(1)}K
                    </td>
                    <td className="py-3 text-right text-white/60">
                      {(s.outputTokens / 1000).toFixed(1)}K
                    </td>
                    <td className="py-3 text-right text-green-400/80">${s.costUsd.toFixed(3)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
