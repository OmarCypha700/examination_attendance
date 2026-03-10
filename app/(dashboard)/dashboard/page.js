"use client";

import { useQuery } from "@tanstack/react-query";
import { coreApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import {
  Users,
  BookOpen,
  Activity,
  Scan,
  ArrowRight,
  Clock,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import {
  formatDate,
  formatTime,
  getGreeting,
  attendancePct,
} from "@/lib/utils";

// ── Stat Card ──────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, colorClass, delay = 0 }) {
  return (
    <div
      className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 flex flex-col gap-3 animate-fade-up"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "forwards" }}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/40">{label}</p>
        <div
          className={`w-9 h-9 rounded-xl border flex items-center justify-center ${colorClass}`}
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="font-bold text-3xl text-white">
        {value != null ? value.toLocaleString() : "—"}
      </p>
    </div>
  );
}

// ── Session Card ───────────────────────────────────────────────────────────────
function SessionCard({ session }) {
  const pct = attendancePct(
    session.attendance_summary?.present,
    session.expected_students,
  );

  return (
    <Link
      href={`/sessions/${session.id}/attendance`}
      className="block bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.06] rounded-xl p-4 group transition-colors"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="font-semibold text-white text-sm">
            {session.course_code}
          </p>
          <p className="text-white/40 text-xs mt-0.5 line-clamp-1">
            {session.course_title}
          </p>
        </div>
        <StatusBadge status={session.status} />
      </div>

      <div className="flex items-center gap-3 text-xs text-white/30 mb-3">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatTime(session.start_time)}
        </span>
        {session.venue && (
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {session.venue}
          </span>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/40">
            {session.attendance_summary?.present ?? 0} /{" "}
            {session.expected_students} present
          </span>
          <span className="text-teal-400 font-mono">{pct}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full bg-teal-500 transition-all duration-500"
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1 text-xs text-teal-400 opacity-0 group-hover:opacity-100 transition-opacity">
        View register <ArrowRight className="w-3 h-3" />
      </div>
    </Link>
  );
}

function StatusBadge({ status }) {
  const map = {
    active: "bg-teal-500/10 text-teal-400 border-teal-500/20",
    scheduled: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    closed: "bg-white/5 text-white/30 border-white/10",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] font-semibold uppercase tracking-wide ${map[status] ?? map.closed}`}
    >
      {status === "active" && (
        <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
      )}
      {status}
    </span>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => coreApi.dashboard().then((r) => r.data),
    refetchInterval: 30_000,
  });

  const { data: activeSessData } = useQuery({
    queryKey: ["sessions", { status: "active" }],
    queryFn: () =>
      coreApi.sessions
        .list({ status: "active", page_size: 10 })
        .then((r) => r.data),
    refetchInterval: 20_000,
  });

  const { data: recentData } = useQuery({
    queryKey: ["sessions", { page_size: 5 }],
    queryFn: () => coreApi.sessions.list({ page_size: 5 }).then((r) => r.data),
  });

  const canScan = user?.role === "admin" || user?.role === "invigilator";

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl">
      {/* Header */}
      <div>
        <p className="text-white/40 text-sm mb-1">{getGreeting()},</p>
        <h1 className="font-bold text-3xl text-white">
          {user?.username}
          <span className="text-white/20"> · </span>
          <span className="text-teal-400 capitalize">{user?.role}</span>
        </h1>
        <p className="text-white/30 text-sm mt-1">
          {new Date().toLocaleDateString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Students"
          value={stats?.total_students}
          icon={Users}
          colorClass="text-teal-400 bg-teal-500/10 border-teal-500/20"
          delay={0}
        />
        <StatCard
          label="Exam Sessions"
          value={stats?.total_sessions}
          icon={BookOpen}
          colorClass="text-sky-400 bg-sky-500/10 border-sky-500/20"
          delay={50}
        />
        <StatCard
          label="Active Now"
          value={stats?.active_sessions}
          icon={Activity}
          colorClass="text-amber-400 bg-amber-500/10 border-amber-500/20"
          delay={100}
        />
        <StatCard
          label="Scans Today"
          value={stats?.total_scans_today}
          icon={Scan}
          colorClass="text-violet-400 bg-violet-500/10 border-violet-500/20"
          delay={150}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Active sessions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Active Sessions</h2>
            <Link
              href="/sessions?status=active"
              className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {activeSessData?.results?.length === 0 && (
              <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-8 text-center text-white/25 text-sm">
                No active sessions right now.
              </div>
            )}
            {activeSessData?.results?.map((s) => (
              <SessionCard key={s.id} session={s} />
            ))}
          </div>
        </div>

        {/* Recent sessions table */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Recent Sessions</h2>
            <Link
              href="/sessions"
              className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1"
            >
              All sessions <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {["Course", "Date", "Status", "Scanned"].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-xs font-semibold text-white/30 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {recentData?.results?.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="text-center text-white/25 py-8 text-sm"
                    >
                      No sessions yet
                    </td>
                  </tr>
                )}
                {recentData?.results?.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/sessions/${s.id}/attendance`}
                        className="font-mono text-teal-400 hover:text-teal-300 text-xs"
                      >
                        {s.course_code}
                      </Link>
                      <p className="text-white/30 text-xs truncate max-w-[130px]">
                        {s.course_title}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-xs text-white/50">
                      {formatDate(s.date)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-white/70">
                      {s.attendance_summary?.total ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quick action */}
      {canScan && (
        <Link
          href="/scan"
          className="flex items-center justify-between bg-white/[0.02] hover:bg-teal-500/5 border border-teal-500/20 rounded-xl p-5 group transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
              <Scan className="w-6 h-6 text-teal-400" />
            </div>
            <div>
              <p className="font-semibold text-white">Open QR Scanner</p>
              <p className="text-white/40 text-sm">
                Start scanning student QR codes
              </p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-teal-400 group-hover:translate-x-1 transition-transform" />
        </Link>
      )}
    </div>
  );
}
