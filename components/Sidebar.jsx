"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Scan,
  BookOpen,
  GraduationCap,
  Users,
  LogOut,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { useState } from "react";

const NAV = [
  {
    href:  "/dashboard",
    icon:  LayoutDashboard,
    label: "Dashboard",
    roles: ["admin", "invigilator"],
  },
  {
    href:  "/scan",
    icon:  Scan,
    label: "QR Scanner",
    roles: ["admin", "invigilator"],
  },
  {
    href:  "/sessions",
    icon:  BookOpen,
    label: "Exam Sessions",
    roles: ["admin", "invigilator"],
  },
  {
    href:  "/students",
    icon:  GraduationCap,
    label: "Students",
    roles: ["admin"],
  },
  {
    href:  "/users",
    icon:  Users,
    label: "Staff Users",
    roles: ["admin"],
  },
];

const ROLE_BADGE = {
  admin:       "bg-rose-500/10 text-rose-400 border border-rose-500/20",
  invigilator: "bg-teal-500/10 text-teal-400 border border-teal-500/20",
};

function NavItem({ href, icon: Icon, label, active }) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
        active
          ? "bg-teal-500/10 text-teal-400 border border-teal-500/20"
          : "text-white/45 hover:text-white/80 hover:bg-white/5"
      )}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1">{label}</span>
      {active && <ChevronRight className="w-3.5 h-3.5 opacity-50" />}
    </Link>
  );
}

export function Sidebar() {
  const pathname     = usePathname();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const allowed = NAV.filter((n) => user && n.roles.includes(user.role));

  const sidebarContent = (
    <aside className="w-64 min-h-screen flex flex-col bg-navy-900 border-r border-white/[0.05]">
      {/* Logo */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-white/[0.05]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/25 flex items-center justify-center">
            <Scan className="w-4 h-4 text-teal-400" />
          </div>
          <span className="font-display font-bold text-white text-base tracking-tight">
            ExamAttend
          </span>
        </div>
        <button
          className="lg:hidden text-white/40 hover:text-white/80"
          onClick={() => setMobileOpen(false)}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="text-[10px] font-semibold text-white/20 px-3 py-2 uppercase tracking-widest">
          Menu
        </p>
        {allowed.map(({ href, icon, label }) => (
          <NavItem
            key={href}
            href={href}
            icon={icon}
            label={label}
            active={pathname.startsWith(href)}
          />
        ))}
      </nav>

      {/* User + logout */}
      <div className="p-3 border-t border-white/[0.05] space-y-1">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
          <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-teal-400">
              {user?.username?.[0]?.toUpperCase() ?? "?"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white/90 truncate">
              {user?.username}
            </p>
            <span
              className={cn(
                "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold capitalize mt-0.5",
                ROLE_BADGE[user?.role] ?? "bg-white/5 text-white/40"
              )}
            >
              {user?.role}
            </span>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-400/60 hover:text-rose-400 hover:bg-rose-500/5 transition-all duration-150"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:block sticky top-0 h-screen flex-shrink-0">
        {sidebarContent}
      </div>

      {/* Mobile trigger */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-xl bg-navy-800 border border-white/10 flex items-center justify-center text-white/60 hover:text-white"
        onClick={() => setMobileOpen(true)}
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10">{sidebarContent}</div>
        </div>
      )}
    </>
  );
}
