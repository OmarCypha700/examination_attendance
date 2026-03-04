"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { coreApi } from "@/lib/api";
import {
  Scan,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Camera,
  StopCircle,
  ChevronDown,
  Keyboard,
} from "lucide-react";
import { formatDateTime, cn } from "@/lib/utils";
import toast from "react-hot-toast";

// ── Scan Result Card ───────────────────────────────────────────────────────────
function ScanResultCard({ result, onDismiss }) {
  const isSuccess = result.status === "success";
  const isDuplicate = result.status === "duplicate";

  useEffect(() => {
    const t = setTimeout(onDismiss, 9000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div
      className={cn(
        "rounded-2xl border p-5 animate-fade-up",
        isSuccess && "bg-teal-500/5 border-teal-500/25",
        isDuplicate && "bg-amber-500/5 border-amber-500/25",
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
            isSuccess && "bg-teal-500/10",
            isDuplicate && "bg-amber-500/10",
          )}
        >
          {isSuccess && <CheckCircle2 className="w-6 h-6 text-teal-400" />}
          {isDuplicate && <AlertTriangle className="w-6 h-6 text-amber-400" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={cn(
                "text-sm font-semibold",
                isSuccess && "text-teal-400",
                isDuplicate && "text-amber-400",
              )}
            >
              {isSuccess ? "Recorded" : "Duplicate Scan"}
            </span>
            <span className="text-white/30 text-xs">
              Section {result.attendance?.section}
            </span>
          </div>

          <p className="font-semibold text-white">
            {result.student?.full_name}
          </p>
          <p className="text-white/50 text-sm font-mono">
            {result.student?.index_number}
          </p>

          <div className="flex flex-wrap gap-2 mt-1.5 text-xs text-white/35">
            <span>{result.student?.programme_name}</span>
            {result.student?.level_name && (
              <>
                <span>·</span>
                <span>{result.student.level_name}</span>
              </>
            )}
          </div>

          {isDuplicate && result.first_scan_time && (
            <p className="text-xs text-amber-400/70 mt-2">
              First scanned: {formatDateTime(result.first_scan_time)}
            </p>
          )}
        </div>

        <button
          onClick={onDismiss}
          className="text-white/20 hover:text-white/50 transition-colors"
        >
          <XCircle className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ── Safe stop helper ───────────────────────────────────────────────────────────
/**
 * Stops an Html5Qrcode instance only when it is actually running or paused.
 * Html5QrcodeScannerState values: NOT_STARTED = 1, SCANNING = 2, PAUSED = 3.
 * Calling stop() in any other state throws "Cannot stop, scanner is not running
 * or paused." — this helper silently ignores that case.
 */
async function safeStop(scanner) {
  if (!scanner) return;
  try {
    const state = scanner.getState?.();
    if (state === 2 || state === 3) {
      await scanner.stop();
    }
  } catch {
    // Already stopped — nothing to do
  }
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function ScanPage() {
  const [sessionId, setSessionId] = useState("");
  const [section, setSection] = useState("A");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [manualIndex, setManualIndex] = useState("");
  const [tab, setTab] = useState("camera");

  const html5QrRef = useRef(null); // Html5Qrcode instance
  const lastScanned = useRef("");
  const cooldown = useRef(false);

  // Active sessions
  const { data: sessionsData } = useQuery({
    queryKey: ["sessions", { status: "active" }],
    queryFn: () =>
      coreApi.sessions
        .list({ status: "active", page_size: 50 })
        .then((r) => r.data),
    refetchInterval: 20_000,
  });
  const activeSessions = sessionsData?.results ?? [];

  // Scan mutation — sends decoded index_number to the backend
  const scanMutation = useMutation({
    mutationFn: (index_number) =>
      coreApi
        .scan({
          index_number,
          exam_session: Number(sessionId),
          section,
        })
        .then((r) => r.data),
    onSuccess: (data) => {
      setResult(data);
      if (data.status === "success") {
        toast.success(`✓ ${data.student?.full_name}`);
      } else {
        toast(`⚠ Duplicate – ${data.student?.full_name}`, { icon: "⚠️" });
      }
    },
    onError: (err) => {
      const detail = err?.response?.data;
      const msg =
        detail?.index_number?.[0] ??
        detail?.detail ??
        (typeof detail === "string" ? detail : "Scan failed.");
      toast.error(msg);
    },
  });

  const handleScan = useCallback(
    (decodedText) => {
      const indexNumber = decodedText.trim();
      if (!sessionId || cooldown.current || indexNumber === lastScanned.current)
        return;
      cooldown.current = true;
      lastScanned.current = indexNumber;
      scanMutation.mutate(indexNumber);
      setTimeout(() => {
        cooldown.current = false;
        lastScanned.current = "";
      }, 2500);
    },
    [sessionId, scanMutation],
  );

  // Start scanner when `scanning` flips to true
  useEffect(() => {
    if (tab !== "camera" || !scanning) return;

    let isMounted = true;

    import("html5-qrcode").then(({ Html5Qrcode }) => {
      if (!isMounted) return;

      const scanner = new Html5Qrcode("qr-scanner-div");
      html5QrRef.current = scanner;

      scanner
        .start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decodedText) => handleScan(decodedText),
          () => {}, // per-frame error — ignore
        )
        .catch(() => {
          if (isMounted) {
            toast.error("Cannot access camera. Check permissions.");
            setScanning(false);
          }
        });
    });

    // Cleanup: stop scanner only if it's actually running
    return () => {
      isMounted = false;
      safeStop(html5QrRef.current).then(() => {
        html5QrRef.current = null;
      });
    };
  }, [scanning, tab, handleScan]);

  // Called by the Stop button and tab switches
  const stopScanning = useCallback(async () => {
    await safeStop(html5QrRef.current);
    html5QrRef.current = null;
    setScanning(false);
  }, []);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualIndex.trim() || !sessionId) return;
    handleScan(manualIndex.trim());
    setManualIndex("");
  };

  const ready = !!sessionId;

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-bold text-3xl text-white">QR Scanner</h1>
        <p className="text-white/40 text-sm mt-1">
          Select a session and section, then scan a student's QR code.
        </p>
      </div>

      {/* Session + Section selectors */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-medium text-white/50">
            Exam Session *
          </label>
          <div className="relative">
            <select
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              className="w-full h-11 px-4 pr-10 rounded-xl bg-navy-800 border border-white/10 text-white text-sm focus:outline-none focus:border-teal-500/40 appearance-none"
            >
              <option value="">
                {activeSessions.length === 0
                  ? "No active sessions"
                  : "Select session…"}
              </option>
              {activeSessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.course_code} — {s.course_title} ({s.programme_name})
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-white/50">Section</label>
          <div className="flex gap-2">
            {["A", "B"].map((s) => (
              <button
                key={s}
                onClick={() => setSection(s)}
                className={cn(
                  "flex-1 h-11 rounded-xl border text-sm font-semibold transition-all",
                  section === s
                    ? "bg-teal-500/10 text-teal-400 border-teal-500/30"
                    : "border-white/10 text-white/40 hover:text-white/70 hover:border-white/20",
                )}
              >
                Section {s}
                <span className="text-xs font-normal ml-1 opacity-60">
                  {s === "A" ? "Objective" : "Theory"}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab selector */}
      <div className="flex gap-2 bg-white/[0.02] border border-white/[0.06] rounded-xl p-1">
        <button
          onClick={() => {
            stopScanning();
            setTab("camera");
          }}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 h-9 rounded-lg text-sm font-medium transition-all",
            tab === "camera"
              ? "bg-white/[0.06] text-white"
              : "text-white/40 hover:text-white/70",
          )}
        >
          <Camera className="w-4 h-4" /> Camera
        </button>
        <button
          onClick={() => {
            stopScanning();
            setTab("manual");
          }}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 h-9 rounded-lg text-sm font-medium transition-all",
            tab === "manual"
              ? "bg-white/[0.06] text-white"
              : "text-white/40 hover:text-white/70",
          )}
        >
          <Keyboard className="w-4 h-4" /> Manual
        </button>
      </div>

      {/* Camera tab */}
      {tab === "camera" && (
        <div className="space-y-4">
          {!scanning ? (
            <button
              onClick={() => setScanning(true)}
              disabled={!ready}
              className="w-full h-14 rounded-2xl bg-teal-500 hover:bg-teal-400 disabled:opacity-40 disabled:cursor-not-allowed text-navy-950 font-semibold text-sm flex items-center justify-center gap-3 transition-all shadow-[0_0_24px_rgba(45,212,191,0.2)]"
            >
              <Camera className="w-5 h-5" />
              {ready ? "Start Scanning" : "Select a session first"}
            </button>
          ) : (
            <div className="space-y-4">
              <div className="relative bg-navy-900 border border-white/[0.06] rounded-2xl overflow-hidden">
                <div id="qr-scanner-div" className="w-full" />
                {/* Corner brackets overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="relative w-52 h-52">
                    <div className="absolute inset-0 border-2 border-teal-400/20 rounded-2xl" />
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-teal-400 rounded-tl-xl" />
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-teal-400 rounded-tr-xl" />
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-teal-400 rounded-bl-xl" />
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-teal-400 rounded-br-xl" />
                  </div>
                </div>
              </div>

              <p className="text-center text-xs text-white/30">
                Point the camera at a student's QR code — the index number will
                be read automatically.
              </p>

              <button
                onClick={stopScanning}
                className="w-full h-12 rounded-xl border border-rose-500/25 bg-rose-500/5 text-rose-400 hover:bg-rose-500/10 text-sm font-medium flex items-center justify-center gap-2 transition-all"
              >
                <StopCircle className="w-4 h-4" /> Stop Scanner
              </button>
            </div>
          )}
        </div>
      )}

      {/* Manual tab */}
      {tab === "manual" && (
        <form onSubmit={handleManualSubmit} className="space-y-3">
          <div className="space-y-2">
            <label className="text-xs font-medium text-white/50">
              Student Index Number
            </label>
            <input
              value={manualIndex}
              onChange={(e) => setManualIndex(e.target.value)}
              placeholder="Enter student index number…"
              autoFocus
              className="w-full h-12 px-4 rounded-xl bg-navy-800 border border-white/10 text-white placeholder-white/20 text-sm focus:outline-none focus:border-teal-500/40 font-mono"
            />
            <p className="text-xs text-white/25">
              This is the same value encoded in the student's QR code.
            </p>
          </div>
          <button
            type="submit"
            disabled={!ready || !manualIndex.trim() || scanMutation.isPending}
            className="w-full h-12 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-40 disabled:cursor-not-allowed text-navy-950 font-semibold text-sm flex items-center justify-center gap-2 transition-all"
          >
            <Scan className="w-4 h-4" />
            {scanMutation.isPending ? "Recording…" : "Record Attendance"}
          </button>
        </form>
      )}

      {/* Result */}
      {result && (
        <ScanResultCard result={result} onDismiss={() => setResult(null)} />
      )}

      {/* Status indicator */}
      {ready && (
        <div className="flex items-center gap-2 text-xs text-white/25 justify-center">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
          Scanning Section {section} ·{" "}
          {activeSessions.find((s) => String(s.id) === String(sessionId))
            ?.course_code ?? ""}
        </div>
      )}
    </div>
  );
}
