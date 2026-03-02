"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { coreApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Search, Download, Eye, Play, Square, Loader2 } from "lucide-react";
import Link from "next/link";
import { formatDate, formatTime, attendancePct, cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { CreateSessionModal } from "@/components/sessions/CreateSessionModal";

const STATUS_FILTERS = ["all", "scheduled", "active", "closed"];

function StatusBadge({ status }) {
  const map = {
    active:    "bg-teal-500/10 text-teal-400 border-teal-500/20",
    scheduled: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    closed:    "bg-white/5 text-white/30 border-white/[0.08]",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] font-semibold uppercase tracking-wide ${map[status] ?? map.closed}`}>
      {status === "active" && <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />}
      {status}
    </span>
  );
}

export default function SessionsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch]             = useState("");
  const [showCreate, setShowCreate]     = useState(false);

  const params = {};
  if (statusFilter !== "all") params.status = statusFilter;
  if (search) params.search = search;

  const { data, isLoading } = useQuery({
    queryKey: ["sessions", params],
    queryFn:  () => coreApi.sessions.list(params).then((r) => r.data),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, s }) => coreApi.sessions.setStatus(id, s),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ["sessions"] }); toast.success("Status updated"); },
    onError:    (err) => toast.error(err?.response?.data?.detail ?? "Failed to update status"),
  });

  const sessions = data?.results ?? [];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-bold text-3xl text-white">Exam Sessions</h1>
          <p className="text-white/40 text-sm mt-1">{data?.count ?? 0} sessions total</p>
        </div>
        {user?.role === "admin" && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 h-10 rounded-xl bg-teal-500 hover:bg-teal-400 text-navy-950 font-semibold text-sm transition-all shadow-[0_0_20px_rgba(45,212,191,0.2)]"
          >
            <Plus className="w-4 h-4" />
            New Session
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search course or venue…"
            className="w-full h-10 pl-9 pr-4 rounded-xl bg-navy-800 border border-white/10 text-white placeholder-white/25 text-sm focus:outline-none focus:border-teal-500/40"
          />
        </div>

        <div className="flex gap-1 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={cn(
                "px-3 h-8 rounded-lg text-xs font-medium capitalize transition-all",
                statusFilter === f
                  ? "bg-teal-500/10 text-teal-400 border border-teal-500/20"
                  : "text-white/40 hover:text-white/70"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-teal-400 animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-16 text-white/25 text-sm">No sessions found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {["Course", "Programme / Level", "Date & Time", "Venue", "Attendance", "Status", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-white/30 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {sessions.map((s) => {
                  const pct = attendancePct(s.attendance_summary?.present, s.expected_students);
                  return (
                    <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-mono text-teal-400 text-xs">{s.course_code}</p>
                        <p className="text-white/35 text-xs truncate max-w-[140px] mt-0.5">{s.course_title}</p>
                      </td>

                      <td className="px-4 py-3">
                        <p className="text-white/80 text-xs">{s.programme_name}</p>
                        <p className="text-white/35 text-xs mt-0.5">{s.level_name}</p>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-white/80 text-xs">{formatDate(s.date)}</p>
                        <p className="text-white/35 text-xs mt-0.5">
                          {formatTime(s.start_time)}{s.end_time ? ` – ${formatTime(s.end_time)}` : ""}
                        </p>
                      </td>

                      <td className="px-4 py-3 text-white/50 text-xs">{s.venue || "—"}</td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-white/80 text-xs">{s.attendance_summary?.present ?? 0}</span>
                          <span className="text-white/25 text-xs">/ {s.expected_students}</span>
                          <span className="text-teal-400 text-xs font-mono">{pct}%</span>
                        </div>
                        <div className="h-1 w-16 rounded-full bg-white/5 overflow-hidden">
                          <div className="h-full bg-teal-500 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                      </td>

                      <td className="px-4 py-3"><StatusBadge status={s.status} /></td>

                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          {user?.role === "admin" && s.status === "scheduled" && (
                            <button
                              onClick={() => statusMutation.mutate({ id: s.id, s: "active" })}
                              disabled={statusMutation.isPending}
                              title="Activate"
                              className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 transition-colors"
                            >
                              <Play className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {user?.role === "admin" && s.status === "active" && (
                            <button
                              onClick={() => statusMutation.mutate({ id: s.id, s: "closed" })}
                              disabled={statusMutation.isPending}
                              title="Close session"
                              className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors"
                            >
                              <Square className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <Link
                            href={`/sessions/${s.id}/attendance`}
                            className="p-1.5 rounded-lg bg-white/5 text-white/50 hover:text-white/80 hover:bg-white/10 transition-colors"
                            title="View attendance"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                          <a
                            href={coreApi.sessions.exportUrl(s.id, "xlsx")}
                            className="p-1.5 rounded-lg bg-white/5 text-white/50 hover:text-white/80 hover:bg-white/10 transition-colors"
                            title="Export XLSX"
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreate && <CreateSessionModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
