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
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

// ── Stat Card ─────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, accent, delay = 0 }) {
  const accents = {
    teal: "text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-500/10 border-teal-200 dark:border-teal-500/20",
    sky: "text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/20",
    amber:
      "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20",
    violet:
      "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/20",
  };

  return (
    <div
      className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4 animate-fade-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div
          className={cn(
            "w-8 h-8 rounded-lg border flex items-center justify-center",
            accents[accent],
          )}
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="font-bold text-2xl text-foreground tabular-nums">
        {value != null ? value.toLocaleString() : "—"}
      </p>
    </div>
  );
}

// ── Status Badge ──────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    active:
      "bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-500/20",
    scheduled:
      "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20",
    closed: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] font-semibold uppercase tracking-wide",
        map[status] ?? map.closed,
      )}
    >
      {status === "active" && (
        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
      )}
      {status}
    </span>
  );
}

// ── Session Card ──────────────────────────────────────────
function SessionCard({ session }) {
  const pct = attendancePct(
    session.attendance_summary?.present,
    session.expected_students,
  );

  return (
    <Link
      href={`/sessions/${session.id}/attendance`}
      className="block bg-card hover:bg-accent/50 border border-border rounded-xl p-4 group transition-colors duration-150"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="font-semibold text-sm text-foreground">
            {session.course_code}
          </p>
          <p className="text-muted-foreground text-xs mt-0.5 line-clamp-1">
            {session.course_title}
          </p>
        </div>
        <StatusBadge status={session.status} />
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
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
          <span className="text-muted-foreground">
            {session.attendance_summary?.present ?? 0} /{" "}
            {session.expected_students} present
          </span>
          <span className="text-primary font-mono font-medium">{pct}%</span>
        </div>
        <div className="h-1 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
        View register <ArrowRight className="w-3 h-3" />
      </div>
    </Link>
  );
}

// ── Page ──────────────────────────────────────────────────
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
    <div className="p-6 lg:p-8 space-y-8 max-w-6xl">
      {/* Header */}
      <div className="animate-fade-up">
        <p className="text-sm text-muted-foreground mb-0.5">{getGreeting()},</p>
        <h1 className="font-bold text-2xl text-foreground capitalize">
          {user?.username}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {new Date().toLocaleDateString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Students"
          value={stats?.total_students}
          icon={Users}
          accent="teal"
          delay={0}
        />
        <StatCard
          label="Exam Sessions"
          value={stats?.total_sessions}
          icon={BookOpen}
          accent="sky"
          delay={50}
        />
        <StatCard
          label="Active Now"
          value={stats?.active_sessions}
          icon={Activity}
          accent="amber"
          delay={100}
        />
        <StatCard
          label="Scans Today"
          value={stats?.total_scans_today}
          icon={Scan}
          accent="violet"
          delay={150}
        />
      </div>

      {/* Two-col content */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Active sessions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm text-foreground">
              Active Sessions
            </h2>
            <Link
              href="/sessions?status=active"
              className="text-xs text-primary hover:underline flex items-center gap-0.5"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {activeSessData?.results?.length === 0 && (
              <div className="bg-muted/50 border border-border rounded-xl p-8 text-center text-sm text-muted-foreground">
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
            <h2 className="font-semibold text-sm text-foreground">
              Recent Sessions
            </h2>
            <Link
              href="/sessions"
              className="text-xs text-primary hover:underline flex items-center gap-0.5"
            >
              All sessions <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Course", "Date", "Status", "Scanned"].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentData?.results?.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="text-center text-muted-foreground py-8 text-sm"
                    >
                      No sessions yet
                    </td>
                  </tr>
                )}
                {recentData?.results?.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-accent/40 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/sessions/${s.id}/attendance`}
                        className="font-mono text-primary hover:underline text-xs"
                      >
                        {s.course_code}
                      </Link>
                      <p className="text-muted-foreground text-xs truncate max-w-[130px]">
                        {s.course_title}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {formatDate(s.date)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-foreground tabular-nums">
                      {s.attendance_summary?.total ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quick scan CTA */}
      {canScan && (
        <Link
          href="/scan"
          className="flex items-center justify-between bg-card hover:bg-primary/5 border border-border hover:border-primary/30 rounded-xl p-5 group transition-all duration-150"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Scan className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">
                Open QR Scanner
              </p>
              <p className="text-muted-foreground text-xs">
                Start scanning student QR codes
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform" />
        </Link>
      )}
    </div>
  );
}
