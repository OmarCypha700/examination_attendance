"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { coreApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import {
  Plus,
  Search,
  Download,
  Eye,
  Play,
  Square,
  Loader2,
  Upload,
  FileDown,
  RotateCw,
  Edit2,
} from "lucide-react";
import Link from "next/link";
import { formatDate, formatTime, attendancePct, cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { CreateSessionModal } from "@/components/sessions/CreateSessionModal";
import { EditSessionModal } from "@/components/sessions/EditSessionModal";
import { ImportModal } from "@/components/ImportModal";

const STATUS_FILTERS = ["all", "scheduled", "active", "closed"];

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

const btnBase =
  "flex items-center gap-1.5 px-3 h-9 rounded-lg text-xs font-medium transition-all duration-150";

export default function SessionsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editSession, setEditSession] = useState(null);
  const [exporting, setExporting] = useState(false);

  const params = {};
  if (statusFilter !== "all") params.status = statusFilter;
  if (search) params.search = search;

  const { data, isLoading } = useQuery({
    queryKey: ["sessions", params],
    queryFn: () => coreApi.sessions.list(params).then((r) => r.data),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, s }) => coreApi.sessions.setStatus(id, s),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sessions"] });
      toast.success("Status updated");
    },
    onError: (err) =>
      toast.error(err?.response?.data?.detail ?? "Failed to update status"),
  });

  const handleExport = async (fmt) => {
    setExporting(true);
    try {
      await coreApi.sessions.export(fmt);
    } catch {
      toast.error("Export failed.");
    } finally {
      setExporting(false);
    }
  };

  const handleAttendanceExport = async (sessionId, fmt) => {
    try {
      await coreApi.sessions.exportAttendance(sessionId, fmt);
    } catch {
      toast.error("Export failed.");
    }
  };

  const sessions = data?.results ?? [];
  const isAdmin = user?.role === "admin";

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-bold text-2xl text-foreground">Exam Sessions</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {data?.count ?? 0} sessions total
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isAdmin && (
            <button
              onClick={() => handleExport("xlsx")}
              disabled={exporting}
              className={cn(
                btnBase,
                "border border-border text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-40",
              )}
            >
              <FileDown className="w-3.5 h-3.5" /> XLSX
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => setShowImport(true)}
              className={cn(
                btnBase,
                "border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10",
              )}
            >
              <Upload className="w-3.5 h-3.5" /> Import
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => setShowCreate(true)}
              className={cn(
                btnBase,
                "px-4 bg-primary text-primary-foreground hover:opacity-90",
              )}
            >
              <Plus className="w-4 h-4" /> New Session
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search course or venue…"
            className="w-full h-9 pl-9 pr-4 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex gap-1 bg-muted/50 border border-border rounded-lg p-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={cn(
                "px-3 h-7 rounded-md text-xs font-medium capitalize transition-all duration-150",
                statusFilter === f
                  ? "bg-background text-foreground shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            No sessions found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {[
                    "Course",
                    "Programme / Level",
                    "Date & Time",
                    "Venue",
                    "Attendance",
                    "Status",
                    "",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sessions.map((s) => {
                  const pct = attendancePct(
                    s.attendance_summary?.present,
                    s.expected_students,
                  );
                  return (
                    <tr
                      key={s.id}
                      className="hover:bg-accent/40 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <p className="font-mono text-primary text-xs font-medium">
                          {s.course_code}
                        </p>
                        <p className="text-muted-foreground text-xs truncate max-w-[140px] mt-0.5">
                          {s.course_title}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-foreground text-xs">
                          {s.programme_name}
                        </p>
                        <p className="text-muted-foreground text-xs mt-0.5">
                          {s.level_name}
                        </p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-foreground text-xs">
                          {formatDate(s.date)}
                        </p>
                        <p className="text-muted-foreground text-xs mt-0.5">
                          {formatTime(s.start_time)}
                          {s.end_time ? ` – ${formatTime(s.end_time)}` : ""}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {s.venue || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-foreground text-xs tabular-nums">
                            {s.attendance_summary?.present ?? 0}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            / {s.expected_students}
                          </span>
                          <span className="text-primary text-xs font-mono">
                            {pct}%
                          </span>
                        </div>
                        <div className="h-1 w-16 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={s.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {/* Status transitions */}
                          {isAdmin && s.status === "scheduled" && (
                            <button
                              onClick={() =>
                                statusMutation.mutate({ id: s.id, s: "active" })
                              }
                              disabled={statusMutation.isPending}
                              title="Activate"
                              className="p-1.5 rounded-md text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-500/10 transition-colors"
                            >
                              <Play className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {isAdmin && s.status === "active" && (
                            <button
                              onClick={() =>
                                statusMutation.mutate({ id: s.id, s: "closed" })
                              }
                              disabled={statusMutation.isPending}
                              title="Close session"
                              className="p-1.5 rounded-md text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors"
                            >
                              <Square className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {isAdmin && s.status === "closed" && (
                            <button
                              onClick={() =>
                                statusMutation.mutate({ id: s.id, s: "active" })
                              }
                              disabled={statusMutation.isPending}
                              title="Reactivate"
                              className="p-1.5 rounded-md text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors"
                            >
                              <RotateCw className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Edit */}
                          {isAdmin && (
                            <button
                              onClick={() => setEditSession(s)}
                              title="Edit session"
                              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* View attendance */}
                          <Link
                            href={`/sessions/${s.id}/attendance`}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                            title="View attendance"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>

                          {/* Export PDF */}
                          <button
                            onClick={() => handleAttendanceExport(s.id, "pdf")}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                            title="Export PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
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

      {/* Modals */}
      {showCreate && (
        <CreateSessionModal onClose={() => setShowCreate(false)} />
      )}

      {editSession && (
        <EditSessionModal
          session={editSession}
          onClose={() => setEditSession(null)}
        />
      )}

      {showImport && (
        <ImportModal
          title="Import Exam Sessions"
          description="Upload an XLSX file. Each row creates a new scheduled session."
          templateHint={[
            "course_code",
            "programme_code",
            "level_name",
            "date",
            "start_time",
            "end_time",
            "venue",
            "expected_students",
          ]}
          onImport={(file) => coreApi.sessions.import(file)}
          onTemplate={(fmt) => coreApi.sessions.template(fmt)}
          onClose={() => setShowImport(false)}
          onSuccess={() => qc.invalidateQueries({ queryKey: ["sessions"] })}
        />
      )}
    </div>
  );
}
