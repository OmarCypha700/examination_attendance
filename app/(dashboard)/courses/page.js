"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { coreApi } from "@/lib/api";
import {
  Plus,
  Search,
  Loader2,
  Edit2,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  FileDown,
  Upload,
} from "lucide-react";
import toast from "react-hot-toast";
import { ImportModal } from "@/components/ImportModal";


const inputCls =
  "w-full h-10 px-3 rounded-xl bg-navy-950 border border-white/10 text-white placeholder-white/20 text-sm focus:outline-none focus:border-teal-500/40 transition-colors";

// ── Course Modal ─────────────────────────────────────────
function CourseModal({ course, programs, levels, onClose }) {
  const qc = useQueryClient();

  const [form, setForm] = useState({
    course_code: course?.course_code ?? "",
    course_title: course?.course_title ?? "",
    programme: course?.programme?.toString() ?? "",
    level: course?.level?.toString() ?? "",
  });

  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: (data) =>
      course
        ? coreApi.courses.update(course.id, data)
        : coreApi.courses.create(data),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["courses"] });
      toast.success(course ? "Course updated" : "Course created");
      onClose();
    },

    onError: () => toast.error("Error saving course"),
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    mutation.mutate({
      course_code: form.course_code.trim(),
      course_title: form.course_title.trim(),
      programme: Number(form.programme),
      level: Number(form.level),
    });
  };

  return (
    <div className="fixed inset-0 bg-navy-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-navy-800 border border-white/10 rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <h2 className="font-bold text-lg text-white">
            {course ? "Edit Course" : "Add Course"}
          </h2>

          <button onClick={onClose}>
            <X className="w-5 h-5 text-white/30 hover:text-white/70" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-white/40">Course Code *</label>
            <input
              required
              value={form.course_code}
              onChange={(e) => upd("course_code", e.target.value)}
              placeholder="NUR101"
              className={inputCls}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-white/40">Course Title *</label>
            <input
              required
              value={form.course_title}
              onChange={(e) => upd("course_title", e.target.value)}
              placeholder="Anatomy and Physiology"
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-white/40">Programme *</label>
              <select
                required
                value={form.programme}
                onChange={(e) => upd("programme", e.target.value)}
                className={inputCls + " appearance-none"}
              >
                <option value="">Select…</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-white/40">Level *</label>
              <select
                required
                value={form.level}
                onChange={(e) => upd("level", e.target.value)}
                className={inputCls + " appearance-none"}
              >
                <option value="">Select…</option>
                {levels.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 rounded-xl border border-white/10 text-white/50 hover:text-white/80 text-sm"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 h-10 rounded-xl bg-teal-500 hover:bg-teal-400 text-navy-950 font-semibold text-sm flex items-center justify-center gap-2"
            >
              {mutation.isPending && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              {course ? "Save Changes" : "Add Course"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────
const PAGE_SIZE = 50;

export default function CoursesPage() {
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [programme, setProgramme] = useState("");
  const [level, setLevel] = useState("");
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const [modal, setModal] = useState({ open: false, course: null });

  const params = { page, page_size: PAGE_SIZE };

  if (search) params.search = search;
  if (programme) params.programme = programme;
  if (level) params.level = level;

  const { data, isLoading } = useQuery({
    queryKey: ["courses", params],
    queryFn: () => coreApi.courses.list(params).then((r) => r.data),
  });

  const { data: programs } = useQuery({
    queryKey: ["programs"],
    queryFn: () => coreApi.programs.list().then((r) => r.data),
  });

  const { data: levels } = useQuery({
    queryKey: ["levels"],
    queryFn: () => coreApi.levels.list().then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => coreApi.courses.delete(id),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["courses"] });
      toast.success("Course deleted");
    },

    onError: () => toast.error("Delete failed"),
  });

  const handleExport = async (fmt) => {
    setExporting(true);
    try {
      await coreApi.courses.export(fmt);
    } catch {
      toast.error("Export failed.");
    } finally {
      setExporting(false);
    }
  };

  const courses = data?.results ?? [];
  const totalPages = Math.ceil((data?.count ?? 0) / PAGE_SIZE);

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Courses</h1>
          <p className="text-white/40 text-sm">{data?.count ?? 0} courses</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Export */}
          <div className="flex gap-1.5">
            <button
              onClick={() => handleExport("xlsx")}
              disabled={exporting}
              className="flex items-center gap-1.5 px-3 h-9 rounded-xl border border-white/10 text-white/50 hover:text-white/80 hover:bg-white/5 text-xs font-medium transition-all disabled:opacity-40"
            >
              <FileDown className="w-3.5 h-3.5" /> XLSX
            </button>
          </div>

          {/* Import */}
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-1.5 px-3 h-9 rounded-xl border border-teal-500/25 bg-teal-500/5 text-teal-400 hover:bg-teal-500/10 text-xs font-medium transition-all"
          >
            <Upload className="w-3.5 h-3.5" /> Import
          </button>

          <button
            onClick={() => setModal({ open: true, course: null })}
            className="flex items-center gap-2 px-4 h-9 rounded-xl bg-teal-500 hover:bg-teal-400 text-navy-950 font-semibold text-sm"
          >
            <Plus className="w-4 h-4" /> Add Course
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search course..."
            className="w-full h-10 pl-9 rounded-xl bg-navy-800 border border-white/10 text-white text-sm"
          />
        </div>

        <select
          value={programme}
          onChange={(e) => setProgramme(e.target.value)}
          className="h-10 px-3 rounded-xl bg-navy-800 border border-white/10 text-white/70 text-sm"
        >
          <option value="">All Programmes</option>
          {programs?.map((p) => (
            <option key={p.id} value={p.id}>
              {p.code}
            </option>
          ))}
        </select>

        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className="h-10 px-3 rounded-xl bg-navy-800 border border-white/10 text-white/70 text-sm"
        >
          <option value="">All Levels</option>
          {levels?.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 text-teal-400 animate-spin" />
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-16 text-white/25 text-sm">
            No courses found.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {["Code", "Title", "Programme", "Level", ""].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-xs text-white/30 uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-white/[0.04]">
              {courses.map((c) => (
                <tr key={c.id} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-mono text-teal-400 text-xs">
                    {c.course_code}
                  </td>

                  <td className="px-4 py-3 text-white/85 text-xs">
                    {c.course_title}
                  </td>

                  <td className="px-4 py-3 text-white/50 text-xs">
                    {c.programme_name}
                  </td>

                  <td className="px-4 py-3 text-white/50 text-xs">
                    {c.level_name}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setModal({ open: true, course: c })}
                        className="p-1.5 text-white/40 hover:text-white"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Delete ${c.course_code}?`))
                            deleteMutation.mutate(c.id);
                        }}
                        className="p-1.5 text-rose-400/40 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}

      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <p className="text-xs text-white/30">
            Page {page} of {totalPages}
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="w-4 h-4 text-white/40" />
            </button>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="w-4 h-4 text-white/40" />
            </button>
          </div>
        </div>
      )}

      {modal.open && (
        <CourseModal
          course={modal.course}
          programs={programs ?? []}
          levels={levels ?? []}
          onClose={() => setModal({ open: false, course: null })}
        />
      )}

      {showImport && (
        <ImportModal
          title="Import Courses"
          description="Upload an XLSX file. Existing courses will be updated by course code."
          templateHint={[
            "course_code",
            "course_title",
            "programme_code",
            "level_name",
          ]}
          onImport={(file) => coreApi.courses.import(file)}
          onTemplate={() => coreApi.courses.template()}
          onClose={() => setShowImport(false)}
          onSuccess={() => qc.invalidateQueries({ queryKey: ["courses"] })}
        />
      )}
    </div>
  );
}
