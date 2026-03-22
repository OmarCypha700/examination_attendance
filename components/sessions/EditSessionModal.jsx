"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { coreApi } from "@/lib/api";
import { X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

const inputCls = cn(
  "w-full h-10 px-3 rounded-lg text-sm transition-colors duration-150",
  "bg-background border border-input",
  "text-foreground placeholder:text-muted-foreground",
  "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
  "disabled:opacity-40 disabled:cursor-not-allowed",
);

const Field = ({ label, children }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-medium text-muted-foreground">{label}</label>
    {children}
  </div>
);

/**
 * EditSessionModal
 *
 * Props:
 *  session  – the session row object from the list (must have .id)
 *  onClose  – () => void
 */
export function EditSessionModal({ session, onClose }) {
  const qc = useQueryClient();

  // Fetch the full session so we get the FK IDs (course, programme, level)
  const { data: full, isLoading: loadingSession } = useQuery({
    queryKey: ["session", session.id],
    queryFn: () => coreApi.sessions.get(session.id).then((r) => r.data),
  });

  const [form, setForm] = useState({
    course: "",
    programme: "",
    level: "",
    date: "",
    start_time: "",
    end_time: "",
    venue: "",
    expected_students: "",
  });

  // Once the full session arrives, populate the form
  useEffect(() => {
    if (!full) return;
    setForm({
      course:            String(full.course ?? ""),
      programme:         String(full.programme ?? ""),
      level:             String(full.level ?? ""),
      date:              full.date ?? "",
      start_time:        full.start_time?.slice(0, 5) ?? "",   // "HH:MM"
      end_time:          full.end_time?.slice(0, 5) ?? "",
      venue:             full.venue ?? "",
      expected_students: String(full.expected_students ?? ""),
    });
  }, [full]);

  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // Reference data
  const { data: programs } = useQuery({
    queryKey: ["programs"],
    queryFn: () => coreApi.programs.list().then((r) => r.data),
  });
  const { data: levels } = useQuery({
    queryKey: ["levels"],
    queryFn: () => coreApi.levels.list().then((r) => r.data),
  });
  const { data: courses } = useQuery({
    queryKey: ["courses", form.programme, form.level],
    queryFn: () =>
      coreApi.courses
        .list({ programme: form.programme, level: form.level })
        .then((r) => r.data),
    enabled: !!(form.programme && form.level),
  });

  const mutation = useMutation({
    mutationFn: (data) => coreApi.sessions.update(session.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sessions"] });
      qc.invalidateQueries({ queryKey: ["session", session.id] });
      toast.success("Session updated");
      onClose();
    },
    onError: (err) => {
      const detail = err?.response?.data;
      const msg =
        typeof detail === "string"
          ? detail
          : detail?.detail ??
            Object.values(detail ?? {})?.[0]?.[0] ??
            "Failed to update session.";
      toast.error(msg);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate({
      course:            Number(form.course),
      programme:         Number(form.programme),
      level:             Number(form.level),
      date:              form.date,
      start_time:        form.start_time,
      end_time:          form.end_time || null,
      venue:             form.venue,
      expected_students: Number(form.expected_students) || 0,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
      <div
        className="bg-card border border-border rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="font-semibold text-base text-foreground">
              Edit Session
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {session.course_code} · {session.course_title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Loading state */}
        {loadingSession ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Programme + Level */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Programme *">
                <select
                  value={form.programme}
                  onChange={(e) => {
                    upd("programme", e.target.value);
                    upd("course", "");
                  }}
                  required
                  className={cn(inputCls, "appearance-none")}
                >
                  <option value="">Select…</option>
                  {(programs ?? []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} – {p.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Level *">
                <select
                  value={form.level}
                  onChange={(e) => {
                    upd("level", e.target.value);
                    upd("course", "");
                  }}
                  required
                  className={cn(inputCls, "appearance-none")}
                >
                  <option value="">Select…</option>
                  {(levels ?? []).map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            {/* Course */}
            <Field label="Course *">
              <select
                value={form.course}
                onChange={(e) => upd("course", e.target.value)}
                required
                disabled={!form.programme || !form.level}
                className={cn(inputCls, "appearance-none")}
              >
                <option value="">
                  {form.programme && form.level
                    ? "Select course…"
                    : "Select programme & level first…"}
                </option>
                {(courses?.results ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.course_code} – {c.course_title}
                  </option>
                ))}
              </select>
            </Field>

            {/* Date */}
            <Field label="Date *">
              <input
                type="date"
                value={form.date}
                onChange={(e) => upd("date", e.target.value)}
                required
                className={inputCls}
              />
            </Field>

            {/* Times */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Start Time *">
                <input
                  type="time"
                  value={form.start_time}
                  onChange={(e) => upd("start_time", e.target.value)}
                  required
                  className={inputCls}
                />
              </Field>
              <Field label="End Time">
                <input
                  type="time"
                  value={form.end_time}
                  onChange={(e) => upd("end_time", e.target.value)}
                  className={inputCls}
                />
              </Field>
            </div>

            {/* Venue + Expected */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Venue">
                <input
                  value={form.venue}
                  onChange={(e) => upd("venue", e.target.value)}
                  placeholder="Main Hall"
                  className={inputCls}
                />
              </Field>
              <Field label="Expected Students">
                <input
                  type="number"
                  value={form.expected_students}
                  onChange={(e) => upd("expected_students", e.target.value)}
                  placeholder="0"
                  min={0}
                  className={inputCls}
                />
              </Field>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-10 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
              >
                {mutation.isPending && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                Save Changes
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}