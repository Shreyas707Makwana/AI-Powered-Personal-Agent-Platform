"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import Button from "@/components/Button";

// Demo data generators
const demoKpis = [
  { label: "Active Users", value: 428, delta: "+12%" },
  { label: "Sessions", value: 1284, delta: "+7%" },
  { label: "Messages", value: 5920, delta: "+18%" },
  { label: "Tool Runs", value: 342, delta: "+5%" },
];

const lineData = [12, 15, 9, 14, 18, 21, 19, 24, 28, 26, 30, 35];
const barData = [
  { label: "Mon", value: 42 },
  { label: "Tue", value: 58 },
  { label: "Wed", value: 36 },
  { label: "Thu", value: 64 },
  { label: "Fri", value: 72 },
  { label: "Sat", value: 28 },
  { label: "Sun", value: 31 },
];

function SparkLine({ values, color = "#3aa6ff" }: { values: number[]; color?: string }) {
  const points = useMemo(() => {
    const w = 260;
    const h = 60;
    const max = Math.max(...values) || 1;
    const stepX = w / (values.length - 1 || 1);
    return values
      .map((v, i) => {
        const x = i * stepX;
        const y = h - (v / max) * h;
        return `${x},${y}`;
      })
      .join(" ");
  }, [values]);

  return (
    <svg viewBox="0 0 260 60" className="w-full h-16">
      <polyline
        fill="none"
        stroke={color}
        strokeOpacity="0.9"
        strokeWidth="2"
        points={points}
      />
    </svg>
  );
}

function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value)) || 1;
  return (
    <div className="w-full h-48 flex items-end gap-2">
      {data.map((d) => (
        <div key={d.label} className="flex-1 flex flex-col items-center">
          <div
            className="w-full rounded-t-md"
            style={{
              height: `${(d.value / max) * 100}%`,
              background: "linear-gradient(180deg, rgba(58,166,255,0.9), rgba(58,166,255,0.6))",
              border: "1px solid #2a3442",
            }}
            title={`${d.label}: ${d.value}`}
          />
          <div className="mt-2 text-[10px] text-gray-400">{d.label}</div>
        </div>
      ))}
    </div>
  );
}

function downloadCsv(rows: Array<Record<string, string | number>>) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (val: string | number) => `"${String(val).replace(/"/g, '""')}"`;
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h] ?? "")).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "analytics_export.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function AnalyticsPage() {
  const csvRows = useMemo(() => {
    return barData.map((d, idx) => ({
      day: d.label,
      messages: d.value,
      users: Math.round(lineData[idx % lineData.length] * 10),
      tool_runs: Math.round(d.value * 0.6),
    }));
  }, []);

  return (
    <div className="min-h-screen px-4 md:px-8 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl md:text-3xl font-bold">Analytics</h1>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => downloadCsv(csvRows)}
            >
              Export CSV
            </Button>
            <Link href="/app">
              <Button variant="secondary" size="sm">
                ← Back to App
              </Button>
            </Link>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {demoKpis.map((k) => (
            <div key={k.label} className="quantum-card p-4 rounded-lg">
              <div className="text-xs text-gray-400">{k.label}</div>
              <div className="mt-1 text-2xl font-semibold">{k.value.toLocaleString()}</div>
              <div className="mt-2 text-xs text-green-400">{k.delta}</div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="quantum-card p-5 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-300">Monthly Active Users</div>
              <div className="text-xs text-gray-500">Last 12 months</div>
            </div>
            <SparkLine values={lineData} />
          </div>

          <div className="quantum-card p-5 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-300">Messages per Day</div>
              <div className="text-xs text-gray-500">Last 7 days</div>
            </div>
            <BarChart data={barData} />
          </div>
        </div>

        {/* Table */}
        <div className="quantum-card mt-6 p-4 rounded-lg overflow-x-auto">
          <div className="text-sm text-gray-300 mb-3">Recent Activity (demo)</div>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400">
                <th className="py-2 pr-4">Day</th>
                <th className="py-2 pr-4">Messages</th>
                <th className="py-2 pr-4">Users</th>
                <th className="py-2 pr-4">Tool Runs</th>
              </tr>
            </thead>
            <tbody>
              {csvRows.map((r) => (
                <tr key={r.day} className="border-t border-[var(--border)]">
                  <td className="py-2 pr-4 text-gray-300">{r.day}</td>
                  <td className="py-2 pr-4">{r.messages}</td>
                  <td className="py-2 pr-4">{r.users}</td>
                  <td className="py-2 pr-4">{r.tool_runs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
