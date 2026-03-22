// "use client";

// import Link from "next/link";
// import Image from "next/image";
// import { usePathname } from "next/navigation";
// import {
//   LayoutDashboard,
//   Scan,
//   BookOpen,
//   GraduationCap,
//   Users,
//   UserCheck,
//   ArrowUpNarrowWide,
//   NotebookTabs,
//   LogOut,
//   ChevronRight,
//   Menu,
//   X,
//   ScanQrCode,
// } from "lucide-react";
// import { useAuth } from "@/hooks/useAuth";
// import { cn } from "@/lib/utils";
// import { useState } from "react";

// const NAV = [
//   {
//     href:  "/dashboard",
//     icon:  LayoutDashboard,
//     label: "Dashboard",
//     roles: ["admin",],
//   },
//   {
//     href:  "/scan",
//     icon:  Scan,
//     label: "QR Scanner",
//     roles: ["admin", "invigilator"],
//   },
//   {
//     href:  "/sessions",
//     icon:  BookOpen,
//     label: "Exam Sessions",
//     roles: ["admin",],
//   },
//   {
//     href:  "/students",
//     icon:  UserCheck,
//     label: "Students",
//     roles: ["admin"],
//   },
//   {
//     href:  "/users",
//     icon:  Users,
//     label: "Staff Users",
//     roles: ["admin"],
//   },
//     {
//     href:  "/courses",
//     icon:  GraduationCap,
//     label: "Courses",
//     roles: ["admin"],
//   },
//   {
//     href:  "/level",
//     icon:  ArrowUpNarrowWide,
//     label: "Level",
//     roles: ["admin"],
//   },
//   {
//     href:  "/program",
//     icon:  NotebookTabs,
//     label: "Programs",
//     roles: ["admin"],
//   },
// ];

// const ROLE_BADGE = {
//   admin:       "bg-rose-500/10 text-rose-400 border border-rose-500/20",
//   invigilator: "bg-teal-500/10 text-teal-400 border border-teal-500/20",
// };

// function NavItem({ href, icon: Icon, label, active }) {
//   return (
//     <Link
//       href={href}
//       className={cn(
//         "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
//         active
//           ? "bg-primary text-white border"
//           : "text-muted-foreground hover:bg-muted hover:text-foreground"
//       )}
//     >
//       <Icon className="w-4 h-4 flex-shrink-0" />
//       <span className="flex-1">{label}</span>
//       {active && <ChevronRight className="w-3.5 h-3.5 opacity-50" />}
//     </Link>
//   );
// }

// export function Sidebar() {
//   const pathname     = usePathname();
//   const { user, logout } = useAuth();
//   const [mobileOpen, setMobileOpen] = useState(false);

//   const allowed = NAV.filter((n) => user && n.roles.includes(user.role));

//   const sidebarContent = (
//     <aside className="w-64 min-h-screen flex flex-col bg-white border-r border-primary/10">
//       {/* Logo */}
//       <div className="h-16 px-5 flex items-center justify-between border-b border-primary/10">
//         <div className="flex items-center gap-3">
//           {/* <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/25 flex items-center justify-center"> */}
//               <ScanQrCode className="w-8 h-8 text-cyan-800" />
//           {/* </div> */}
//           <span className="font-display font-bold text-base tracking-tight">
//             ScanOva
//           </span>
//         </div>
//         <button
//           className="lg:hidden text-white/40 hover:text-white/80"
//           onClick={() => setMobileOpen(false)}
//         >
//           <X className="w-5 h-5" />
//         </button>
//       </div>

//       {/* Nav */}
//       <nav className="flex-1 px-3 py-4 space-y-0.5">
//         {allowed.map(({ href, icon, label }) => (
//           <NavItem
//             key={href}
//             href={href}
//             icon={icon}
//             label={label}
//             active={pathname.startsWith(href)}
//           />
//         ))}
//       </nav>

//       {/* User + logout */}
//       <div className="p-3 border-t border-white/[0.05] space-y-1">

//         <button
//           onClick={logout}
//           className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-400/60 hover:text-rose-400 hover:bg-rose-500/5 transition-all duration-150"
//         >
//           <LogOut className="w-4 h-4" />
//           <span>Sign out</span>
//         </button>

//         <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
//           <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center flex-shrink-0">
//             <span className="uppercase text-xs font-bold text-teal-400">
//               {user?.username?.[0]?.toUpperCase() ?? "?"}
//             </span>
//           </div>
//           <div className="flex-1 min-w-0">
//             <p className="text-sm font-medium text-white/90 truncate">
//               {user?.username}
//             </p>
//             <span
//               className={cn(
//                 "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold capitalize mt-0.5",
//                 ROLE_BADGE[user?.role] ?? "bg-white/5 text-white/40"
//               )}
//             >
//               {user?.role}
//             </span>
//           </div>
//         </div>
        
//       </div>
//     </aside>
//   );

//   return (
//     <>
//       {/* Desktop */}
//       <div className="hidden lg:block sticky top-0 h-screen flex-shrink-0">
//         {sidebarContent}
//       </div>

//       {/* Mobile trigger */}
//       <button
//         className="lg:hidden fixed top-4 right-4 z-50 w-10 h-10 rounded-xl bg-navy-800 border border-white/10 flex items-center justify-center text-white/60 hover:text-white"
//         onClick={() => setMobileOpen(true)}
//       >
//         <Menu className="w-5 h-5" />
//       </button>

//       {/* Mobile drawer */}
//       {mobileOpen && (
//         <div className="lg:hidden fixed inset-0 z-40 flex">
//           <div
//             className="absolute inset-0 bg-black/60 backdrop-blur-sm"
//             onClick={() => setMobileOpen(false)}
//           />
//           <div className="relative z-10">{sidebarContent}</div>
//         </div>
//       )}
//     </>
//   );
// }



"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Scan,
  BookOpen,
  GraduationCap,
  Users,
  UserCheck,
  ArrowUpNarrowWide,
  NotebookTabs,
  LogOut,
  Menu,
  X,
  ScanQrCode,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Separator } from "@/components/ui/separator";

const NAV = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard",     roles: ["admin"] },
  { href: "/scan",      icon: Scan,            label: "QR Scanner",    roles: ["admin", "invigilator"] },
  { href: "/sessions",  icon: BookOpen,        label: "Exam Sessions", roles: ["admin"] },
  { href: "/students",  icon: UserCheck,       label: "Students",      roles: ["admin"] },
  { href: "/users",     icon: Users,           label: "Staff Users",   roles: ["admin"] },
  { href: "/courses",   icon: GraduationCap,   label: "Courses",       roles: ["admin"] },
  { href: "/level",     icon: ArrowUpNarrowWide, label: "Levels",      roles: ["admin"] },
  { href: "/program",   icon: NotebookTabs,    label: "Programs",      roles: ["admin"] },
];

const ROLE_STYLES = {
  admin:       "text-rose-500 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20",
  invigilator: "text-teal-600 bg-teal-50 dark:bg-teal-500/10 border-teal-200 dark:border-teal-500/20",
};

function NavItem({ href, icon: Icon, label, active }) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150",
        active
          ? "bg-primary/10 dark:bg-primary/15 text-primary font-medium"
          : "text-muted-foreground hover:text-foreground hover:bg-accent"
      )}
    >
      <Icon className={cn("w-4 h-4 flex-shrink-0 transition-colors", active ? "text-primary" : "")} />
      <span className="flex-1 truncate">{label}</span>
      {active && (
        <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
      )}
    </Link>
  );
}

function SidebarContent({ onClose }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const allowed = NAV.filter((n) => user && n.roles.includes(user.role));
  const initial = user?.username?.[0]?.toUpperCase() ?? "?";

  return (
    <aside className="w-[220px] h-full flex flex-col bg-[var(--sidebar)] border-r border-[var(--sidebar-border)]">
      {/* Logo */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-[var(--sidebar-border)]">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <ScanQrCode className="w-5 h-5 text-primary flex-shrink-0" />
          <span className="font-bold text-sm tracking-tight text-foreground">ScanOva</span>
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {allowed.map(({ href, icon, label }) => (
          <NavItem
            key={href}
            href={href}
            icon={icon}
            label={label}
            active={pathname === href || (href !== "/dashboard" && pathname.startsWith(href))}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="px-2 pb-3 space-y-1">
        <Separator className="mb-2 opacity-50" />

        <button
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors duration-150"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign out</span>
        </button>

        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-card border border-border">
          <div className="w-7 h-7 rounded-md bg-primary/15 border border-primary/20 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-primary">{initial}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground truncate capitalize">{user?.username}</p>
            <span className={cn(
              "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border mt-0.5",
              ROLE_STYLES[user?.role] ?? "text-muted-foreground bg-muted border-border"
            )}>
              {user?.role}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:block sticky top-0 h-screen flex-shrink-0">
        <SidebarContent />
      </div>

      {/* Mobile trigger */}
      <button
        className="lg:hidden fixed top-4 right-4 z-50 w-9 h-9 rounded-lg bg-background border border-border flex items-center justify-center text-foreground shadow-sm"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="w-4 h-4" />
      </button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10 h-full">
            <SidebarContent onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}