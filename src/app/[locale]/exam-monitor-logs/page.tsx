"use client";

/* ================================================================
   🚨 TEMPORARY PAGE — DELETE WHEN NO LONGER NEEDED 🚨
   Route: /[locale]/exam-monitor-logs
   Purpose: Read & display the daily exam monitor JSON logs from
            the public Cloudflare R2 bucket. No auth required.
   To remove: Delete this entire folder:
     src/app/[locale]/exam-monitor-logs/
   ================================================================ */

import React, { useState, useEffect, useCallback } from "react";
import { RefreshCw, Calendar, AlertTriangle, Trash2 } from "lucide-react";

// ── TEMPORARY CONFIG — fetches via local API proxy to avoid CORS ──
const LOG_API = "/api/exam-monitor-logs";

interface LogEntry {
  timestamp: string;
  event: string;
  message: string;
  center_id?: number;
  center_name?: string;
  category_code?: number;
  details?: Record<string, unknown>;
}

const EVENT_COLORS: Record<string, string> = {
  start: "bg-blue-100 text-blue-800 border-blue-300",
  stop: "bg-gray-100 text-gray-800 border-gray-300",
  new_slots: "bg-green-100 text-green-800 border-green-300",
  slots_disappeared: "bg-red-100 text-red-800 border-red-300",
  error: "bg-yellow-100 text-yellow-900 border-yellow-400",
};

const EVENT_LABELS: Record<string, string> = {
  start: "🟢 START",
  stop: "🔴 STOP",
  new_slots: "✅ NEW SLOTS",
  slots_disappeared: "❌ SLOTS GONE",
  error: "⚠️ ERROR",
};

export default function ExamMonitorLogsPage() {
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterEvent, setFilterEvent] = useState<string>("all");

  const fetchLogs = useCallback(async (date: string) => {
    setLoading(true);
    setError(null);
    setLogs([]);
    try {
      const url = `${LOG_API}?date=${date}`;
      const resp = await fetch(url, { cache: "no-store" });
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }
      const data: LogEntry[] = await resp.json();
      if (!Array.isArray(data) || data.length === 0) {
        setError(`No logs found for ${date}`);
        return;
      }
      setLogs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch logs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs(selectedDate);
  }, [selectedDate, fetchLogs]);

  const filteredLogs =
    filterEvent === "all"
      ? logs
      : logs.filter((l) => l.event === filterEvent);

  const eventCounts = logs.reduce<Record<string, number>>((acc, l) => {
    acc[l.event] = (acc[l.event] || 0) + 1;
    return acc;
  }, {});

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-6">
        {/* ── TEMPORARY BANNER ── */}
        <div className="mb-6 p-3 bg-yellow-50 border-2 border-dashed border-yellow-400 rounded-lg flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
          <p className="text-yellow-800 text-sm font-medium">
            🚨 TEMPORARY PAGE — Delete{" "}
            <code className="bg-yellow-200 px-1 rounded text-xs">
              src/app/[locale]/exam-monitor-logs/
            </code>{" "}
            when no longer needed
          </p>
        </div>

        {/* ── Header ── */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            Exam Monitor Logs
          </h1>
          <p className="text-gray-500 text-sm">
            Reading from Cloudflare R2 (via /api/exam-monitor-logs proxy)
          </p>
        </div>

        {/* ── Controls ── */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F03D3D]"
            />
          </div>

          <select
            value={filterEvent}
            onChange={(e) => setFilterEvent(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F03D3D]"
          >
            <option value="all">All events ({logs.length})</option>
            {Object.entries(eventCounts).map(([evt, count]) => (
              <option key={evt} value={evt}>
                {EVENT_LABELS[evt] || evt} ({count})
              </option>
            ))}
          </select>

          <button
            onClick={() => fetchLogs(selectedDate)}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* ── Summary badges ── */}
        {logs.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {Object.entries(eventCounts).map(([evt, count]) => (
              <span
                key={evt}
                className={`px-3 py-1 text-xs font-semibold rounded-full border ${EVENT_COLORS[evt] || "bg-gray-100 text-gray-700 border-gray-300"}`}
              >
                {EVENT_LABELS[evt] || evt}: {count}
              </span>
            ))}
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm mb-6">
            {error}
          </div>
        )}

        {/* ── Loading ── */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-[#F03D3D] border-t-transparent rounded-full" />
          </div>
        )}

        {/* ── Log entries ── */}
        {!loading && filteredLogs.length > 0 && (
          <div className="space-y-3">
            {[...filteredLogs].reverse().map((entry, i) => (
              <div
                key={`${entry.timestamp}-${i}`}
                className={`p-4 rounded-lg border ${EVENT_COLORS[entry.event] || "bg-white border-gray-200"}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold uppercase tracking-wider">
                        {EVENT_LABELS[entry.event] || entry.event}
                      </span>
                      {entry.center_name && (
                        <span className="text-xs font-medium opacity-75">
                          — {entry.center_name}
                        </span>
                      )}
                      {entry.category_code && (
                        <span className="text-xs opacity-60">
                          (cat: {entry.category_code})
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium">{entry.message}</p>
                    {entry.details && (
                      <pre className="mt-2 text-xs opacity-70 overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(entry.details, null, 2)}
                      </pre>
                    )}
                  </div>
                  <time className="text-xs opacity-60 whitespace-nowrap flex-shrink-0">
                    {new Date(entry.timestamp).toLocaleTimeString("ka-GE", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </time>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && !error && filteredLogs.length === 0 && logs.length > 0 && (
          <p className="text-center text-gray-500 py-12">
            No &quot;{filterEvent}&quot; events found. Try a different filter.
          </p>
        )}

        {!loading && !error && logs.length === 0 && (
          <p className="text-center text-gray-500 py-12">
            No logs for this date yet.
          </p>
        )}
      </div>
    </main>
  );
}
