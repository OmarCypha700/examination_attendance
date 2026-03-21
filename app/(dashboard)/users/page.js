"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/lib/api";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Loader2,
  Phone,
  ShieldCheck,
  ScanLine,
  Upload,
  FileDown,
} from "lucide-react";
import toast from "react-hot-toast";
import { formatDate, cn } from "@/lib/utils";
import { ImportModal } from "@/components/ImportModal";

const ROLES = ["admin", "invigilator"];
const ROLE_CONFIG = {
  admin: {
    label: "Administrator",
    icon: ShieldCheck,
    cls: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  },
  invigilator: {
    label: "Invigilator",
    icon: ScanLine,
    cls: "bg-teal-500/10 text-teal-400 border-teal-500/20",
  },
};
const inputCls =
  "w-full h-10 px-3 rounded-xl bg-navy-950 border border-white/10 text-white placeholder-white/20 text-sm focus:outline-none focus:border-teal-500/40 transition-colors";

// ── User Modal ────────────────────────────────────────────────────────────────
function UserModal({ user, onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    username: user?.username ?? "",
    role: user?.role ?? "invigilator",
    phone_number: user?.phone_number ?? "",
    password: "",
    confirm_password: "",
  });
  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: (data) =>
      user ? authApi.users.update(user.id, data) : authApi.users.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success(user ? "User updated" : "User created");
      onClose();
    },
    onError: (err) => {
      const d = err?.response?.data;
      toast.error(
        typeof d === "string"
          ? d
          : (d?.detail ?? Object.values(d ?? {})?.[0]?.[0] ?? "Error"),
      );
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!user && form.password !== form.confirm_password) {
      toast.error("Passwords do not match");
      return;
    }
    const payload = {
      username: form.username.trim(),
      role: form.role,
      phone_number: form.phone_number.trim(),
    };
    if (!user) {
      payload.password = form.password;
      payload.confirm_password = form.confirm_password;
    }
    mutation.mutate(payload);
  };

  return (
    <div className="fixed inset-0 bg-navy-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-navy-800 border border-white/10 rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <h2 className="font-bold text-lg text-white">
            {user ? "Edit Staff" : "New Staff Account"}
          </h2>
          <button
            onClick={onClose}
            className="text-white/30 hover:text-white/70"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-white/40">Username *</label>
            <input
              value={form.username}
              onChange={(e) => upd("username", e.target.value)}
              required
              placeholder="john.doe"
              className={inputCls}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-white/40">Role *</label>
              <select
                value={form.role}
                onChange={(e) => upd("role", e.target.value)}
                className={inputCls + " appearance-none"}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_CONFIG[r]?.label ?? r}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-white/40">Phone</label>
              <input
                value={form.phone_number}
                onChange={(e) => upd("phone_number", e.target.value)}
                placeholder="+233 …"
                className={inputCls}
              />
            </div>
          </div>
          {!user && (
            <>
              <div className="space-y-1.5">
                <label className="text-xs text-white/40">Password *</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => upd("password", e.target.value)}
                  required
                  className={inputCls}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-white/40">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  value={form.confirm_password}
                  onChange={(e) => upd("confirm_password", e.target.value)}
                  required
                  className={inputCls}
                />
              </div>
            </>
          )}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 rounded-xl border border-white/10 text-white/50 hover:text-white/80 text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 h-10 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-navy-950 font-semibold text-sm flex items-center justify-center gap-2 transition-all"
            >
              {mutation.isPending && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              {user ? "Save" : "Create Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── User Card ─────────────────────────────────────────────────────────────────
function UserCard({ u, onEdit, onDelete }) {
  const cfg = ROLE_CONFIG[u.role] ?? {
    label: u.role,
    cls: "bg-white/5 text-white/30 border-white/10",
  };
  const Icon = cfg.icon ?? ShieldCheck;
  return (
    <div className="bg-white/[0.02] hover:bg-white/[0.035] border border-white/[0.06] rounded-2xl p-5 space-y-4 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/15 flex items-center justify-center flex-shrink-0">
            <span className="font-bold text-teal-400 text-sm">
              {u.username[0]?.toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-semibold text-white text-sm">{u.username}</p>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-semibold mt-0.5 ${cfg.cls}`}
            >
              <Icon className="w-2.5 h-2.5" />
              {cfg.label}
            </span>
          </div>
        </div>
        <span
          className={cn(
            "text-[10px] px-2 py-0.5 rounded-md border font-semibold",
            u.is_active
              ? "bg-teal-500/10 text-teal-400 border-teal-500/20"
              : "bg-white/5 text-white/25 border-white/10",
          )}
        >
          {u.is_active ? "Active" : "Off"}
        </span>
      </div>
      {u.phone_number && (
        <div className="flex items-center gap-2 text-xs text-white/35">
          <Phone className="w-3.5 h-3.5" />
          {u.phone_number}
        </div>
      )}
      <p className="text-xs text-white/20">Joined {formatDate(u.created_at)}</p>
      <div className="flex gap-2 pt-1 border-t border-white/[0.05]">
        <button
          onClick={() => onEdit(u)}
          className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs text-white/40 hover:text-white/80 hover:bg-white/5 transition-colors"
        >
          <Edit2 className="w-3.5 h-3.5" /> Edit
        </button>
        <button
          onClick={() => onDelete(u)}
          className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs text-rose-400/40 hover:text-rose-400 hover:bg-rose-500/5 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" /> Delete
        </button>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function UsersPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState({ open: false, user: null });
  const [showImport, setShowImport] = useState(false);
  const [exporting, setExporting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => authApi.users.list().then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => authApi.users.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success("User deleted");
    },
    onError: () => toast.error("Cannot delete this user"),
  });

  const handleExport = async (fmt) => {
    setExporting(true);
    try {
      await authApi.users.export(fmt);
    } catch {
      toast.error("Export failed.");
    } finally {
      setExporting(false);
    }
  };

  const users = data?.results ?? data ?? [];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-bold text-3xl text-white">Staff Users</h1>
          <p className="text-white/40 text-sm mt-1">{users.length} accounts</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Export */}
          <div className="flex gap-1.5">
            <button
              onClick={() => handleExport("xlsx")}
              disabled={exporting}
              className="flex items-center gap-1.5 px-3 h-9 rounded-xl border border-white/10 text-white/50 hover:text-white/80 hover:bg-white/5 text-xs font-medium transition-all disabled:opacity-40"
            >
              <FileDown className="w-3.5 h-3.5" /> XLSX
            </button>
          </div>
          {/* Import */}
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-1.5 px-3 h-9 rounded-xl border border-teal-500/25 bg-teal-500/5 text-teal-400 hover:bg-teal-500/10 text-xs font-medium transition-all"
          >
            <Upload className="w-3.5 h-3.5" /> Import
          </button>
          {/* Add */}
          <button
            onClick={() => setModal({ open: true, user: null })}
            className="flex items-center gap-2 px-4 h-9 rounded-xl bg-teal-500 hover:bg-teal-400 text-navy-950 font-semibold text-sm transition-all shadow-[0_0_20px_rgba(45,212,191,0.2)]"
          >
            <Plus className="w-4 h-4" /> New Account
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 text-teal-400 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {users.map((u) => (
            <UserCard
              key={u.id}
              u={u}
              onEdit={(u) => setModal({ open: true, user: u })}
              onDelete={(u) => {
                if (confirm(`Delete account for ${u.username}?`))
                  deleteMutation.mutate(u.id);
              }}
            />
          ))}
        </div>
      )}

      {modal.open && (
        <UserModal
          user={modal.user}
          onClose={() => setModal({ open: false, user: null })}
        />
      )}

      {showImport && (
        <ImportModal
          title="Import Staff Users"
          description="Upload a CSV or XLSX file. Existing usernames are skipped."
          templateHint={["username", "role", "phone_number", "password"]}
          onImport={(file) => authApi.users.import(file)}
          onTemplate={(fmt) => authApi.users.template(fmt)}
          onClose={() => setShowImport(false)}
          onSuccess={() => qc.invalidateQueries({ queryKey: ["users"] })}
        />
      )}
    </div>
  );
}
