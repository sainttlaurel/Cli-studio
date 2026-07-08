"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  User,
  Image as ImageIcon,
  Sticker,
  Palette,
  Settings as SettingsIcon,
  Flag,
  Trash2,
  Clock,
  Search,
  Filter,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { getStoredAdminPassword } from "@/lib/admin-auth";
import type { AuditLogEntry } from "@/lib/admin-types";

const ACTION_ICONS: Record<string, any> = {
  create: User,
  update: SettingsIcon,
  delete: Trash2,
  toggle: Palette,
  block: Flag,
  unblock: Flag,
  flag: Flag,
  unflag: Flag,
  feature: ImageIcon,
  unfeature: ImageIcon,
  export: FileText,
  import: FileText,
};

const RESOURCE_ICONS: Record<string, any> = {
  template: Palette,
  sticker_pack: Sticker,
  sticker: ImageIcon,
  strip: ImageIcon,
  session: User,
  settings: SettingsIcon,
  gallery: ImageIcon,
  message: FileText,
};

function generateMockAuditLogs(count: number): AuditLogEntry[] {
  const actions: AuditLogEntry["action"][] = [
    "create",
    "update",
    "delete",
    "toggle",
    "block",
    "unblock",
    "flag",
    "unflag",
    "feature",
    "unfeature",
  ];
  const resourceTypes: AuditLogEntry["resource_type"][] = [
    "template",
    "sticker_pack",
    "sticker",
    "strip",
    "session",
    "settings",
    "gallery",
  ];

  return Array.from({ length: count }, (_, i) => ({
    id: `audit-${Date.now() - i * 1000}`,
    admin_id: `admin-${Math.floor(Math.random() * 5) + 1}`,
    action: actions[Math.floor(Math.random() * actions.length)],
    resource_type:
      resourceTypes[Math.floor(Math.random() * resourceTypes.length)],
    resource_id: `${resourceTypes[Math.floor(Math.random() * resourceTypes.length)]}-${Math.floor(Math.random() * 1000)}`,
    details: { name: "Item name", old_value: "old", new_value: "new" },
    ip_address: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    user_agent: Math.random() > 0.5 ? "Chrome/Mac" : "Safari/iPhone",
    created_at: new Date(Date.now() - i * 1000 * 60 * 5).toISOString(),
  }));
}

const FILTERS = [
  { value: "all", label: "All Actions" },
  { value: "create", label: "Created" },
  { value: "update", label: "Updated" },
  { value: "delete", label: "Deleted" },
  { value: "block", label: "Blocked" },
  { value: "flag", label: "Flagged" },
] as const;

const RESOURCE_FILTERS = [
  { value: "all", label: "All Resources" },
  { value: "template", label: "Templates" },
  { value: "sticker_pack", label: "Sticker Packs" },
  { value: "sticker", label: "Stickers" },
  { value: "strip", label: "Strips" },
  { value: "session", label: "Sessions" },
  { value: "settings", label: "Settings" },
] as const;

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [resourceFilter, setResourceFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

  useEffect(() => {
    async function fetchAuditLogs() {
      try {
        setLoading(true);
        const savedPassword = getStoredAdminPassword();
        if (!savedPassword) throw new Error("Not authenticated");
        const mockLogs = generateMockAuditLogs(200);
        setLogs(mockLogs);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load audit logs",
        );
      } finally {
        setLoading(false);
      }
    }
    fetchAuditLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (
      searchQuery &&
      !log.id.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !log.admin_id.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !log.resource_id.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    if (actionFilter !== "all" && log.action !== actionFilter) return false;
    if (resourceFilter !== "all" && log.resource_type !== resourceFilter)
      return false;
    return true;
  });

  const sortedLogs = [...filteredLogs].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  const totalPages = Math.ceil(sortedLogs.length / itemsPerPage);
  const paginatedLogs = sortedLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getActionIcon = (action: string) => ACTION_ICONS[action] || FileText;
  const getResourceIcon = (resource: string) =>
    RESOURCE_ICONS[resource] || FileText;

  const getActionColor = (action: string) => {
    if (
      action.includes("delete") ||
      action.includes("block") ||
      action.includes("flag")
    )
      return "text-destructive bg-destructive/10";
    if (
      action.includes("create") ||
      action.includes("feature") ||
      action.includes("import")
    )
      return "text-emerald-600 bg-emerald-500/10";
    if (
      action.includes("update") ||
      action.includes("toggle") ||
      action.includes("un")
    )
      return "text-violet-600 bg-violet-500/10";
    return "text-muted-foreground bg-muted/50";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">
            Audit Log
          </h1>
          <p className="text-muted-foreground mt-1">
            Track all administrative actions
          </p>
        </div>
        <button
          onClick={() => {
            setLoading(true);
            setTimeout(() => setLoading(false), 1000);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-bold rounded-xl transition-colors"
        >
          <RefreshCw size={18} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-xl">
          <p className="text-sm text-destructive font-semibold">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-xs text-destructive/60 mt-1"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="bg-background rounded-2xl border border-border/80 shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={18}
            />
            <input
              type="text"
              placeholder="Search by ID, admin, or resource..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-secondary/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2.5 bg-secondary/50 border border-border rounded-xl text-foreground"
          >
            {FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
          <select
            value={resourceFilter}
            onChange={(e) => {
              setResourceFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2.5 bg-secondary/50 border border-border rounded-xl text-foreground"
          >
            {RESOURCE_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-3 py-2.5 bg-secondary/50 border border-border rounded-xl text-foreground"
          >
            {ITEMS_PER_PAGE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt} per page
              </option>
            ))}
          </select>
        </div>
        <div className="mt-4 pt-4 border-t border-border/50 text-sm text-muted-foreground">
          Showing {paginatedLogs.length} of {filteredLogs.length} entries
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : paginatedLogs.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground">
          <p>No audit log entries found</p>
        </div>
      ) : (
        <>
          <div className="bg-background rounded-2xl border border-border/80 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary/30">
                <tr>
                  <th className="p-4 text-left font-semibold text-muted-foreground uppercase tracking-wide">
                    Action
                  </th>
                  <th className="p-4 text-left font-semibold text-muted-foreground uppercase tracking-wide">
                    Resource
                  </th>
                  <th className="p-4 text-left font-semibold text-muted-foreground uppercase tracking-wide">
                    Admin
                  </th>
                  <th className="p-4 text-left font-semibold text-muted-foreground uppercase tracking-wide">
                    Details
                  </th>
                  <th className="p-4 text-left font-semibold text-muted-foreground uppercase tracking-wide">
                    When
                  </th>
                  <th className="p-4 text-left font-semibold text-muted-foreground uppercase tracking-wide">
                    &nbsp;
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedLogs.map((log) => {
                  const ActionIcon = getActionIcon(log.action);
                  const ResourceIcon = getResourceIcon(log.resource_type);
                  const color = getActionColor(log.action);

                  return (
                    <tr
                      key={log.id}
                      className="border-t border-border/50 hover:bg-muted/50 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className={`p-2 rounded-lg ${color}`}>
                            <ActionIcon size={16} />
                          </span>
                          <span className="font-semibold text-foreground">
                            {log.action}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="p-2 rounded-lg bg-muted/50">
                            <ResourceIcon
                              size={16}
                              className="text-muted-foreground"
                            />
                          </span>
                          <span className="font-semibold text-foreground">
                            {log.resource_type.replace("_", " ")}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-semibold text-foreground">
                          {log.admin_id}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {log.ip_address}
                        </p>
                      </td>
                      <td className="p-4">
                        <p className="font-semibold text-foreground truncate">
                          {log.resource_id}
                        </p>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-muted-foreground">
                          {formatDate(log.created_at)}
                        </p>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground"
                        >
                          <MoreVertical size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-4">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-secondary/50 disabled:opacity-50"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-secondary/50 disabled:opacity-50"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}

      {selectedLog && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="bg-background rounded-3xl border border-border/80 shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-heading font-bold">
                Audit Entry Details
              </h2>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-lg hover:bg-muted/50"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="bg-secondary/30 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                  Action
                </h3>
                <div className="flex items-center gap-3">
                  <span
                    className={`p-3 rounded-xl ${getActionColor(selectedLog.action)}`}
                  >
                    {getActionIcon(selectedLog.action)({ size: 24 })}
                  </span>
                  <div>
                    <p className="font-bold text-xl text-foreground">
                      {selectedLog.action}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedLog.resource_type.replace("_", " ")} -{" "}
                      {selectedLog.resource_id}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground uppercase text-xs mb-1">
                    Entry ID
                  </p>
                  <p className="font-mono font-semibold">{selectedLog.id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground uppercase text-xs mb-1">
                    Timestamp
                  </p>
                  <p className="font-semibold">
                    {formatDate(selectedLog.created_at)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground uppercase text-xs mb-1">
                    Admin ID
                  </p>
                  <p className="font-semibold">{selectedLog.admin_id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground uppercase text-xs mb-1">
                    IP Address
                  </p>
                  <p className="font-mono">{selectedLog.ip_address}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground uppercase text-xs mb-1">
                    User Agent
                  </p>
                  <p className="font-semibold">{selectedLog.user_agent}</p>
                </div>
              </div>

              {selectedLog.details && (
                <div className="bg-secondary/30 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                    Details
                  </h3>
                  <pre className="text-xs text-muted-foreground overflow-x-auto">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-sm text-amber-600">
        <strong>Note:</strong> Audit logs will be pulled from database in
        production. Current view shows mock data.
      </div>
    </div>
  );
}

import { X } from "lucide-react";
