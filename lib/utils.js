import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Tailwind class merger (shadcn pattern)
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// ── Date / Time ───────────────────────────────────────────────────────────────

/**
 * Format an ISO date string → "28 Feb 2026"
 */
export function formatDate(dateStr) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

/**
 * Format a time string (HH:MM or HH:MM:SS) → "09:30 AM"
 */
export function formatTime(timeStr) {
  if (!timeStr) return "—";
  try {
    // timeStr may be "09:30:00" or "09:30"
    const [h, m] = timeStr.split(":");
    const date = new Date();
    date.setHours(Number(h), Number(m), 0);
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return timeStr;
  }
}

/**
 * Format an ISO datetime string → "28 Feb 2026, 09:30 AM"
 */
export function formatDateTime(isoStr) {
  if (!isoStr) return "—";
  try {
    return new Date(isoStr).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoStr;
  }
}

/**
 * Format a number with locale separators
 */
export function formatNumber(n) {
  if (n == null) return "—";
  return Number(n).toLocaleString();
}

/**
 * Compute attendance percentage
 */
export function attendancePct(present, expected) {
  if (!expected || expected === 0) return 0;
  return Math.round((present / expected) * 100);
}

/**
 * Return a greeting based on local hour
 */
export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/**
 * Truncate a string to a max length
 */
export function truncate(str, maxLen = 40) {
  if (!str) return "";
  return str.length > maxLen ? str.slice(0, maxLen) + "…" : str;
}
