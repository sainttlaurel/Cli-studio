"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Eye,
  EyeOff,
  Flag,
  Star,
  Trash2,
  MoreVertical,
  Download,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { getStoredAdminPassword } from "@/lib/admin-auth";
import type { GalleryModerationItem } from "@/lib/admin-types";

const FILTERS = [
  { value: "all",      label: "All"      },
  { value: "public",   label: "Public"   },
  { value: "private",  label: "Private"  },
  { value: "flagged",  label: "Flagged"  },
  { value: "featured", label: "Featured" },
] as const;

const SORT_OPTIONS = [
  { value: "newest",     label: "Newest"         },
  { value: "oldest",     label: "Oldest"         },
  { value: "popular",    label: "Most Viewed"    },
  { value: "downloaded", label: "Most Downloaded"},
] as const;

export default function AdminGalleryPage() {
  const [strips, setStrips] = useState<GalleryModerationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<string[]>(["all"]);
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [selectedStrip, setSelectedStrip] = useState<GalleryModerationItem | null>(null);

  const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

  const fetchStrips = async () => {
    try {
      setLoading(true);
      setError(null);
      const savedPassword = getStoredAdminPassword();
      if (!savedPassword) throw new Error("Not authenticated");

      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data, error: queryError } = await supabase
        .from("strips")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (queryError) throw queryError;

      // Map to GalleryModerationItem (fields not in DB default to false/null)
      const mapped = (data ?? []).map((s) => ({
        ...s,
        storage_path: s.storage_path ?? null,
        is_flagged: false,
        is_featured: false,
        flagged_reason: null,
        flagged_at: null,
        flagged_by: null,
      })) as GalleryModerationItem[];

      setStrips(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load strips");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStrips(); }, []);

  const filteredStrips = strips.filter((strip) => {
    if (
      searchQuery &&
      !strip.id.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !strip.caption?.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !strip.session_id.toLowerCase().includes(searchQuery.toLowerCase())
    ) return false;
    if (selectedFilters.includes("flagged")  && !strip.is_flagged)  return false;
    if (selectedFilters.includes("featured") && !strip.is_featured) return false;
    if (selectedFilters.includes("public")   && !strip.is_public)   return false;
    if (selectedFilters.includes("private")  &&  strip.is_public)   return false;
    if (selectedFilters.length === 1 && selectedFilters.includes("all")) return true;
    return true;
  });

  const sortedStrips = [...filteredStrips].sort((a, b) => {
    switch (sortBy) {
      case "newest":     return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case "oldest":     return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case "popular":    return b.view_count - a.view_count;
      case "downloaded": return b.download_count - a.download_count;
      default: return 0;
    }
  });

  const totalPages = Math.ceil(sortedStrips.length / itemsPerPage);
  const paginatedStrips = sortedStrips.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const update = (id: string, patch: Partial<GalleryModerationItem>) =>
    setStrips((s) => s.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const handleTogglePublic   = (strip: GalleryModerationItem) => update(strip.id, { is_public:   !strip.is_public   });
  const handleToggleFeatured = (strip: GalleryModerationItem) => update(strip.id, { is_featured: !strip.is_featured });
  const handleFlagStrip      = (strip: GalleryModerationItem) => {
    const reason = prompt("Reason for flagging:") || "Inappropriate content";
    update(strip.id, { is_flagged: true, flagged_reason: reason, flagged_at: new Date().toISOString(), flagged_by: "admin" });
  };
  const handleUnflagStrip    = (strip: GalleryModerationItem) =>
    update(strip.id, { is_flagged: false, flagged_reason: null, flagged_at: null, flagged_by: null });

  const handleDeleteStrip = async (strip: GalleryModerationItem) => {
    if (!confirm(`Delete strip ${strip.id}? This cannot be undone.`)) return;
    try {
      const savedPassword = getStoredAdminPassword();
      if (!savedPassword) return;
      const response = await fetch(`/api/admin?type=strip&id=${strip.id}`, {
        method: "DELETE",
        headers: { "x-admin-password": savedPassword },
      });
      if (!response.ok) throw new Error("Delete failed");
      setStrips((s) => s.filter((x) => x.id !== strip.id));
      setSelectedStrip(null);
    } catch {
      alert("Could not delete strip. Try again.");
    }
  };

  const handleToggleFilter = (filter: string) => {
    if (filter === "all") { setSelectedFilters(["all"]); return; }
    const without = selectedFilters.filter((f) => f !== "all");
    const next = without.includes(filter)
      ? without.filter((f) => f !== filter)
      : [...without, filter];
    setSelectedFilters(next.length ? next : ["all"]);
    setCurrentPage(1);
  };

  const fmt = (d: string) => new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Gallery Moderation</h1>
          <p className="text-muted-foreground mt-1">Review and manage all strips</p>
        </div>
        <button
          onClick={fetchStrips}
          className="flex items-center gap-2 px-4 py-2.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-bold rounded-xl transition-colors"
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-xl">
          <p className="text-sm text-destructive font-semibold">{error}</p>
          <button onClick={() => setError(null)} className="text-xs text-destructive/60 mt-1">Dismiss</button>
        </div>
      )}

      <div className="bg-background rounded-2xl border border-border/80 shadow-sm p-4 flex flex-col gap-3">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              type="text"
              placeholder="Search by ID, caption, session..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-2 bg-secondary/50 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => handleToggleFilter(f.value)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  selectedFilters.includes(f.value)
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "bg-secondary/50 text-muted-foreground hover:bg-muted/50"
                }`}
              >{f.label}</button>
            ))}
          </div>
          <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 bg-secondary/50 border border-border rounded-lg text-foreground text-sm">
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
            className="px-3 py-2 bg-secondary/50 border border-border rounded-lg text-foreground text-sm">
            {ITEMS_PER_PAGE_OPTIONS.map((o) => <option key={o} value={o}>{o} per page</option>)}
          </select>
        </div>
        <p className="text-xs text-muted-foreground">
          Showing {paginatedStrips.length} of {filteredStrips.length} strips ({strips.length} total)
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : paginatedStrips.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground">No strips found</div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {paginatedStrips.map((strip) => (
              <div key={strip.id} className="bg-background rounded-2xl border border-border/80 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="relative aspect-[3/4] bg-muted/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={strip.image_url} alt="Strip" className="w-full h-full object-cover" />
                  <div className="absolute top-1.5 left-1.5 flex flex-wrap gap-1">
                    {strip.is_public   && <span className="px-1.5 py-0.5 bg-background/80 text-[10px] font-bold rounded-full border border-border/50">Public</span>}
                    {strip.is_featured && <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-600 text-[10px] font-bold rounded-full">â˜…</span>}
                    {strip.is_flagged  && <span className="px-1.5 py-0.5 bg-destructive/20 text-destructive text-[10px] font-bold rounded-full">âš‘</span>}
                  </div>
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                    <button onClick={() => handleTogglePublic(strip)}   className="p-1.5 rounded-lg bg-background/80 text-foreground"    title={strip.is_public   ? "Make private" : "Make public"  }><Eye    size={13} /></button>
                    <button onClick={() => handleToggleFeatured(strip)} className="p-1.5 rounded-lg bg-background/80 text-amber-500"     title={strip.is_featured ? "Unfeature"    : "Feature"      }><Star   size={13} /></button>
                    <button onClick={() => strip.is_flagged ? handleUnflagStrip(strip) : handleFlagStrip(strip)} className="p-1.5 rounded-lg bg-background/80 text-destructive" title={strip.is_flagged ? "Unflag" : "Flag"}><Flag   size={13} /></button>
                    <button onClick={() => setSelectedStrip(strip)}     className="p-1.5 rounded-lg bg-background/80 text-foreground"    title="Details"                            ><MoreVertical size={13} /></button>
                  </div>
                </div>
                <div className="p-2">
                  <p className="text-[10px] font-semibold truncate">{strip.caption || "No caption"}</p>
                  <div className="flex gap-2 text-muted-foreground text-[10px] mt-0.5">
                    <span className="flex items-center gap-0.5"><Eye size={9} /> {strip.view_count}</span>
                    <span className="flex items-center gap-0.5"><Download size={9} /> {strip.download_count}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{fmt(strip.created_at)}</p>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-4">
              <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg bg-secondary/50 disabled:opacity-50"><ChevronLeft size={18} /></button>
              <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span>
              <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg bg-secondary/50 disabled:opacity-50"><ChevronRight size={18} /></button>
            </div>
          )}
        </>
      )}

      {selectedStrip && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setSelectedStrip(null)}>
          <div className="bg-background rounded-3xl border border-border/80 shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h2 className="text-base font-heading font-bold">Strip Details</h2>
              <button onClick={() => setSelectedStrip(null)} className="p-1.5 rounded-lg hover:bg-muted/50"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selectedStrip.image_url} alt="Strip" className="w-full rounded-2xl" />
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-muted-foreground text-xs mb-0.5">ID</p><p className="font-mono text-xs break-all">{selectedStrip.id}</p></div>
                <div><p className="text-muted-foreground text-xs mb-0.5">Session</p><p className="font-mono text-xs break-all">{selectedStrip.session_id}</p></div>
                <div><p className="text-muted-foreground text-xs mb-0.5">Theme</p><p className="font-semibold">{selectedStrip.theme || "â€”"}</p></div>
                <div><p className="text-muted-foreground text-xs mb-0.5">Filter</p><p className="font-semibold">{selectedStrip.filter || "â€”"}</p></div>
                <div><p className="text-muted-foreground text-xs mb-0.5">Views</p><p className="font-semibold">{selectedStrip.view_count}</p></div>
                <div><p className="text-muted-foreground text-xs mb-0.5">Downloads</p><p className="font-semibold">{selectedStrip.download_count}</p></div>
                <div className="col-span-2"><p className="text-muted-foreground text-xs mb-0.5">Caption</p><p className="font-semibold">{selectedStrip.caption || "None"}</p></div>
                <div className="col-span-2"><p className="text-muted-foreground text-xs mb-0.5">Created</p><p className="font-semibold">{fmt(selectedStrip.created_at)}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
                <button onClick={() => { handleTogglePublic(selectedStrip); setSelectedStrip(null); }} className="py-2 bg-muted/50 hover:bg-muted rounded-xl text-sm font-bold">{selectedStrip.is_public ? "Make Private" : "Make Public"}</button>
                <button onClick={() => { handleToggleFeatured(selectedStrip); setSelectedStrip(null); }} className="py-2 bg-muted/50 hover:bg-muted rounded-xl text-sm font-bold">{selectedStrip.is_featured ? "Unfeature" : "Feature"}</button>
                <button onClick={() => { selectedStrip.is_flagged ? handleUnflagStrip(selectedStrip) : handleFlagStrip(selectedStrip); setSelectedStrip(null); }} className="py-2 bg-muted/50 hover:bg-muted rounded-xl text-sm font-bold">{selectedStrip.is_flagged ? "Unflag" : "Flag"}</button>
                <button onClick={() => handleDeleteStrip(selectedStrip)} className="py-2 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-xl text-sm font-bold">Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
