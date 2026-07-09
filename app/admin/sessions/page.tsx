"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Ban,
  CheckCircle,
  Clock,
  Trash2,
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  X,
} from "lucide-react";
import { getStoredAdminPassword } from "@/lib/admin-auth";
import type { SessionRow } from "@/lib/admin-types";


export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [selectedSession, setSelectedSession] = useState<SessionRow | null>(
    null,
  );

  const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];


  // Fetch from API
  useEffect(() => {
    async function fetchSessions() {
      try {
        setLoading(true);
        setError(null);
        const savedPassword = getStoredAdminPassword();
        if (!savedPassword) throw new Error("Not authenticated");
        
        const response = await fetch(
          `/api/admin/sessions?page=${currentPage}&pageSize=${itemsPerPage}`,
          {
            headers: {
              "x-admin-password": savedPassword,
            },
          }
        );
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const apiData = await response.json();
        setSessions(apiData.data || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load sessions"
        );
      } finally {
        setLoading(false);
      }
    }
    fetchSessions();
  }, [currentPage, itemsPerPage]);

  // Search functionality
  useEffect(() => {
    if (searchQuery) {
      const timer = setTimeout(async () => {
        try {
          setLoading(true);
          const savedPassword = getStoredAdminPassword();
          if (!savedPassword) return;
          
          const response = await fetch(
            `/api/admin/sessions?page=1&pageSize=${itemsPerPage}&search=${encodeURIComponent(searchQuery)}`,
            {
              headers: {
                "x-admin-password": savedPassword,
              },
            }
          );
          
          if (response.ok) {
            const apiData = await response.json();
            setSessions(apiData.data || []);
            setCurrentPage(1);
          }
        } catch (err) {
          console.error("Search failed:", err);
        } finally {
          setLoading(false);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, itemsPerPage]);


  const filteredSessions = sessions.filter((session) => {
    if (!searchQuery) return true;
    return (
      session.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.ip_address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.user_agent?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const sortedSessions = [...filteredSessions].sort(
    (a, b) =>
      new Date(b.last_active_at).getTime() -
      new Date(a.last_active_at).getTime(),
  );

  const totalPages = Math.ceil(sortedSessions.length / itemsPerPage);
  const paginatedSessions = sortedSessions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handleToggleBlock = (session: SessionRow) => {
    const reason = session.is_blocked
      ? null
      : prompt("Enter reason for blocking:") || "Admin action";
    setSessions(
      sessions.map((s) =>
        s.id === session.id
          ? {
              ...s,
              is_blocked: !s.is_blocked,
              blocked_reason: s.is_blocked ? null : reason,
            }
          : s,
      ),
    );
  };

  const handleDeleteSession = (session: SessionRow) => {
    if (!confirm(`Are you sure you want to delete session ${session.id}?`))
      return;
    setSessions(sessions.filter((s) => s.id !== session.id));
  };

  const handleRefresh = async () => {
    try {
      setLoading(true);
      const savedPassword = getStoredAdminPassword();
      if (!savedPassword) return;
      const response = await fetch(
        `/api/admin/sessions?page=${currentPage}&pageSize=${itemsPerPage}`,
        {
          headers: {
            "x-admin-password": savedPassword,
          },
        }
      );
      if (response.ok) {
        const apiData = await response.json();
        setSessions(apiData.data || []);
      }
    } catch (err) {
      console.error("Refresh failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">
            Sessions
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage user sessions and block abusive users
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
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={18}
            />
            <input
              type="text"
              placeholder="Search sessions by ID, IP, or user agent..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-secondary/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-secondary/50 border border-border rounded-lg text-foreground text-sm whitespace-nowrap"
          >
            {ITEMS_PER_PAGE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt} per page
              </option>
            ))}
          </select>
        </div>
        <div className="mt-4 pt-4 border-t border-border/50 text-sm text-muted-foreground">
          Showing {paginatedSessions.length} of {filteredSessions.length}{" "}
          sessions
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : paginatedSessions.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground">
          <p>No sessions found</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedSessions.map((session) => (
              <div
                key={session.id}
                className="bg-background rounded-2xl border border-border/80 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded-lg text-xs font-bold ${
                          session.is_blocked
                            ? "bg-destructive/20 text-destructive"
                            : "bg-emerald-500/20 text-emerald-600"
                        }`}
                      >
                        {session.is_blocked ? "BLOCKED" : "ACTIVE"}
                      </span>
                      <p className="font-semibold text-foreground">
                        {session.id.slice(0, 12)}...
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedSession(session)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <MoreVertical size={18} />
                    </button>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase mb-0.5">
                          Created
                        </p>
                        <p className="font-semibold">
                          {formatDate(session.created_at)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase mb-0.5">
                          Last Active
                        </p>
                        <p className="font-semibold">
                          {formatDate(session.last_active_at)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase mb-0.5">
                          Strips
                        </p>
                        <p className="font-semibold">{session.strip_count}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase mb-0.5">
                          IP
                        </p>
                        <p className="font-mono text-xs">
                          {session.ip_address}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {session.user_agent}
                    </p>
                  </div>
                </div>
                <div className="p-3 border-t border-border/50 bg-secondary/30">
                  <button
                    onClick={() => handleToggleBlock(session)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors flex-1 ${
                      session.is_blocked
                        ? "bg-emerald-500/20 text-emerald-600 hover:bg-emerald-500/30"
                        : "bg-destructive/10 text-destructive hover:bg-destructive/20"
                    }`}
                  >
                    {session.is_blocked ? (
                      <CheckCircle size={14} className="inline mr-1" />
                    ) : (
                      <Ban size={14} className="inline mr-1" />
                    )}
                    {session.is_blocked ? "Unblock" : "Block"}
                  </button>
                </div>
              </div>
            ))}
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

      {selectedSession && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedSession(null)}
        >
          <div
            className="bg-background rounded-3xl border border-border/80 shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-heading font-bold">
                Session Details
              </h2>
              <button
                onClick={() => setSelectedSession(null)}
                className="p-1.5 rounded-lg hover:bg-muted/50"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground uppercase text-xs mb-1">
                    Session ID
                  </p>
                  <p className="font-mono font-semibold">
                    {selectedSession.id}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground uppercase text-xs mb-1">
                    Status
                  </p>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      selectedSession.is_blocked
                        ? "bg-destructive/20 text-destructive"
                        : "bg-emerald-500/20 text-emerald-600"
                    }`}
                  >
                    {selectedSession.is_blocked ? "BLOCKED" : "ACTIVE"}
                  </span>
                </div>
                <div>
                  <p className="text-muted-foreground uppercase text-xs mb-1">
                    IP Address
                  </p>
                  <p className="font-mono">{selectedSession.ip_address}</p>
                </div>
                <div>
                  <p className="text-muted-foreground uppercase text-xs mb-1">
                    User Agent
                  </p>
                  <p className="truncate">{selectedSession.user_agent}</p>
                </div>
                <div>
                  <p className="text-muted-foreground uppercase text-xs mb-1">
                    Created
                  </p>
                  <p>{formatDate(selectedSession.created_at)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground uppercase text-xs mb-1">
                    Last Active
                  </p>
                  <p>{formatDate(selectedSession.last_active_at)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground uppercase text-xs mb-1">
                    Total Strips
                  </p>
                  <p className="text-2xl font-heading font-bold">
                    {selectedSession.strip_count}
                  </p>
                </div>
                {selectedSession.is_blocked && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground uppercase text-xs mb-1">
                      Block Reason
                    </p>
                    <p>{selectedSession.blocked_reason}</p>
                  </div>
                )}
              </div>
              <div className="bg-secondary/30 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                  Actions
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      handleToggleBlock(selectedSession);
                      setSelectedSession(null);
                    }}
                    className={`py-2 rounded-lg text-sm font-bold transition-colors ${
                      selectedSession.is_blocked
                        ? "bg-emerald-500/20 text-emerald-600 hover:bg-emerald-500/30"
                        : "bg-destructive/10 text-destructive hover:bg-destructive/20"
                    }`}
                  >
                    {selectedSession.is_blocked
                      ? "Unblock Session"
                      : "Block Session"}
                  </button>
                  <button
                    onClick={() => {
                      handleDeleteSession(selectedSession);
                      setSelectedSession(null);
                    }}
                    className="py-2 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-lg text-sm font-bold"
                  >
                    Delete Session
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 text-sm text-blue-600 text-center">
        <strong>Note:</strong> Showing live session data from Supabase. IP and User Agent will show as &quot;N/A&quot; until database schema is updated.
      </div>
    </div>
  );
}
