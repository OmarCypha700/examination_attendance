"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { coreApi } from "@/lib/api";
import { Plus, Search, Loader2, Edit2, Trash2, X, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

const inputCls =
  "w-full h-10 px-3 rounded-xl bg-navy-950 border border-white/10 text-white placeholder-white/20 text-sm focus:outline-none focus:border-teal-500/40 transition-colors";

// ── Student Modal ──────────────────────────────────────────────────────────────
function StudentModal({ student, programs, levels, onClose }) {
  const qc = useQueryClient();

  const [form, setForm] = useState({
    index_number: student?.index_number ?? "",
    full_name:    student?.full_name    ?? "",
    programme:    student?.programme?.toString() ?? "",
    level:        student?.level?.toString()     ?? "",
    gender:       student?.gender ?? "",
    qr_code:      "",
  });

  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: (data) =>
      student ? coreApi.students.update(student.id, data) : coreApi.students.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] });
      toast.success(student ? "Student updated" : "Student created");
      onClose();
    },
    onError: (err) => {
      const detail = err?.response?.data;
      toast.error(
        typeof detail === "string"
          ? detail
          : Object.values(detail ?? {})?.[0]?.[0] ?? "Error"
      );
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      index_number: form.index_number.trim(),
      full_name:    form.full_name.trim(),
      programme:    Number(form.programme),
      level:        Number(form.level),
      gender:       form.gender,
    };
    if (!student) {
      payload.qr_code = form.qr_code.trim() || form.index_number.trim();
    }
    mutation.mutate(payload);
  };

  return (
    <div className="fixed inset-0 bg-navy-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-navy-800 border border-white/10 rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <h2 className="font-bold text-lg text-white">{student ? "Edit Student" : "Add Student"}</h2>
          <button onClick={onClose} className="text-white/30 hover:text-white/70 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-white/40">Index Number *</label>
              <input
                value={form.index_number}
                onChange={(e) => upd("index_number", e.target.value)}
                required
                placeholder="2024/0001"
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-white/40">Gender</label>
              <select value={form.gender} onChange={(e) => upd("gender", e.target.value)} className={inputCls + " appearance-none"}>
                <option value="">—</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-white/40">Full Name *</label>
            <input
              value={form.full_name}
              onChange={(e) => upd("full_name", e.target.value)}
              required
              placeholder="John Doe"
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-white/40">Programme *</label>
              <select value={form.programme} onChange={(e) => upd("programme", e.target.value)} required className={inputCls + " appearance-none"}>
                <option value="">Select…</option>
                {programs.map((p) => <option key={p.id} value={p.id}>{p.code}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-white/40">Level *</label>
              <select value={form.level} onChange={(e) => upd("level", e.target.value)} required className={inputCls + " appearance-none"}>
                <option value="">Select…</option>
                {levels.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
          </div>

          {!student && (
            <div className="space-y-1.5">
              <label className="text-xs text-white/40">QR Code value <span className="text-white/25">(defaults to index number)</span></label>
              <input
                value={form.qr_code}
                onChange={(e) => upd("qr_code", e.target.value)}
                placeholder={form.index_number || "Leave blank to use index number"}
                className={inputCls}
              />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 h-10 rounded-xl border border-white/10 text-white/50 hover:text-white/80 text-sm transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={mutation.isPending} className="flex-1 h-10 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-navy-950 font-semibold text-sm flex items-center justify-center gap-2 transition-all">
              {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {student ? "Save Changes" : "Add Student"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
const PAGE_SIZE = 50;

export default function StudentsPage() {
  const qc = useQueryClient();

  const [search,    setSearch]    = useState("");
  const [programme, setProgramme] = useState("");
  const [level,     setLevel]     = useState("");
  const [page,      setPage]      = useState(1);
  const [modal,     setModal]     = useState({ open: false, student: null });

  const params = { page, page_size: PAGE_SIZE };
  if (search)    params.search    = search;
  if (programme) params.programme = programme;
  if (level)     params.level     = level;

  const { data, isLoading } = useQuery({
    queryKey: ["students", params],
    queryFn:  () => coreApi.students.list(params).then((r) => r.data),
  });

  const { data: programs } = useQuery({
    queryKey: ["programs"],
    queryFn:  () => coreApi.programs.list().then((r) => r.data),
  });

  const { data: levels } = useQuery({
    queryKey: ["levels"],
    queryFn:  () => coreApi.levels.list().then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => coreApi.students.delete(id),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ["students"] }); toast.success("Student removed"); },
    onError:    () => toast.error("Cannot delete student"),
  });

  const students     = data?.results ?? [];
  const programsList = programs ?? [];
  const levelsList   = levels   ?? [];
  const totalPages   = Math.ceil((data?.count ?? 0) / PAGE_SIZE);

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl text-white">Students</h1>
          <p className="text-white/40 text-sm mt-1">{data?.count ?? 0} registered</p>
        </div>
        <button
          onClick={() => setModal({ open: true, student: null })}
          className="flex items-center gap-2 px-4 h-10 rounded-xl bg-teal-500 hover:bg-teal-400 text-navy-950 font-semibold text-sm transition-all shadow-[0_0_20px_rgba(45,212,191,0.2)]"
        >
          <Plus className="w-4 h-4" /> Add Student
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search name or index…"
            className="w-full h-10 pl-9 pr-4 rounded-xl bg-navy-800 border border-white/10 text-white placeholder-white/25 text-sm focus:outline-none focus:border-teal-500/40"
          />
        </div>

        <select
          value={programme}
          onChange={(e) => { setProgramme(e.target.value); setPage(1); }}
          className="h-10 px-3 rounded-xl bg-navy-800 border border-white/10 text-white/70 text-sm focus:outline-none focus:border-teal-500/40 appearance-none min-w-[140px]"
        >
          <option value="">All Programmes</option>
          {programsList.map((p) => <option key={p.id} value={p.id}>{p.code}</option>)}
        </select>

        <select
          value={level}
          onChange={(e) => { setLevel(e.target.value); setPage(1); }}
          className="h-10 px-3 rounded-xl bg-navy-800 border border-white/10 text-white/70 text-sm focus:outline-none focus:border-teal-500/40 appearance-none min-w-[120px]"
        >
          <option value="">All Levels</option>
          {levelsList.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-teal-400 animate-spin" />
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-16 text-white/25 text-sm">No students found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {["Index", "Name", "Programme", "Level", "Gender", "Status", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-white/30 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 font-mono text-teal-400 text-xs">{s.index_number}</td>
                    <td className="px-4 py-3 font-medium text-white/85 text-xs">{s.full_name}</td>
                    <td className="px-4 py-3 text-white/50 text-xs">{s.programme_name}</td>
                    <td className="px-4 py-3 text-white/50 text-xs">{s.level_name}</td>
                    <td className="px-4 py-3 text-white/40 text-xs">
                      {s.gender === "M" ? "Male" : s.gender === "F" ? "Female" : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase border",
                        s.is_active
                          ? "bg-teal-500/10 text-teal-400 border-teal-500/20"
                          : "bg-white/5 text-white/25 border-white/10"
                      )}>
                        {s.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setModal({ open: true, student: s })}
                          className="p-1.5 rounded-lg text-white/30 hover:text-white/80 hover:bg-white/5 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Remove ${s.full_name}?`)) deleteMutation.mutate(s.id);
                          }}
                          className="p-1.5 rounded-lg text-rose-400/30 hover:text-rose-400 hover:bg-rose-500/5 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-white/30">
            Page {page} of {totalPages} · {data?.count} total
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-white/10 text-white/40 hover:text-white/80 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-white/10 text-white/40 hover:text-white/80 disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {modal.open && (
        <StudentModal
          student={modal.student}
          programs={programsList}
          levels={levelsList}
          onClose={() => setModal({ open: false, student: null })}
        />
      )}
    </div>
  );
}
