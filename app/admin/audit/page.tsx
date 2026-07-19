"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react";
import { getStoredAdminPassword } from "@/lib/admin-auth";

interface AdminAction {
  id: string;
  action: string;
  resource: string;
  detail: string | null;
  created_at: string;
}

const ACTION_FILTERS = [
  { value: "all",    label: "All"     },
  { value: "create", label: "Create"  },
  { value: "update", label: "Update"  },
  { value: "delete", label: "Delete"  },
  { value: "toggle", label: "Toggle"  },
] as const;

function actionColor(action: string) {
  if (action === "delete") return "text-destructive bg-destructive/10";
  if (action === "create") return "text-emerald-600 bg-emerald-500/10";
  if (action === "update") return "text-violet-600 bg-violet-500/10";
  return "text-muted-foreground bg-muted/50";
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AdminAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [perPage] = useState(25);
  const [selected, setSelected] = useState<AdminAction | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const pwd = getStoredAdminPassword();
      if (!pwd) throw new Error("Not authenticated");

      // Use the Supabase client directly with service role via API route
      const res = await fetch(`/api/admin/audit`, {
        headers: { "x-admin-password": pwd },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setLogs(data.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load audit log");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = logs.filter((l) => {
    if (actionFilter !== "all" && l.action !== actionFilter) return false;
    if (search && !l.action.includes(search) && !l.resource.includes(search) && !l.detail?.includes(search)) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const fmt = (d: string) => new Date(d).toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Audit Log</h1>
          <p className="text-muted-foreground mt-1">Admin actions recorded in the database</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-bold rounded-xl transition-colors">
          <RefreshCw size={18} /> Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-xl flex items-center justify-between">
          <p className="text-sm text-destructive font-semibold">{error}</p>
          <button onClick={() => setError(null)} className="text-xs text-destructive/60">Dismiss</button>
        </div>
      )}

      <div className="bg-background rounded-2xl border border-border/80 shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input
            type="text" placeholder="Search action, resource, detail..."
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 bg-secondary/50 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex gap-1.5">
          {ACTION_FILTERS.map((f) => (
            <button key={f.value} onClick={() => { setActionFilter(f.value); setPage(1); }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${actionFilter === f.value ? "bg-primary/10 text-primary border border-primary/20" : "bg-secondary/50 text-muted-foreground hover:bg-muted/50"}`}>
              {f.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground ml-auto">{filtered.length} entries</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : paginated.length === 0 ? (
        <div className="p-12 text-center">
          <FileText className="mx-auto text-muted-foreground/30 mb-3" size={40} />
          <p className="text-muted-foreground text-sm">No audit entries yet</p>
          <p className="text-muted-foreground/60 text-xs mt-1">Actions taken via the admin panel will appear here</p>
        </div>
      ) : (
        <>
          <div className="bg-background rounded-2xl border border-border/80 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary/30">
                <tr>
                  <th className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Action</th>
                  <th className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Resource</th>
                  <th className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Detail</th>
                  <th className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">When</th>
                  <th className="p-4 w-10" />
                </tr>
              </thead>
              <tbody>
                {paginated.map((log) => (
                  <tr key={log.id} className="border-t border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-bold ${actionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-foreground">{log.resource}</td>
                    <td className="p-4 text-muted-foreground truncate max-w-[200px] hidden md:table-cell">{log.detail ?? "—"}</td>
                    <td className="p-4 text-muted-foreground whitespace-nowrap">{fmt(log.created_at)}</td>
                    <td className="p-4">
                      <button onClick={() => setSelected(log)} className="p-1 rounded-lg hover:bg-muted/50 text-muted-foreground">
                        <Search size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg bg-secondary/50 disabled:opacity-50"><ChevronLeft size={18} /></button>
              <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg bg-secondary/50 disabled:opacity-50"><ChevronRight size={18} /></button>
            </div>
          )}
        </>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
          <div className="bg-background rounded-3xl border border-border/80 shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h2 className="font-heading font-bold">Entry Detail</h2>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-muted/50"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-3 text-sm">
              <div><p className="text-xs text-muted-foreground mb-0.5">ID</p><p className="font-mono text-xs">{selected.id}</p></div>
              <div><p className="text-xs text-muted-foreground mb-0.5">Action</p><span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-bold ${actionColor(selected.action)}`}>{selected.action}</span></div>
              <div><p className="text-xs text-muted-foreground mb-0.5">Resource</p><p className="font-semibold">{selected.resource}</p></div>
              <div><p className="text-xs text-muted-foreground mb-0.5">Detail</p><p className="text-muted-foreground">{selected.detail ?? "—"}</p></div>
              <div><p className="text-xs text-muted-foreground mb-0.5">Timestamp</p><p className="font-semibold">{new Date(selected.created_at).toLocaleString()}</p></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
