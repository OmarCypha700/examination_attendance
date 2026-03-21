"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { coreApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import {
  ArrowLeft, Download, Search, Loader2,
  CheckCircle2, AlertTriangle, XCircle, Users,
} from "lucide-react";
import Link from "next/link";
import { formatDate, formatTime, formatDateTime, cn } from "@/lib/utils";
import toast from "react-hot-toast";

const SECTION_FILTERS = ["all", "A", "B"];
const STATUS_FILTERS  = ["all", "present", "duplicate", "invalid"];

function StatusBadge({ status }) {
  const map = {
    present:   "bg-teal-500/10 text-teal-400 border-teal-500/20",
    duplicate: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    invalid:   "bg-rose-500/10 text-rose-400 border-rose-500/20",
  };
  const Icon = { present: CheckCircle2, duplicate: AlertTriangle, invalid: XCircle }[status] ?? CheckCircle2;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-semibold uppercase ${map[status] ?? map.present}`}>
      <Icon className="w-2.5 h-2.5" />{status}
    </span>
  );
}

function SummaryCard({ label, value, color }) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 text-center">
      <p className={`font-bold text-2xl ${color}`}>{value}</p>
      <p className="text-white/40 text-xs mt-1">{label}</p>
    </div>
  );
}

export default function AttendancePage() {
  const { id }   = useParams();
  const router   = useRouter();

  const [section,    setSection]    = useState("all");
  const [statusFilt, setStatusFilt] = useState("all");
  const [search,     setSearch]     = useState("");

  const { data: session } = useQuery({
    queryKey: ["session", id],
    queryFn:  () => coreApi.sessions.get(id).then((r) => r.data),
  });

  const attendanceParams = {};
  if (section !== "all")    attendanceParams.section = section;
  if (statusFilt !== "all") attendanceParams.status  = statusFilt;
  if (search)               attendanceParams.search  = search;

  const { data: attendanceData, isLoading } = useQuery({
    queryKey:        ["attendance", id, attendanceParams],
    queryFn:         () => coreApi.sessions.attendance(id, attendanceParams).then((r) => r.data),
    refetchInterval: session?.status === "active" ? 10_000 : false,
  });

  const records = attendanceData?.results ?? [];
  const summary = session?.attendance_summary;

  // Authenticated exports — token sent via axios interceptor
  const handleExport = async (fmt, sectionFilter = "") => {
    try { await coreApi.sessions.exportAttendance(id, fmt, sectionFilter); }
    catch { toast.error("Export failed. Please try again."); }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl">
      {/* Back + Header */}
      <div>
        <button onClick={() => router.back()} className="flex items-center gap-2 text-white/40 hover:text-white/70 text-sm mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to sessions
        </button>

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="font-bold text-2xl text-white">{session?.course_code ?? "—"}</h1>
              {session && (
                <span className={cn("px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase",
                  session.status === "active"    ? "bg-teal-500/10 text-teal-400 border-teal-500/20"
                  : session.status === "scheduled" ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  : "bg-white/5 text-white/30 border-white/10"
                )}>{session.status}</span>
              )}
            </div>
            <p className="text-white/40 text-sm">{session?.course_title}</p>
            <p className="text-white/25 text-xs mt-1">
              {session?.programme_name} · {session?.level_name} · {formatDate(session?.date)}
              {session?.start_time ? ` · ${formatTime(session.start_time)}` : ""}
            </p>
          </div>

          {/* Authenticated export buttons */}
          <div className="flex gap-2 flex-wrap">
            {/* <button
              onClick={() => handleExport("csv")}
              className="flex items-center gap-2 px-3 h-9 rounded-xl bg-white/[0.04] border border-white/10 text-white/60 hover:text-white/90 hover:bg-white/[0.08] text-xs font-medium transition-all"
            >
              <Download className="w-3.5 h-3.5" /> CSV
            </button> */}
            <button
              onClick={() => handleExport("pdf")}
              className="flex items-center gap-2 px-3 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 hover:bg-teal-500/20 text-xs font-medium transition-all"
            >
              <Download className="w-3.5 h-3.5" /> PDF
            </button>
          </div>
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <SummaryCard label="Total"     value={summary.total}     color="text-white" />
          <SummaryCard label="Section A" value={summary.section_a} color="text-sky-400" />
          <SummaryCard label="Section B" value={summary.section_b} color="text-violet-400" />
          <SummaryCard label="Present"   value={summary.present}   color="text-teal-400" />
          <SummaryCard label="Duplicate" value={summary.duplicate} color="text-amber-400" />
          <SummaryCard label="Invalid"   value={summary.invalid}   color="text-rose-400" />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or index…" className="w-full h-10 pl-9 pr-4 rounded-xl bg-navy-800 border border-white/10 text-white placeholder-white/25 text-sm focus:outline-none focus:border-teal-500/40" />
        </div>
        <div className="flex gap-1 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1">
          {SECTION_FILTERS.map((f) => (
            <button key={f} onClick={() => setSection(f)} className={cn("px-3 h-8 rounded-lg text-xs font-medium transition-all", section === f ? "bg-sky-500/10 text-sky-400 border border-sky-500/20" : "text-white/40 hover:text-white/70")}>
              {f === "all" ? "All" : `Sec. ${f}`}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1">
          {STATUS_FILTERS.map((f) => (
            <button key={f} onClick={() => setStatusFilt(f)} className={cn("px-3 h-8 rounded-lg text-xs font-medium capitalize transition-all", statusFilt === f ? "bg-teal-500/10 text-teal-400 border border-teal-500/20" : "text-white/40 hover:text-white/70")}>{f}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 text-teal-400 animate-spin" /></div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-white/25">
            <Users className="w-8 h-8 opacity-30" />
            <p className="text-sm">No attendance records yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {["#", "Index", "Name", "Programme", "Gender", "Section", "Scan Time", "Status", "Scanned By"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-white/30 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {records.map((r, i) => (
                  <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 text-white/20 text-xs font-mono">{i + 1}</td>
                    <td className="px-4 py-3 font-mono text-teal-400 text-xs">{r.index_number}</td>
                    <td className="px-4 py-3 text-white/80 font-medium text-xs">{r.student_name}</td>
                    <td className="px-4 py-3 text-white/40 text-xs">{r.student_programme_name ?? "—"}</td>
                    <td className="px-4 py-3 text-white/40 text-xs">{r.student_gender ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-bold uppercase", r.section === "A" ? "bg-sky-500/10 text-sky-400" : "bg-violet-500/10 text-violet-400")}>Sec. {r.section}</span>
                    </td>
                    <td className="px-4 py-3 text-white/40 text-xs whitespace-nowrap">{formatDateTime(r.scan_time)}</td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-3 text-white/30 text-xs">{r.scanned_by_username}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {attendanceData?.count > records.length && (
        <p className="text-center text-white/25 text-xs">Showing {records.length} of {attendanceData.count} records.</p>
      )}
    </div>
  );
}