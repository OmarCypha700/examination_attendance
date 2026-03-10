"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Eye, EyeOff, Scan, Shield, Zap } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const { login, user } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show,     setShow]     = useState(false);
  const [loading,  setLoading]  = useState(false);

  // If already authenticated, redirect
  useEffect(() => {
    if (user) router.replace("/dashboard");
  }, [user, router]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!username.trim() || !password) return;

    setLoading(true);
    try {
      await login(username.trim(), password);
      router.push("/dashboard");
    } catch (err) {
      const msg =
        err?.response?.data?.detail ??
        err?.response?.data?.non_field_errors?.[0] ??
        "Invalid credentials. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  const features = [
    { icon: Zap,    label: "Instant QR scanning",  desc: "Sub-second response time" },
    { icon: Shield, label: "Duplicate detection",   desc: "Auto-flag repeated scans" },
    { icon: Scan,   label: "Export registers",       desc: "CSV & XLSX formats" },
  ];

  return (
    <div className="min-h-screen bg-navy-950 flex overflow-hidden">

      {/* ── Left panel – branding ── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative bg-navy-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(45,212,191,0.08),transparent_60%)]" />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "32px 32px" }}
        />

        <div className="relative flex items-center gap-3 z-10">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center">
            <Scan className="w-5 h-5 text-teal-400" />
          </div>
          <span className="font-bold text-xl text-white tracking-tight">ExamAttend</span>
        </div>

        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
              Live attendance tracking
            </div>

            <h1 className="font-bold text-5xl leading-tight text-white">
              Examination<br />
              <span className="text-teal-400">Attendance</span><br />
              System
            </h1>

            <p className="text-white/50 text-lg leading-relaxed max-w-sm">
              QR-powered, real-time attendance registration for Section A &amp; B examinations.
            </p>
          </div>

          <div className="space-y-3">
            {features.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-center gap-4 bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-teal-400" />
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{label}</div>
                  <div className="text-xs text-white/40">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-white/20 text-xs">
          © {new Date().getFullYear()} ExamAttend. All rights reserved.
        </div>
      </div>

      {/* ── Right panel – form ── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-10">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center">
              <Scan className="w-4 h-4 text-teal-400" />
            </div>
            <span className="font-bold text-lg text-white">ExamAttend</span>
          </div>

          <div className="mb-8">
            <h2 className="font-bold text-3xl text-white mb-2">Sign in</h2>
            <p className="text-white/40 text-sm">Enter your credentials to access the system.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/60">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your username"
                required
                autoComplete="username"
                className="w-full h-12 px-4 rounded-xl bg-navy-800 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 transition-all text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/60">Password</label>
              <div className="relative">
                <input
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full h-12 px-4 pr-12 rounded-xl bg-navy-800 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-teal-500 hover:bg-teal-400 active:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed text-navy-950 font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(45,212,191,0.25)]"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-navy-950/30 border-t-navy-950 rounded-full animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
