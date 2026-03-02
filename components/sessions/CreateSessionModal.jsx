"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { coreApi } from "@/lib/api";
import { X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const inputCls =
  "w-full h-10 px-3 rounded-xl bg-navy-950 border border-white/10 text-white placeholder-white/20 text-sm focus:outline-none focus:border-teal-500/40 transition-colors";

export function CreateSessionModal({ onClose }) {
  const qc = useQueryClient();

  const [form, setForm] = useState({
    course: "", programme: "", level: "",
    date: "", start_time: "", end_time: "",
    venue: "", expected_students: "",
  });

  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const { data: programs } = useQuery({
    queryKey: ["programs"],
    queryFn:  () => coreApi.programs.list().then((r) => r.data),
  });
  const { data: levels } = useQuery({
    queryKey: ["levels"],
    queryFn:  () => coreApi.levels.list().then((r) => r.data),
  });
  const { data: courses } = useQuery({
    queryKey: ["courses", form.programme, form.level],
    queryFn:  () => coreApi.courses.list({ programme: form.programme, level: form.level }).then((r) => r.data),
    enabled:  !!(form.programme && form.level),
  });

  const mutation = useMutation({
    mutationFn: (data) => coreApi.sessions.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sessions"] });
      toast.success("Session created!");
      onClose();
    },
    onError: (err) => {
      const detail = err?.response?.data;
      const msg = typeof detail === "string"
        ? detail
        : detail?.detail ?? Object.values(detail ?? {})?.[0]?.[0] ?? "Failed to create session.";
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

  const programsList = programs ?? [];
  const levelsList   = levels ?? [];
  const coursesList  = courses?.results ?? [];

  return (
    <div className="fixed inset-0 bg-navy-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className="bg-navy-800 border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <h2 className="font-bold text-lg text-white">New Exam Session</h2>
          <button onClick={onClose} className="text-white/30 hover:text-white/70 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Programme + Level */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-white/40">Programme *</label>
              <select
                value={form.programme}
                onChange={(e) => { upd("programme", e.target.value); upd("course", ""); }}
                required
                className={inputCls + " appearance-none"}
              >
                <option value="">Select…</option>
                {programsList.map((p) => (
                  <option key={p.id} value={p.id}>{p.code} – {p.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-white/40">Level *</label>
              <select
                value={form.level}
                onChange={(e) => { upd("level", e.target.value); upd("course", ""); }}
                required
                className={inputCls + " appearance-none"}
              >
                <option value="">Select…</option>
                {levelsList.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Course */}
          <div className="space-y-1.5">
            <label className="text-xs text-white/40">Course *</label>
            <select
              value={form.course}
              onChange={(e) => upd("course", e.target.value)}
              required
              disabled={!form.programme || !form.level}
              className={inputCls + " appearance-none disabled:opacity-40"}
            >
              <option value="">
                {form.programme && form.level ? "Select course…" : "Select programme & level first…"}
              </option>
              {coursesList.map((c) => (
                <option key={c.id} value={c.id}>{c.course_code} – {c.course_title}</option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <label className="text-xs text-white/40">Date *</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => upd("date", e.target.value)}
              required
              className={inputCls}
            />
          </div>

          {/* Times */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-white/40">Start Time *</label>
              <input
                type="time"
                value={form.start_time}
                onChange={(e) => upd("start_time", e.target.value)}
                required
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-white/40">End Time</label>
              <input
                type="time"
                value={form.end_time}
                onChange={(e) => upd("end_time", e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          {/* Venue + Expected */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-white/40">Venue</label>
              <input
                value={form.venue}
                onChange={(e) => upd("venue", e.target.value)}
                placeholder="Main Hall"
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-white/40">Expected Students</label>
              <input
                type="number"
                value={form.expected_students}
                onChange={(e) => upd("expected_students", e.target.value)}
                placeholder="0"
                min={0}
                className={inputCls}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 rounded-xl border border-white/10 text-white/50 hover:text-white/80 text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 h-10 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-navy-950 font-semibold text-sm flex items-center justify-center gap-2 transition-all"
            >
              {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Session
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
