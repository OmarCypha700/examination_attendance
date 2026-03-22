// "use client";

// import { useState, useEffect } from "react";
// import Image from "next/image";
// import { useRouter } from "next/navigation";
// import { useAuth } from "@/hooks/useAuth";
// import { Eye, EyeOff, Scan, Shield, Zap, ScanQrCode } from "lucide-react";
// import toast from "react-hot-toast";

// export default function LoginPage() {
//   const { login, user } = useAuth();
//   const router = useRouter();

//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");
//   const [show, setShow] = useState(false);
//   const [loading, setLoading] = useState(false);

//   const redirectByRole = (role) => {
//     if (role === "admin") return "/dashboard";
//     if (role === "invigilator") return "/scan";
//     return "/";
//   };

//   // If already authenticated, redirect
//   useEffect(() => {
//     if (user?.role) {
//       router.replace(redirectByRole(user.role));
//     }
//   }, [user, router]);

//   async function handleSubmit(e) {
//     e.preventDefault();
//     if (!username.trim() || !password) return;

//     setLoading(true);
//     try {
//       const loggedUser = await login(username.trim(), password);
//       router.push(redirectByRole(loggedUser.role));
//     } catch (err) {
//       const msg =
//         err?.response?.data?.detail ??
//         err?.response?.data?.non_field_errors?.[0] ??
//         "Invalid credentials. Please try again.";
//       toast.error(msg);
//     } finally {
//       setLoading(false);
//     }
//   }

//   const features = [
//     {
//       icon: Zap,
//       label: "Instant QR scanning",
//       desc: "Sub-second response time",
//     },
//     {
//       icon: Shield,
//       label: "Duplicate detection",
//       desc: "Auto-flag repeated scans",
//     },
//     { icon: Scan, label: "Export registers", desc: "CSV & XLSX formats" },
//   ];

//   return (
//     <div className="min-h-screen flex overflow-hidden">
//       {/* ── Left panel – branding ── */}
//       <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative">
//         <div
//           className="absolute inset-0 opacity-[0.03]"
//           style={{
//             backgroundImage:
//               "radial-gradient(circle, white 1px, transparent 1px)",
//             backgroundSize: "32px 32px",
//           }}
//         />

//         <div className="relative z-10 space-y-8">
//           <div className="space-y-4">
//             <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-medium">
//               <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-pulse" />
//               Live attendance tracking
//             </div>
//             <Image
//               src="/cover.webp"
//               alt="ExamAttend Logo"
//               width={500}
//               height={500}
//             />
//           </div>
//         </div>

//         <div className="relative z-10 text text-xs">
//           © {new Date().getFullYear()} SacnOva. All rights reserved.
//         </div>
//       </div>

//       {/* ── Right panel – form ── */}
//       <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
//         <div className="w-full max-w-md">
//           {/* Mobile logo */}
//           <div className="flex flex-col lg:hidden items-center gap-2 mb-10">
//             <div className="flex items-center gap-5">
//               {/* <ScanQrCode className="w-30 h-30 text-cyan-800" /> */}
//               <Image
//                 src="/scanova_logo.webp"
//                 alt="ScanOva Logo"
//                 width={150}
//                 height={150}
//               />

//               {/* <Image
//                 src="/scanova_logo.webp"
//                 alt="School Logo"
//                 width={150}
//                 height={150}
//               /> */}
//             </div>
//           </div>

//           <div className="flex flex-col items-center mb-8">
//             <h2 className="font-bold text-3xl mb-2">Log In</h2>
//             <p className="text-sm text-muted-foreground">
//               Enter your credentials to access the system.
//             </p>
//           </div>

//           <form onSubmit={handleSubmit} className="p-6 w-full max-w-sm">
//             <input
//               type="text"
//               value={username}
//               onChange={(e) => setUsername(e.target.value)}
//               placeholder="Username"
//               required
//               className="w-full mb-3 p-2 border rounded focus:outline-none focus:ring-1 focus:ring-primary"
//             />

//             <div className="relative mb-4">
//               <input
//                 type={show ? "text" : "password"}
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 placeholder="Password"
//                 required
//                 className="w-full mb-3 p-2 border rounded focus:outline-none focus:ring-1 focus:ring-primary"
//               />
//               <button
//                 type="button"
//                 onClick={() => setShow(!show)}
//                 className="absolute right-4 top-1/2 -translate-y-1/2 focus:outline-none"
//               >
//                 {show ? (
//                   <EyeOff className="w-4 h-4" />
//                 ) : (
//                   <Eye className="w-4 h-4" />
//                 )}
//               </button>
//             </div>

//             <button
//               type="submit"
//               disabled={loading}
//               className="w-full h-12 rounded-xl bg-cyan-800/80 hover:bg-cyan-800 active:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-smflex items-center justify-center gap-2 shadow-[0_0_24px_rgba(45,212,191,0.25)]"
//             >
//               {loading ? (
//                 <>
//                   <span className="w-4 h-4 border-2 border-navy-950/30 border-t-navy-950 rounded-full animate-spin" />
//                   Signing in…
//                 </>
//               ) : (
//                 "Sign in"
//               )}
//             </button>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// }



"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Eye, EyeOff, ScanQrCode, Zap, Shield, Scan } from "lucide-react";
import toast from "react-hot-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

const FEATURES = [
  { icon: Zap,    label: "Instant QR scanning",  desc: "Sub-second response" },
  { icon: Shield, label: "Duplicate detection",   desc: "Auto-flag repeated scans" },
  { icon: Scan,   label: "Export registers",      desc: "CSV & XLSX formats" },
];

export default function LoginPage() {
  const { login, user } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show,     setShow]     = useState(false);
  const [loading,  setLoading]  = useState(false);

  const redirectByRole = (role) => {
    if (role === "admin")       return "/dashboard";
    if (role === "invigilator") return "/scan";
    return "/";
  };

  useEffect(() => {
    if (user?.role) router.replace(redirectByRole(user.role));
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

  const inputCls = cn(
    "w-full h-10 px-3 mt-2 rounded-lg text-sm transition-colors duration-150",
    "bg-background border border-input",
    "text-foreground placeholder:text-muted-foreground",
    "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
  );

  return (
    <div className="min-h-screen flex bg-background">

      {/* ── Left panel – branding (desktop) ────── */}
      <div className="hidden lg:flex lg:w-[42%] flex-col justify-between p-12 bg-muted/30 border-r border-border">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5 mb-10">
            <ScanQrCode className="w-6 h-6 text-primary" />
            <span className="font-bold text-base tracking-tight">ScanOva</span>
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Live attendance tracking
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground leading-snug mb-3">
              Examination<br />Attendance, simplified.
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
              QR-powered check-ins, real-time registers, and instant exports — all in one place.
            </p>
          </div>

          <div className="pt-8 space-y-3">
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-3.5 h-3.5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} ScanOva. All rights reserved.
        </p>
      </div>

      {/* ── Right panel – form ────────────────── */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border lg:border-none">
          <div className="flex items-center gap-2 lg:hidden">
            <ScanQrCode className="w-5 h-5 text-primary" />
            <span className="font-bold text-sm">ScanOva</span>
          </div>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-sm">
            <Image
              src="/tanoso_logo.webp"
              alt="Tanoso Logo"
              width={100}
              height={100}
              className="mx-auto mb-6"
            />

            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Welcome back</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Sign in to access your dashboard.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  required
                  className={inputCls}
                />
              </div>

              <div className="space-y-1.5">
                <div className="relative">
                  <input
                    type={show ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    required
                    className={cn(inputCls, "pr-10")}
                  />
                  <button
                    type="button"
                    onClick={() => setShow(!show)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={cn(
                  "w-full h-10 rounded-lg text-sm font-semibold transition-all duration-150",
                  "bg-primary text-primary-foreground",
                  "hover:opacity-90 active:opacity-80",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "flex items-center justify-center gap-2 mt-2"
                )}
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
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
    </div>
  );
}