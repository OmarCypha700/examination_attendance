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

const inputClasses =
  "w-full h-10 px-3 rounded-lg bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground/20 text-sm focus:outline-none focus:border-teal-500/40 transition-colors";

// ── Level Modal ─────────────────────────────────────────
function LevelModal({ level, onClose }) {
  const qc = useQueryClient();

  const [name, setName] = useState(level?.name ?? "");

  const mutation = useMutation({
    mutationFn: (data) =>
      level
        ? coreApi.levels.update(level.id, data)
        : coreApi.levels.create(data),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["levels"] });
      toast.success(level ? "Level updated" : "Level created");
      onClose();
    },

    onError: () => toast.error("Error saving level"),
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    mutation.mutate({
      name: name.trim(),
    });
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-bold text-lg text-foreground">
            {level ? "Edit Level" : "Add Level"}
          </h2>

          <button onClick={onClose}>
            <X className="w-5 h-5 text-muted-foreground hover:text-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-foreground">Level Name *</label>

            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Level 100"
              className={inputClasses}
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

              {level ? "Save Changes" : "Add Level"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────
export default function LevelsPage() {
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [exporting, setExporting] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const [modal, setModal] = useState({
    open: false,
    level: null,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["levels"],
    queryFn: () => coreApi.levels.list().then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => coreApi.levels.delete(id),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["levels"] });
      toast.success("Level deleted");
    },

    onError: () => toast.error("Delete failed"),
  });

  const handleExport = async () => {
    setExporting(true);

    try {
      await coreApi.levels.export();
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  const levels = data ?? [];

  const filteredLevels = levels.filter((l) =>
    l.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-4xl">
      {/* Header */}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Levels</h1>
          <p className="text-muted-foreground text-sm">{levels.length} levels</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Export */}

          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-1.5 px-3 h-9 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 text-xs font-medium transition-all"
          >
            <FileDown className="w-3.5 h-3.5" /> XLSX
          </button>

          {/* Import */}

          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-1.5 px-3 h-9 rounded-lg border border-primary/25 bg-primary/5 text-primary hover:bg-primary/10 text-xs font-medium transition-all"
          >
            <Upload className="w-3.5 h-3.5" /> Import
          </button>

          {/* Add */}

          <button
            onClick={() => setModal({ open: true, level: null })}
            className="flex items-center gap-2 px-4 h-9 rounded-lg bg-primary hover:bg-primary/40 text-primary-foreground font-semibold text-sm"
          >
            <Plus className="w-4 h-4" /> Add Level
          </button>
        </div>
      </div>

      {/* Search */}

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground" />

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search level..."
          className="w-full h-9 pl-9 rounded-lg bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground/20 text-sm focus:outline-none focus:border-teal-500/40 transition-colors"
        />
      </div>

      {/* Table */}

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : filteredLevels.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            No levels found.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-xs text-muted-foreground uppercase">
                  Level Name
                </th>

                <th className="px-4 py-3"></th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {filteredLevels.map((l) => (
                <tr key={l.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 text-foreground text-sm">{l.name}</td>

                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setModal({ open: true, level: l })}
                        className="p-1.5 text-foreground hover:text-muted-foreground transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Delete ${l.name}?`))
                            deleteMutation.mutate(l.id);
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
        <LevelModal
          level={modal.level}
          onClose={() =>
            setModal({
              open: false,
              level: null,
            })
          }
        />
      )}

      {showImport && (
        <ImportModal
          title="Import Levels"
          description="Upload an XLSX file to import levels."
          templateHint={["name"]}
          onImport={(file) => coreApi.levels.import(file)}
          onTemplate={() => coreApi.levels.template()}
          onClose={() => setShowImport(false)}
          onSuccess={() => qc.invalidateQueries({ queryKey: ["levels"] })}
        />
      )}
    </div>
  );
}
