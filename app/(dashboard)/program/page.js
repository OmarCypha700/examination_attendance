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
  FileDown,
  Upload,
} from "lucide-react";
import toast from "react-hot-toast";
import { ImportModal } from "@/components/ImportModal";

const inputCls =
  "w-full h-10 px-3 rounded-xl bg-navy-950 border border-white/10 text-white placeholder-white/20 text-sm focus:outline-none focus:border-teal-500/40 transition-colors";

// ── Program Modal ─────────────────────────────────────────
function ProgramModal({ program, onClose }) {
  const qc = useQueryClient();

  const [name, setName] = useState(program?.name ?? "");
  const [code, setCode] = useState(program?.code ?? "");

  const mutation = useMutation({
    mutationFn: (data) =>
      program
        ? coreApi.programs.update(program.id, data)
        : coreApi.programs.create(data),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["programs"] });
      toast.success(program ? "Program updated" : "Program created");
      onClose();
    },

    onError: () => toast.error("Error saving program"),
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    mutation.mutate({
      name: name.trim(),
    });
  };

  return (
    <div className="fixed inset-0 bg-navy-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-navy-800 border border-white/10 rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <h2 className="font-bold text-lg text-white">
            {program ? "Edit Program" : "Add Program"}
          </h2>

          <button onClick={onClose}>
            <X className="w-5 h-5 text-white/30 hover:text-white/70" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-white/40">Name *</label>

            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Registered General Nursing"
              className={inputCls}
            />
          </div>

            <div className="space-y-1.5">
            <label className="text-xs text-white/40">Code *</label>

            <input
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="RGN"
              className={inputCls}
            />
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

              {program ? "Save Changes" : "Add Program"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────
export default function ProgramPage() {
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [exporting, setExporting] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const [modal, setModal] = useState({
    open: false,
    program: null,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["programs"],
    queryFn: () => coreApi.programs.list().then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => coreApi.programs.delete(id),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["programs"] });
      toast.success("Program deleted");
    },

    onError: () => toast.error("Delete failed"),
  });

  const programs = data ?? [];

  const filteredPrograms = programs.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.code.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-4xl">
      {/* Header */}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Programs</h1>
          <p className="text-white/40 text-sm">{programs.length} programs</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setModal({ open: true, program: null })}
            className="flex items-center gap-2 px-4 h-9 rounded-xl bg-teal-500 hover:bg-teal-400 text-navy-950 font-semibold text-sm"
          >
            <Plus className="w-4 h-4" /> Add Program
          </button>
        </div>
      </div>

      {/* Search */}

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search program..."
          className="w-full h-10 pl-9 rounded-xl bg-navy-800 border border-white/10 text-white text-sm"
        />
      </div>

      {/* Table */}

      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 text-teal-400 animate-spin" />
          </div>
        ) : filteredPrograms.length === 0 ? (
          <div className="text-center py-16 text-white/25 text-sm">
            No programs found.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left px-4 py-3 text-xs text-white/30 uppercase">
                  Program Name
                </th>
                <th className="text-left px-4 py-3 text-xs text-white/30 uppercase">
                  Program Code
                </th>

                <th className="px-4 py-3"></th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/[0.04]">
              {filteredPrograms.map((p) => (
                <tr key={p.id} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-white/85 text-sm">{p.name}</td>

                  <td className="px-4 py-3 text-white/85 text-sm">{p.code}</td>

                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setModal({ open: true, program: p })}
                        className="p-1.5 text-white/40 hover:text-white"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Delete ${p.name}?`))
                            deleteMutation.mutate(p.id);
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

      {modal.open && (
        <ProgramModal
          program={modal.program}
          onClose={() =>
            setModal({
              open: false,
              program: null,
            })
          }
        />
      )}
    </div>
  );
}
