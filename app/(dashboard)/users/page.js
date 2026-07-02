"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  ChevronLeft,
  ChevronRight,
  Power,
  PowerOff,
  Users as UsersIcon,
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
const inputClasses =
  "w-full h-10 px-3 rounded-lg bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground/20 text-sm focus:outline-none focus:border-teal-500/40 transition-colors";
const PAGE_SIZE = 12;

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
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-bold text-lg text-foreground">
            {user ? "Edit Staff" : "New Staff Account"}
          </h2>
          <button
            onClick={onClose}
            className="text-foreground/50 hover:text-foreground/80"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-foreground">Username *</label>
            <input
              value={form.username}
              onChange={(e) => upd("username", e.target.value)}
              required
              placeholder="john.doe"
              className={inputClasses}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-foreground">Role *</label>
              <select
                value={form.role}
                onChange={(e) => upd("role", e.target.value)}
                className={inputClasses + " appearance-none"}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_CONFIG[r]?.label ?? r}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-foreground">Phone</label>
              <input
                value={form.phone_number}
                onChange={(e) => upd("phone_number", e.target.value)}
                placeholder="+233 …"
                className={inputClasses}
              />
            </div>
          </div>
          {!user && (
            <>
              <div className="space-y-1.5">
                <label className="text-xs text-foreground">Password *</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => upd("password", e.target.value)}
                  required
                  className={inputClasses}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-foreground">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  value={form.confirm_password}
                  onChange={(e) => upd("confirm_password", e.target.value)}
                  required
                  className={inputClasses}
                />
              </div>
            </>
          )}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 rounded-lg border border-border text-foreground/50 hover:text-foreground/80 text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 h-10 rounded-lg bg-primary hover:bg-primary/80 disabled:opacity-50 text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 transition-all"
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

// ── Checkbox ──────────────────────────────────────────────────────────────────
function Checkbox({ checked, indeterminate, onChange, ariaLabel }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = !!indeterminate;
  }, [indeterminate]);
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      aria-label={ariaLabel}
      className="w-4 h-4 rounded border-border text-primary accent-teal-500 cursor-pointer"
    />
  );
}

// ── Row ───────────────────────────────────────────────────────────────────────
function UserRow({ u, selected, onToggle, onEdit, onDelete }) {
  const cfg = ROLE_CONFIG[u.role] ?? {
    label: u.role,
    cls: "bg-muted/50 text-foreground border-border",
  };
  const Icon = cfg.icon ?? ShieldCheck;
  return (
    <tr
      className={cn(
        "border-b border-border last:border-b-0 transition-colors",
        selected ? "bg-primary/5" : "hover:bg-muted/30",
      )}
    >
      <td className="w-10 pl-5 pr-2 py-3">
        <Checkbox
          checked={selected}
          onChange={() => onToggle(u.id)}
          ariaLabel={`Select ${u.username}`}
        />
      </td>
      <td className="py-3 pr-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center flex-shrink-0">
            <span className="font-bold text-primary text-xs">
              {u.username[0]?.toUpperCase()}
            </span>
          </div>
          <span className="font-medium text-foreground text-sm">{u.username}</span>
        </div>
      </td>
      <td className="py-3 pr-4">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-semibold ${cfg.cls}`}
        >
          <Icon className="w-2.5 h-2.5" />
          {cfg.label}
        </span>
      </td>
      <td className="py-3 pr-4">
        {u.phone_number ? (
          <div className="flex items-center gap-1.5 text-xs text-foreground/80">
            <Phone className="w-3.5 h-3.5 text-muted-foreground" />
            {u.phone_number}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground/50">—</span>
        )}
      </td>
      <td className="py-3 pr-4">
        <span
          className={cn(
            "text-[10px] px-2 py-0.5 rounded-md border font-semibold",
            u.is_active
              ? "bg-teal-500/10 text-teal-400 border-teal-500/20"
              : "bg-muted/50 text-muted-foreground border-border",
          )}
        >
          {u.is_active ? "Active" : "Off"}
        </span>
      </td>
      <td className="py-3 pr-4 text-xs text-muted-foreground whitespace-nowrap">
        {formatDate(u.created_at)}
      </td>
      <td className="py-3 pr-5">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => onEdit(u)}
            title="Edit"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-foreground/60 hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(u)}
            title="Delete"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-rose-400 hover:text-rose-400/70 hover:bg-rose-500/5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── Bulk Action Bar ───────────────────────────────────────────────────────────
function BulkActionBar({ count, onClear, onActivate, onDeactivate, onDelete, busy }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3 rounded-xl bg-primary/5 border border-primary/20">
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-foreground">
          {count} selected
        </span>
        <button
          onClick={onClear}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Clear
        </button>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onActivate}
          disabled={busy}
          className="flex items-center gap-1.5 px-3 h-8 rounded-lg border border-teal-500/25 bg-teal-500/5 text-teal-400 hover:bg-teal-500/10 text-xs font-medium transition-all disabled:opacity-40"
        >
          <Power className="w-3.5 h-3.5" /> Activate
        </button>
        <button
          onClick={onDeactivate}
          disabled={busy}
          className="flex items-center gap-1.5 px-3 h-8 rounded-lg border border-border text-foreground hover:bg-muted/50 text-xs font-medium transition-all disabled:opacity-40"
        >
          <PowerOff className="w-3.5 h-3.5" /> Deactivate
        </button>
        <button
          onClick={onDelete}
          disabled={busy}
          className="flex items-center gap-1.5 px-3 h-8 rounded-lg border border-rose-500/25 bg-rose-500/5 text-rose-400 hover:bg-rose-500/10 text-xs font-medium transition-all disabled:opacity-40"
        >
          <Trash2 className="w-3.5 h-3.5" /> Delete
        </button>
      </div>
    </div>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────────
function Pagination({ page, pageCount, total, pageSize, onPageChange }) {
  if (total === 0) return null;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  return (
    <div className="flex items-center justify-between gap-4 px-1 pt-1">
      <p className="text-xs text-muted-foreground">
        Showing <span className="text-foreground font-medium">{start}–{end}</span> of{" "}
        <span className="text-foreground font-medium">{total}</span>
      </p>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-foreground/70 hover:text-foreground hover:bg-muted/50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-xs text-foreground px-2">
          Page {page} of {pageCount}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-foreground/70 hover:text-foreground hover:bg-muted/50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
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
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(() => new Set());

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["users", page],
    queryFn: () =>
      authApi.users.list({ page, page_size: PAGE_SIZE }).then((r) => r.data),
    keepPreviousData: true,
  });

  const users = data?.results ?? data ?? [];
  const total = data?.count ?? users.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Reset selection whenever the page's data set changes.
  useEffect(() => {
    setSelected(new Set());
  }, [page]);

  const deleteMutation = useMutation({
    mutationFn: (id) => authApi.users.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success("User deleted");
    },
    onError: () => toast.error("Cannot delete this user"),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids) => authApi.users.bulkDelete(ids),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success(res?.data?.detail ?? "Users deleted");
      setSelected(new Set());
    },
    onError: () => toast.error("Bulk delete failed"),
  });

  const bulkStatusMutation = useMutation({
    mutationFn: ({ ids, is_active }) => authApi.users.bulkUpdateStatus(ids, is_active),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success(res?.data?.detail ?? "Users updated");
      setSelected(new Set());
    },
    onError: () => toast.error("Bulk update failed"),
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

  const toggleOne = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const allOnPageSelected = users.length > 0 && users.every((u) => selected.has(u.id));
  const someOnPageSelected = users.some((u) => selected.has(u.id)) && !allOnPageSelected;

  const toggleAllOnPage = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) {
        users.forEach((u) => next.delete(u.id));
      } else {
        users.forEach((u) => next.add(u.id));
      }
      return next;
    });
  };

  const selectedIds = useMemo(() => Array.from(selected), [selected]);
  const bulkBusy = bulkDeleteMutation.isPending || bulkStatusMutation.isPending;

  return (
    <div className="p-6 lg:p-8 space-y-5 max-w-7xl">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-bold text-3xl text-foreground">Staff Users</h1>
          <p className="text-muted-foreground text-sm mt-1">{total} accounts</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleExport("xlsx")}
            disabled={exporting}
            className="flex items-center gap-1.5 px-3 h-9 rounded-lg border border-border text-foreground hover:text-muted-foreground hover:bg-muted/50 text-xs font-medium transition-all disabled:opacity-40"
          >
            <FileDown className="w-3.5 h-3.5" /> XLSX
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-1.5 px-3 h-9 rounded-lg border border-primary/25 bg-primary/5 text-primary hover:bg-primary/10 text-xs font-medium transition-all"
          >
            <Upload className="w-3.5 h-3.5" /> Import
          </button>
          <button
            onClick={() => setModal({ open: true, user: null })}
            className="flex items-center gap-2 px-4 h-9 rounded-lg bg-primary hover:opacity-90 text-primary-foreground font-semibold text-sm transition-all shadow-[0_0_20px_rgba(45,212,191,0.2)]"
          >
            <Plus className="w-4 h-4" /> New Account
          </button>
        </div>
      </div>

      {selected.size > 0 && (
        <BulkActionBar
          count={selected.size}
          busy={bulkBusy}
          onClear={() => setSelected(new Set())}
          onActivate={() =>
            bulkStatusMutation.mutate({ ids: selectedIds, is_active: true })
          }
          onDeactivate={() =>
            bulkStatusMutation.mutate({ ids: selectedIds, is_active: false })
          }
          onDelete={() => {
            if (confirm(`Delete ${selected.size} selected account(s)?`)) {
              bulkDeleteMutation.mutate(selectedIds);
            }
          }}
        />
      )}

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="w-12 h-12 rounded-xl bg-muted/50 border border-border flex items-center justify-center">
              <UsersIcon className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">No staff accounts yet</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Add a new account or import a list to get started.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="w-10 pl-5 pr-2 py-3">
                    <Checkbox
                      checked={allOnPageSelected}
                      indeterminate={someOnPageSelected}
                      onChange={toggleAllOnPage}
                      ariaLabel="Select all on page"
                    />
                  </th>
                  <th className="py-3 pr-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    User
                  </th>
                  <th className="py-3 pr-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Role
                  </th>
                  <th className="py-3 pr-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Phone
                  </th>
                  <th className="py-3 pr-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Status
                  </th>
                  <th className="py-3 pr-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Joined
                  </th>
                  <th className="py-3 pr-5 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={cn(isFetching && "opacity-60 transition-opacity")}>
                {users.map((u) => (
                  <UserRow
                    key={u.id}
                    u={u}
                    selected={selected.has(u.id)}
                    onToggle={toggleOne}
                    onEdit={(u) => setModal({ open: true, user: u })}
                    onDelete={(u) => {
                      if (confirm(`Delete account for ${u.username}?`))
                        deleteMutation.mutate(u.id);
                    }}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination
        page={page}
        pageCount={pageCount}
        total={total}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />

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