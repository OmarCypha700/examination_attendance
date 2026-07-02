"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { coreApi, getQRCodeUrl } from "@/lib/api";
import { generateStudentCard } from "@/lib/generateStudentCard";
import { generateBulkStudentCards } from "@/lib/generateBulkStudentCards";
import {
  Plus,
  Search,
  Loader2,
  Edit2,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  QrCode,
  Download,
  Upload,
  FileDown,
  CreditCard,
  Users,
  CheckCircle2,
  Ban,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  RotateCcw,
} from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { ImportModal } from "@/components/ImportModal";

const inputClasses =
  "w-full h-10 mt-1 px-3 rounded-lg bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground/20 text-sm focus:outline-none focus:border-teal-500/40 transition-colors";

// ── QR Code Modal ─────────────────────────────────────────────────────────────

function QRCodeModal({ student, onClose }) {
  const qrUrl = getQRCodeUrl(student.index_number, 260);
  const qrUrlLarge = getQRCodeUrl(student.index_number, 600);

  // ── plain QR download (unchanged) ────────────────────────────────────────
  const handleDownload = () => {
    const link = Object.assign(document.createElement("a"), {
      href: qrUrlLarge,
      download: `qr_${student.index_number}.png`,
      target: "_blank",
    });
    link.click();
  };

  // ── ID-card download ──────────────────────────────────────────────────────
  const [generatingCard, setGeneratingCard] = useState(false);

  const handleDownloadCard = async () => {
    setGeneratingCard(true);
    try {
      const dataUrl = await generateStudentCard(student, qrUrlLarge, {
        institutionName: "COLLEGE OF NURSING AND MIDWIFERY, TANOSO-AHAFO",
        contactPhone: "+233 XX XXX XXXX",
        contactEmail: "exams@institution.edu.gh",
      });

      const link = Object.assign(document.createElement("a"), {
        href: dataUrl,
        download: `exam_card_${student.index_number}.png`,
      });
      link.click();
      toast.success("Card downloaded!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate card. Please try again.");
    } finally {
      setGeneratingCard(false);
    }
  };

  return (
    <div
      className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="border border-border rounded-2xl w-full max-w-xs"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-bold text-base text-foreground">
            Student QR Code
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col items-center gap-4">
          {/* QR image */}
          <div className="bg-white p-3 rounded-2xl shadow-lg">
            <Image
              src={qrUrl}
              alt={`QR for ${student.index_number}`}
              width={200}
              height={200}
              className="block rounded-lg"
            />
          </div>

          {/* Student details */}
          <div className="text-center">
            <p className="font-mono font-bold text-primary text-sm tracking-wider">
              {student.index_number}
            </p>
            <p className="text-muted-foreground text-sm mt-0.5">
              {student.full_name}
            </p>
            <p className="text-muted-foreground text-xs mt-0.5">
              {student.programme_name} · {student.level_name}
            </p>
          </div>

          <p className="text-muted-foreground text-xs text-center">
            Encodes the student&apos;s index number. Point the scanner at it to
            record attendance.
          </p>

          {/* Action buttons */}
          <div className="w-full flex flex-col gap-2">
            {/* Download QR only */}
            <button
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 hover:bg-teal-500/20 text-sm font-medium transition-all"
            >
              <Download className="w-4 h-4" />
              Download QR Code
            </button>

            {/* Download printable ID card */}
            <button
              onClick={handleDownloadCard}
              disabled={generatingCard}
              className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generatingCard ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating card…
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  Download ID Card (54×85 mm)
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BulkExportModal({ progress, done, total, onCancel }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-sm p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Users className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-sm text-foreground">
              Generating Cards PDF
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Please wait — do not close this tab
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-200"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {done} of {total} students
            </span>
            <span>{pct}%</span>
          </div>
        </div>

        {/* Animated dots */}
        <p className="text-xs text-center text-muted-foreground animate-pulse">
          Rendering card {done + 1}…
        </p>

        {/* Cancel */}
        {/* <button
          onClick={onCancel}
          disabled={pct > 0}
          className="w-full h-9 rounded-xl border border-border text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
        >
          Cancel
        </button> */}
      </div>
    </div>
  );
}

// ── Student Modal ─────────────────────────────────────────────────────────────
function StudentModal({ student, programs, levels, onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    index_number: student?.index_number ?? "",
    full_name: student?.full_name ?? "",
    programme: student?.programme?.toString() ?? "",
    level: student?.level?.toString() ?? "",
  });
  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: (data) =>
      student
        ? coreApi.students.update(student.id, data)
        : coreApi.students.create(data),
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
          : (Object.values(detail ?? {})?.[0]?.[0] ?? "Error"),
      );
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate({
      index_number: form.index_number.trim(),
      full_name: form.full_name.trim(),
      programme: Number(form.programme),
      level: Number(form.level),
    });
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-bold text-lg text-foreground">
            {student ? "Edit Student" : "Add Student"}
          </h2>
          <button
            onClick={onClose}
            className="text-foreground hover:text-muted-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* <div className="grid grid-cols-2 gap-3"> */}
          <div className="space-y-1.5">
            <label className="text-xs text-foreground">Index Number *</label>
            <input
              value={form.index_number}
              onChange={(e) => upd("index_number", e.target.value)}
              required
              placeholder="2024/0001"
              className={inputClasses}
            />
          </div>
          {/* </div> */}
          <div className="space-y-1.5">
            <label className="text-xs text-foreground">Full Name *</label>
            <input
              value={form.full_name}
              onChange={(e) => upd("full_name", e.target.value)}
              required
              placeholder="John Doe"
              className={inputClasses}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-foreground">Programme *</label>
              <select
                value={form.programme}
                onChange={(e) => upd("programme", e.target.value)}
                required
                className={inputClasses + " appearance-none"}
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
              <label className="text-xs text-foreground">Level *</label>
              <select
                value={form.level}
                onChange={(e) => upd("level", e.target.value)}
                required
                className={inputClasses + " appearance-none"}
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
              className="flex-1 h-10 rounded-xl border border-border text-foreground hover:text-muted-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 h-10 rounded-xl bg-primary hover:opacity-90 disabled:opacity-50 text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 transition-all"
            >
              {mutation.isPending && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              {student ? "Save Changes" : "Add Student"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Sortable column header ──────────────────────────────────────────────────
function SortableTh({ field, ordering, onSort, children }) {
  const active = ordering === field || ordering === `-${field}`;
  const desc = ordering === `-${field}`;
  const Icon = !active ? ArrowUpDown : desc ? ArrowDown : ArrowUp;

  return (
    <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
      <button
        onClick={() => onSort(field)}
        className={cn(
          "flex items-center gap-1 hover:text-foreground transition-colors",
          active && "text-foreground",
        )}
      >
        {children}
        <Icon className="w-3 h-3" />
      </button>
    </th>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
const PAGE_SIZE_OPTIONS = [25, 50, 100, 200];
const SEARCH_DEBOUNCE_MS = 350;

const btnBase =
  "flex items-center gap-1.5 px-3 h-9 rounded-lg text-xs font-medium transition-all duration-150";

export default function StudentsPage() {
  const qc = useQueryClient();

  // searchInput updates on every keystroke; `search` is the debounced value
  // that actually drives the query, so we don't hit the API on every key press.
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [programme, setProgramme] = useState("");
  const [level, setLevel] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[1]);
  const [ordering, setOrdering] = useState("index_number");
  const [modal, setModal] = useState({ open: false, student: null });
  const [qrStudent, setQrStudent] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [bulkExporting, setBulkExporting] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0 });

  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [selectingAll, setSelectingAll] = useState(false);
  const headerCheckboxRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  const params = useMemo(() => {
    const p = { page, page_size: pageSize, ordering };
    if (search) p.search = search;
    if (programme) p.programme = programme;
    if (level) p.level = level;
    return p;
  }, [page, pageSize, ordering, search, programme, level]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["students", params],
    queryFn: () => coreApi.students.list(params).then((r) => r.data),
    keepPreviousData: true,
  });
  const { data: programs } = useQuery({
    queryKey: ["programs"],
    queryFn: () => coreApi.programs.list().then((r) => r.data),
  });
  const { data: levels } = useQuery({
    queryKey: ["levels"],
    queryFn: () => coreApi.levels.list().then((r) => r.data),
  });

  // Selection is scoped to the current filters/page — clear it whenever
  // any of those change so stale ids from a different view can't linger.
  useEffect(() => {
    setSelectedIds(new Set());
  }, [search, programme, level, page, pageSize, ordering]);

  const deleteMutation = useMutation({
    mutationFn: (id) => coreApi.students.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] });
      toast.success("Student removed");
    },
    onError: () => toast.error("Cannot delete student"),
  });

  const bulkActionMutation = useMutation({
    mutationFn: ({ action, ids }) => coreApi.students.bulkAction(action, ids),
    onSuccess: (res, variables) => {
      qc.invalidateQueries({ queryKey: ["students"] });
      const result = res?.data ?? res;
      if (variables.action === "delete") {
        const blockedCount = result.blocked?.length ?? 0;
        if (blockedCount) {
          toast.error(
            `Deleted ${result.deleted}. ${blockedCount} skipped — they have exam attendance records.`,
          );
        } else {
          toast.success(`Deleted ${result.deleted} student(s).`);
        }
      } else {
        toast.success(
          `${result.updated} student(s) ${variables.action === "activate" ? "activated" : "deactivated"}.`,
        );
      }
      setSelectedIds(new Set());
    },
    onError: () => toast.error("Bulk action failed. Please try again."),
  });

  const runBulkAction = (action) => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    if (
      action === "delete" &&
      !confirm(
        `Delete ${ids.length} selected student${ids.length > 1 ? "s" : ""}? This cannot be undone.`,
      )
    ) {
      return;
    }
    bulkActionMutation.mutate({ action, ids });
  };

  const toggleSort = (field) => {
    setOrdering((prev) => (prev === field ? `-${field}` : field));
    setPage(1);
  };

  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setProgramme("");
    setLevel("");
    setPage(1);
  };
  const filtersActive = Boolean(search || programme || level);

  const handleExport = async (fmt) => {
    setExporting(true);
    try {
      await coreApi.students.export(fmt);
    } catch {
      toast.error("Export failed.");
    } finally {
      setExporting(false);
    }
  };

  async function handleBulkCardExport() {
    // Fetch ALL students without pagination
    setBulkExporting(true);
    setBulkProgress({ done: 0, total: 0 });
    try {
      const allStudents = await coreApi.students
        .list({ page_size: 9999 })
        .then((r) => r.data.results);

      if (!allStudents.length) {
        toast.error("No students found to export.");
        return;
      }

      setBulkProgress({ done: 0, total: allStudents.length });

      await generateBulkStudentCards(allStudents, getQRCodeUrl, {
        institutionName: "COLLEGE OF NURSING AND MIDWIFERY, TANOSO-AHAFO",
        contactPhone: "+233 123 456 789",
        contactEmail: "exams@institution.edu.gh",
        filename: "student_exam_cards",
        onProgress: (done, total) => setBulkProgress({ done, total }),
      });

      toast.success(`PDF downloaded — ${allStudents.length} cards`);
    } catch (err) {
      console.error(err);
      toast.error("Bulk export failed. Please try again.");
    } finally {
      setBulkExporting(false);
      setBulkProgress({ done: 0, total: 0 });
    }
  }

  const students = data?.results ?? [];
  const programsList = programs ?? [];
  const levelsList = levels ?? [];
  const totalCount = data?.count ?? 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const pageIds = students.map((s) => s.id);
  const allOnPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const someOnPageSelected = pageIds.some((id) => selectedIds.has(id));

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate =
        someOnPageSelected && !allOnPageSelected;
    }
  }, [someOnPageSelected, allOnPageSelected]);

  const toggleSelectAllOnPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAllMatching = async () => {
    setSelectingAll(true);
    try {
      const { page: _p, page_size: _ps, ...filterParams } = params;
      const all = await coreApi.students
        .list({ ...filterParams, page_size: 9999 })
        .then((r) => r.data.results ?? r.data);
      setSelectedIds(new Set(all.map((s) => s.id)));
      toast.success(`Selected all ${all.length} matching students.`);
    } catch {
      toast.error("Could not select all matching students.");
    } finally {
      setSelectingAll(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-bold text-2xl text-foreground">Students</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {totalCount} registered
            {isFetching && !isLoading && (
              <Loader2 className="inline w-3 h-3 ml-2 animate-spin align-middle" />
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Export */}
          <div className="flex gap-1.5">
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
          </div>

          {/* Bulk card export */}
          <button
            onClick={handleBulkCardExport}
            disabled={bulkExporting}
            className={cn(
              btnBase,
              "border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 disabled:opacity-40",
            )}
          >
            <Users className="w-3.5 h-3.5" />
            Print All Cards
          </button>

          {/* Import */}
          <button
            onClick={() => setShowImport(true)}
            className={cn(
              btnBase,
              "border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10",
            )}
          >
            <Upload className="w-3.5 h-3.5" /> Import
          </button>

          {/* Add */}
          <button
            onClick={() => setModal({ open: true, student: null })}
            className={cn(
              btnBase,
              "px-4 bg-primary text-primary-foreground hover:opacity-90",
            )}
          >
            <Plus className="w-4 h-4" /> Add Student
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search name, index, programme…"
            className="w-full h-9 pl-9 pr-4 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <select
          value={programme}
          onChange={(e) => {
            setProgramme(e.target.value);
            setPage(1);
          }}
          className="h-9 px-4 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ring min-w-[140px]"
        >
          <option value="">All Programmes</option>
          {programsList.map((p) => (
            <option key={p.id} value={p.id}>
              {p.code}
            </option>
          ))}
        </select>
        <select
          value={level}
          onChange={(e) => {
            setLevel(e.target.value);
            setPage(1);
          }}
          className="h-9 px-4 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ring min-w-[140px]"
        >
          <option value="">All Levels</option>
          {levelsList.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>

        {filtersActive && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Clear filters
          </button>
        )}

        <div className="ml-auto flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Rows</label>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="h-9 px-3 rounded-lg bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between gap-3 flex-wrap px-4 py-3 rounded-xl border border-primary/30 bg-primary/5">
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-sm font-medium text-foreground">
              {selectedIds.size} selected
            </p>
            {allOnPageSelected && totalCount > pageIds.length && (
              <button
                onClick={selectAllMatching}
                disabled={selectingAll}
                className="text-xs text-primary hover:underline disabled:opacity-50"
              >
                {selectingAll
                  ? "Selecting…"
                  : `Select all ${totalCount} matching students`}
              </button>
            )}
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear selection
            </button>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => runBulkAction("activate")}
              disabled={bulkActionMutation.isPending}
              className={cn(
                btnBase,
                "border border-teal-500/30 bg-teal-500/10 text-teal-500 hover:bg-teal-500/20 disabled:opacity-40",
              )}
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Activate
            </button>
            <button
              onClick={() => runBulkAction("deactivate")}
              disabled={bulkActionMutation.isPending}
              className={cn(
                btnBase,
                "border border-border text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-40",
              )}
            >
              <Ban className="w-3.5 h-3.5" /> Deactivate
            </button>
            <button
              onClick={() => runBulkAction("delete")}
              disabled={bulkActionMutation.isPending}
              className={cn(
                btnBase,
                "border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 disabled:opacity-40",
              )}
            >
              {bulkActionMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            No students found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="p-3 w-10">
                    <input
                      ref={headerCheckboxRef}
                      type="checkbox"
                      checked={allOnPageSelected}
                      onChange={toggleSelectAllOnPage}
                      className="w-4 h-4 rounded accent-primary cursor-pointer"
                      aria-label="Select all students on this page"
                    />
                  </th>
                  <SortableTh field="index_number" ordering={ordering} onSort={toggleSort}>
                    Index
                  </SortableTh>
                  <SortableTh field="full_name" ordering={ordering} onSort={toggleSort}>
                    Name
                  </SortableTh>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                    Programme
                  </th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                    Level
                  </th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                    Status
                  </th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {students.map((s) => (
                  <tr
                    key={s.id}
                    className={cn(
                      "hover:bg-accent/40 transition-colors",
                      selectedIds.has(s.id) && "bg-primary/5",
                    )}
                  >
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(s.id)}
                        onChange={() => toggleSelectOne(s.id)}
                        className="w-4 h-4 rounded accent-primary cursor-pointer"
                        aria-label={`Select ${s.full_name}`}
                      />
                    </td>
                    <td className="font-mono text-primary text-xs font-medium p-2">
                      {s.index_number}
                    </td>
                    <td className="text-foreground text-xs p-2">
                      {s.full_name}
                    </td>
                    <td className="text-foreground text-xs p-2">
                      {s.programme_name}
                    </td>
                    <td className="text-foreground text-xs p-2">
                      {s.level_name}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase border",
                          s.is_active
                            ? "bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-500/20"
                            : "bg-white/5 text-white/25 border-white/10",
                        )}
                      >
                        {s.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setQrStudent(s)}
                          title="View QR Code"
                          className="p-1.5 rounded-md text-teal-400 hover:text-teal-400 hover:bg-teal-500/5 transition-colors"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setModal({ open: true, student: s })}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Remove ${s.full_name}?`))
                              deleteMutation.mutate(s.id);
                          }}
                          className="p-1.5 rounded-md text-rose-400 hover:text-rose-400 hover:bg-rose-500/5 transition-colors"
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
          <p className="text-xs text-primary">
            Page {page} of {totalPages} · {totalCount} total
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-border text-primary hover:text-foreground disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-border text-primary hover:text-foreground disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {modal.open && (
        <StudentModal
          student={modal.student}
          programs={programsList}
          levels={levelsList}
          onClose={() => setModal({ open: false, student: null })}
        />
      )}
      {qrStudent && (
        <QRCodeModal student={qrStudent} onClose={() => setQrStudent(null)} />
      )}

      {showImport && (
        <ImportModal
          title="Import Students"
          description="Upload a CSV or XLSX file. Existing students will be updated by index number."
          templateHint={[
            "index_number",
            "full_name",
            "programme_code",
            "level_name",
          ]}
          onImport={(file) => coreApi.students.import(file)}
          onTemplate={(fmt) => coreApi.students.template(fmt)}
          onClose={() => setShowImport(false)}
          onSuccess={() => qc.invalidateQueries({ queryKey: ["students"] })}
        />
      )}

      {bulkExporting && (
        <BulkExportModal
          done={bulkProgress.done}
          total={bulkProgress.total}
          onCancel={() => setBulkExporting(false)}
        />
      )}
    </div>
  );
}