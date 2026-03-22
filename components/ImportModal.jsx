"use client";

import { useRef, useState } from "react";
import {
  X, Upload, FileSpreadsheet, AlertTriangle,
  CheckCircle2, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function ImportModal({
  title        = "Import Data",
  description  = "Upload an XLSX file to import records.",
  templateHint = [],
  onImport,
  onTemplate,
  onClose,
  onSuccess,
}) {
  const inputRef                 = useRef(null);
  const [file,     setFile]      = useState(null);
  const [dragging, setDragging]  = useState(false);
  const [loading,  setLoading]   = useState(false);
  const [result,   setResult]    = useState(null);
  const [error,    setError]     = useState(null);

  const pickFile = (f) => {
    if (!f) return;
    const ext = f.name.split(".").pop().toLowerCase();
    if (!["xlsx", "xls"].includes(ext)) {
      setError("Only XLSX files are supported.");
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

  const hasErrors  = result?.errors?.length > 0;

  const btnOutline = "flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-all";

  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
      <div
        className="bg-card border border-border rounded-xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <div>
            <h2 className="font-semibold text-base text-foreground">{title}</h2>
            <p className="text-muted-foreground text-xs mt-0.5">{description}</p>
          </div>
          <button
            onClick={onClose}
            className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex-shrink-0 ml-4"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* Column hints */}
          {templateHint.length > 0 && (
            <div className="bg-muted/50 border border-border rounded-lg p-4">
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                Required columns
              </p>
              <div className="flex flex-wrap gap-1.5">
                {templateHint.map((col) => (
                  <span
                    key={col}
                    className="px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary text-xs font-mono"
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
                "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-150",
                dragging
                  ? "border-primary/60 bg-primary/5"
                  : file
                  ? "border-primary/40 bg-primary/5"
                  : "border-border hover:border-muted-foreground/40 hover:bg-accent/50"
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
                  <FileSpreadsheet className="w-9 h-9 text-primary" />
                  <p className="text-foreground font-medium text-sm">{file.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {(file.size / 1024).toFixed(1)} KB · Click to change
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-9 h-9 text-muted-foreground/40" />
                  <p className="text-muted-foreground text-sm font-medium">Drop a CSV or XLSX here</p>
                  <p className="text-muted-foreground/60 text-xs">or click to browse</p>
                </div>
              )}
            </div>
          )}

          {/* Top-level error */}
          {error && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/5 border border-destructive/20">
              <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="space-y-3">
              <div className={cn(
                "flex items-start gap-3 p-4 rounded-lg border",
                hasErrors ? "bg-amber-50 dark:bg-amber-500/5 border-amber-200 dark:border-amber-500/20"
                          : "bg-teal-50 dark:bg-teal-500/5 border-teal-200 dark:border-teal-500/20"
              )}>
                {hasErrors
                  ? <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  : <CheckCircle2 className="w-5 h-5 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" />
                }
                <div className="text-sm space-y-0.5">
                  {result.created > 0 && (
                    <p className="text-teal-700 dark:text-teal-400 font-medium">
                      {result.created} record{result.created !== 1 ? "s" : ""} created
                    </p>
                  )}
                  {result.updated > 0 && (
                    <p className="text-sky-700 dark:text-sky-400 font-medium">
                      {result.updated} record{result.updated !== 1 ? "s" : ""} updated
                    </p>
                  )}
                  {result.skipped > 0 && (
                    <p className="text-muted-foreground">{result.skipped} skipped (already exist)</p>
                  )}
                  {!result.created && !result.updated && !result.skipped && (
                    <p className="text-muted-foreground">No new records were imported.</p>
                  )}
                </div>
              </div>

              {hasErrors && (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {result.errors.length} row error{result.errors.length !== 1 ? "s" : ""}
                  </p>
                  {result.errors.map((e, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs px-3 py-2 rounded-lg bg-muted/50 border border-border">
                      <span className="text-muted-foreground font-mono flex-shrink-0 w-10">Row {e.row}</span>
                      <span className="text-destructive">{e.error}</span>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => { setFile(null); setResult(null); setError(null); }}
                className="text-xs text-primary hover:underline transition-colors"
              >
                ← Import another file
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border flex items-center gap-3 flex-shrink-0">
          {onTemplate && (
            <div className="flex gap-2 mr-auto">
              <button onClick={() => onTemplate("xlsx")} className={btnOutline}>
                <FileSpreadsheet className="w-3.5 h-3.5" /> XLSX
              </button>
              {/* <button onClick={() => onTemplate("csv")} className={btnOutline}>
                <FileSpreadsheet className="w-3.5 h-3.5" /> CSV
              </button> */}
            </div>
          )}

          <button
            onClick={onClose}
            className="px-4 h-9 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent text-sm transition-colors"
          >
            {result ? "Close" : "Cancel"}
          </button>

          {!result && (
            <button
              onClick={handleSubmit}
              disabled={!file || loading}
              className="flex items-center gap-2 px-5 h-9 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
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