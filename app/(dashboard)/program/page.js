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
  "w-full h-10 px-3 rounded-lg bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground/20 text-sm focus:outline-none focus:border-teal-500/40 transition-colors";

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
      code: code.trim(),
    });
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-bold text-lg text-foreground">
            {program ? "Edit Program" : "Add Program"}
          </h2>

          <button onClick={onClose}>
            <X className="w-5 h-5 text-muted-foreground hover:text-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-foreground">Name *</label>

            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Registered General Nursing"
              className={inputCls}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-foreground">Code *</label>

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
              className="flex-1 h-10 rounded-lg border border-border text-foreground hover:text-muted-foreground transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 h-10 rounded-lg bg-primary hover:bg-primary/40 text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2"
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

  const filteredPrograms = programs.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-4xl">
      {/* Header */}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Programs</h1>
          <p className="text-muted-foreground text-sm">
            {programs.length} programs
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setModal({ open: true, program: null })}
            className="flex items-center gap-2 px-4 h-9 rounded-lg bg-primary hover:bg-primary/40 text-primary-foreground font-semibold text-sm"
          >
            <Plus className="w-4 h-4" /> Add Program
          </button>
        </div>
      </div>

      {/* Search */}

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search program..."
          className="w-full h-10 pl-9 rounded-lg bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground/20 text-sm focus:outline-none focus:border-teal-500/40 transition-colors"
        />
      </div>

      {/* Table */}

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : filteredPrograms.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            No programs found.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-xs text-muted-foreground uppercase">
                  Program Name
                </th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground uppercase">
                  Program Code
                </th>

                <th className="px-4 py-3"></th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {filteredPrograms.map((p) => (
                <tr key={p.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3 text-foreground text-sm">
                    {p.name}
                  </td>

                  <td className="px-4 py-3 text-foreground text-sm">
                    {p.code}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setModal({ open: true, program: p })}
                        className="p-1.5 text-muted-foreground hover:text-foreground"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Delete ${p.name}?`))
                            deleteMutation.mutate(p.id);
                        }}
                        className="p-1.5 text-rose-400 hover:text-rose-400/40 transition-colors"
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
