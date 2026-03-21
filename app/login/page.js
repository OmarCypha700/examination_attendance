"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Eye, EyeOff, Scan, Shield, Zap, ScanQrCode } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const { login, user } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const redirectByRole = (role) => {
    if (role === "admin") return "/dashboard";
    if (role === "invigilator") return "/scan";
    return "/";
  };

  // If already authenticated, redirect
  useEffect(() => {
    if (user?.role) {
      router.replace(redirectByRole(user.role));
    }
  }, [user, router]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!username.trim() || !password) return;

    setLoading(true);
    try {
      const loggedUser = await login(username.trim(), password);
      router.push(redirectByRole(loggedUser.role));
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
    {
      icon: Zap,
      label: "Instant QR scanning",
      desc: "Sub-second response time",
    },
    {
      icon: Shield,
      label: "Duplicate detection",
      desc: "Auto-flag repeated scans",
    },
    { icon: Scan, label: "Export registers", desc: "CSV & XLSX formats" },
  ];

  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* ── Left panel – branding ── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-pulse" />
              Live attendance tracking
            </div>
            <Image
              src="/cover.webp"
              alt="ExamAttend Logo"
              width={500}
              height={500}
            />
          </div>
        </div>

        <div className="relative z-10 text text-xs">
          © {new Date().getFullYear()} SacnOva. All rights reserved.
        </div>
      </div>

      {/* ── Right panel – form ── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex flex-col lg:hidden items-center gap-2 mb-10">
            <div className="flex items-center gap-5">
              {/* <ScanQrCode className="w-30 h-30 text-cyan-800" /> */}
              <Image
                src="/scanova_logo.webp"
                alt="ScanOva Logo"
                width={150}
                height={150}
              />

              {/* <Image
                src="/scanova_logo.webp"
                alt="School Logo"
                width={150}
                height={150}
              /> */}
            </div>
          </div>

          <div className="flex flex-col items-center mb-8">
            <h2 className="font-bold text-3xl mb-2">Log In</h2>
            <p className="text-sm text-muted-foreground">
              Enter your credentials to access the system.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 w-full max-w-sm">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              required
              className="w-full mb-3 p-2 border rounded focus:outline-none focus:ring-1 focus:ring-primary"
            />

            <div className="relative mb-4">
              <input
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="w-full mb-3 p-2 border rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-4 top-1/2 -translate-y-1/2 focus:outline-none"
              >
                {show ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-cyan-800/80 hover:bg-cyan-800 active:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-smflex items-center justify-center gap-2 shadow-[0_0_24px_rgba(45,212,191,0.25)]"
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
