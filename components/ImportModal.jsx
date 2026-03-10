"use client";

import { useRef, useState } from "react";
import { X, Upload, FileSpreadsheet, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Reusable file-import modal.
 *
 * Props:
 *  title        – Modal heading
 *  description  – Short description shown below the heading
 *  templateHint – Bullet points describing expected columns (array of strings)
 *  onImport     – async (file) => { created, updated?, skipped?, errors[] }
 *  onTemplate   – async (fmt) => void  (triggers template download)
 *  onClose      – () => void
 *  onSuccess    – () => void  (called after a successful import so parent can refetch)
 */
export function ImportModal({
  title        = "Import Data",
  description  = "Upload a CSV or XLSX file to import records.",
  templateHint = [],
  onImport,
  onTemplate,
  onClose,
  onSuccess,
}) {
  const inputRef              = useRef(null);
  const [file,    setFile]    = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState(null); // { created, updated?, skipped?, errors[] }
  const [error,   setError]   = useState(null); // top-level error string

  const pickFile = (f) => {
    if (!f) return;
    const ext = f.name.split(".").pop().toLowerCase();
    if (!["csv", "xlsx", "xls"].includes(ext)) {
      setError("Only CSV and XLSX files are supported.");
      return;
    }
    setFile(f);
    setResult(null);
    setError(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    pickFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async () => {
    if (!file || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await onImport(file);
      setResult(res);
      if (res.errors?.length === 0) onSuccess?.();
    } catch (err) {
      const detail = err?.response?.data;
      setError(
        typeof detail === "string"
          ? detail
          : detail?.detail ?? "Import failed. Check the file format and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const hasErrors = result?.errors?.length > 0;
  const hasSuccess = result && (result.created > 0 || (result.updated ?? 0) > 0);

  return (
    <div className="fixed inset-0 bg-navy-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className="bg-navy-800 border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06] flex-shrink-0">
          <div>
            <h2 className="font-bold text-lg text-white">{title}</h2>
            <p className="text-white/40 text-xs mt-0.5">{description}</p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/70 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* Template hint */}
          {templateHint.length > 0 && (
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4">
              <p className="text-xs font-semibold text-white/50 mb-2 uppercase tracking-wider">
                Required columns
              </p>
              <div className="flex flex-wrap gap-1.5">
                {templateHint.map((col) => (
                  <span
                    key={col}
                    className="px-2 py-0.5 rounded-md bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-mono"
                  >
                    {col}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Drop zone */}
          {!result && (
            <div
              className={cn(
                "border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all",
                dragging
                  ? "border-teal-400/60 bg-teal-500/5"
                  : file
                  ? "border-teal-500/30 bg-teal-500/5"
                  : "border-white/10 hover:border-white/20 hover:bg-white/[0.02]"
              )}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => pickFile(e.target.files[0])}
              />
              {file ? (
                <div className="flex flex-col items-center gap-2">
                  <FileSpreadsheet className="w-10 h-10 text-teal-400" />
                  <p className="text-white font-medium text-sm">{file.name}</p>
                  <p className="text-white/30 text-xs">
                    {(file.size / 1024).toFixed(1)} KB · Click to change
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-10 h-10 text-white/20" />
                  <p className="text-white/60 text-sm font-medium">
                    Drop a CSV or XLSX file here
                  </p>
                  <p className="text-white/25 text-xs">or click to browse</p>
                </div>
              )}
            </div>
          )}

          {/* Top-level error */}
          {error && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-500/5 border border-rose-500/20">
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <p className="text-rose-400 text-sm">{error}</p>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="space-y-3">
              {/* Summary */}
              <div className={cn(
                "flex items-start gap-3 p-4 rounded-xl border",
                hasErrors
                  ? "bg-amber-500/5 border-amber-500/20"
                  : "bg-teal-500/5 border-teal-500/20"
              )}>
                {hasErrors
                  ? <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  : <CheckCircle2 className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
                }
                <div className="text-sm space-y-0.5">
                  {result.created > 0 && (
                    <p className="text-teal-400 font-medium">
                      {result.created} record{result.created !== 1 ? "s" : ""} created
                    </p>
                  )}
                  {result.updated > 0 && (
                    <p className="text-sky-400 font-medium">
                      {result.updated} record{result.updated !== 1 ? "s" : ""} updated
                    </p>
                  )}
                  {result.skipped > 0 && (
                    <p className="text-white/40">
                      {result.skipped} skipped (already exist)
                    </p>
                  )}
                  {result.created === 0 && !result.updated && !result.skipped && (
                    <p className="text-white/50">No new records were imported.</p>
                  )}
                </div>
              </div>

              {/* Row errors */}
              {hasErrors && (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">
                    {result.errors.length} row error{result.errors.length !== 1 ? "s" : ""}
                  </p>
                  {result.errors.map((e, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-xs px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]"
                    >
                      <span className="text-white/30 font-mono flex-shrink-0 w-10">
                        Row {e.row}
                      </span>
                      <span className="text-rose-400/90">{e.error}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Import another */}
              <button
                onClick={() => { setFile(null); setResult(null); setError(null); }}
                className="text-xs text-teal-400 hover:text-teal-300 transition-colors"
              >
                ← Import another file
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-white/[0.06] flex items-center gap-3 flex-shrink-0">
          {/* Template download */}
          {onTemplate && (
            <div className="flex gap-2 mr-auto">
              <button
                onClick={() => onTemplate("xlsx")}
                className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs text-white/40 hover:text-white/80 hover:bg-white/5 border border-white/10 transition-all"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> XLSX template
              </button>
              <button
                onClick={() => onTemplate("csv")}
                className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs text-white/40 hover:text-white/80 hover:bg-white/5 border border-white/10 transition-all"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> CSV template
              </button>
            </div>
          )}

          <button
            onClick={onClose}
            className="px-4 h-10 rounded-xl border border-white/10 text-white/50 hover:text-white/80 text-sm transition-colors"
          >
            {result ? "Close" : "Cancel"}
          </button>

          {!result && (
            <button
              onClick={handleSubmit}
              disabled={!file || loading}
              className="flex items-center gap-2 px-5 h-10 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-40 disabled:cursor-not-allowed text-navy-950 font-semibold text-sm transition-all"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Importing…</>
                : <><Upload className="w-4 h-4" /> Import</>
              }
            </button>
          )}
        </div>
      </div>
    </div>
  );
}