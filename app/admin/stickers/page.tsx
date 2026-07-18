"use client";

import { useState, useEffect, useRef, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Upload,
  X,
  Loader2,
  MoreVertical,
  ArrowUp,
  ArrowDown,
  FolderOpen,
  Search,
  Image as ImageIcon,
} from "lucide-react";
import { getStoredAdminPassword } from "@/lib/admin-auth";
import type { StickerPackRow, StickerRow } from "@/lib/admin-types";
import { getStickerConfig, savePacksConfig } from "@/lib/sticker-config";

// Local sticker packs for now (will migrate to DB)
const LOCAL_PACKS = [
  {
    id: "y2k-text",
    name: "Y2K Text",
    emoji: "⭐",
    is_active: true,
    sort_order: 1,
    description: "Original text badge stickers",
    created_at: new Date("2024-01-01").toISOString(),
    updated_at: new Date("2024-01-01").toISOString(),
  },
  {
    id: "collage",
    name: "Collage",
    emoji: "🎓",
    is_active: true,
    sort_order: 2,
    description: "Education-themed stickers",
    created_at: new Date("2024-01-01").toISOString(),
    updated_at: new Date("2024-01-01").toISOString(),
  },
  {
    id: "flowers",
    name: "Flowers",
    emoji: "🌸",
    is_active: true,
    sort_order: 3,
    description: "Floral stickers",
    created_at: new Date("2024-01-01").toISOString(),
    updated_at: new Date("2024-01-01").toISOString(),
  },
  {
    id: "ribbon",
    name: "Ribbon",
    emoji: "🎀",
    is_active: true,
    sort_order: 4,
    description: "Decorative ribbon stickers",
    created_at: new Date("2024-01-01").toISOString(),
    updated_at: new Date("2024-01-01").toISOString(),
  },
  {
    id: "y2k",
    name: "Y2K Images",
    emoji: "✨",
    is_active: true,
    sort_order: 5,
    description: "Y2K-themed image stickers",
    created_at: new Date("2024-01-01").toISOString(),
    updated_at: new Date("2024-01-01").toISOString(),
  },
];

const PACK_STICKERS: Record<string, { name: string; file: string }[]> = {
  "y2k-text": [
    { name: "Love", file: "y2k-text-love.png" },
    { name: "XOXO", file: "y2k-text-xoxo.png" },
    { name: "BFF", file: "y2k-text-bff.png" },
    { name: "Wow", file: "y2k-text-wow.png" },
    { name: "Cute", file: "y2k-text-cute.png" },
    { name: "Flash", file: "y2k-text-flash.png" },
  ],
  collage: Array.from({ length: 10 }, (_, i) => ({
    name: `Collage ${i + 1}`,
    file: `collage/${i + 1}.png`,
  })),
  flowers: Array.from({ length: 10 }, (_, i) => ({
    name: `Flower ${i + 1}`,
    file: `flowers/${i + 1}.png`,
  })),
  ribbon: Array.from({ length: 10 }, (_, i) => ({
    name: `Ribbon ${i + 1}`,
    file: `ribbon/${i + 1}.png`,
  })),
  y2k: Array.from({ length: 10 }, (_, i) => ({
    name: `Y2K ${i + 1}`,
    file: `y2k/${i + 1}.png`,
  })),
};

interface PackWithStickers extends StickerPackRow {
  stickers: { id: string; name: string; file: string; is_active: boolean }[];
}

export default function AdminStickersPage() {
  const router = useRouter();
  const [packs, setPacks] = useState<PackWithStickers[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [showCreatePackModal, setShowCreatePackModal] = useState(false);
  const [showUploadStickerModal, setShowUploadStickerModal] = useState(false);
  const [showEditPackModal, setShowEditPackModal] = useState(false);
  const [selectedPack, setSelectedPack] = useState<PackWithStickers | null>(
    null,
  );

  // Form states
  const [packForm, setPackForm] = useState({
    id: "",
    name: "",
    emoji: "",
    description: "",
    sort_order: 0,
  });
  const [stickerUploadProgress, setStickerUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load packs from local data
    const packsWithStickers = LOCAL_PACKS.map((pack) => ({
      ...pack,
      stickers:
        PACK_STICKERS[pack.id]?.map((s, i) => ({
          id: `${pack.id}-${i}`,
          name: s.name,
          file: s.file,
          is_active: true,
        })) || [],
    }));

    // Merge with saved configuration from localStorage
    const config = getStickerConfig();
    const packsWithConfig = packsWithStickers.map((pack) => {
      const packConfig = config.packs[pack.id];
      return {
        ...pack,
        is_active: packConfig?.is_active !== false ? pack.is_active : false,
        stickers: pack.stickers.map((sticker) => {
          // Map admin sticker id to sticker key
          let stickerKey: string | null = null;
          if (pack.id === "y2k-text") {
            const textKeys = ["love", "xoxo", "bff", "wow", "cute", "flash"];
            const index = parseInt(sticker.id.split("-").pop() || "");
            stickerKey = textKeys[index] || null;
          } else {
            const parts = sticker.id.split("-");
            if (parts.length >= 2) {
              const idx = parseInt(parts[parts.length - 1]);
              if (!isNaN(idx)) {
                stickerKey = `${pack.id}-${idx + 1}`;
              }
            }
          }

          const isActive = packConfig?.stickers[stickerKey || ""];
          return {
            ...sticker,
            is_active: isActive !== undefined ? isActive : true,
          };
        }),
      };
    });

    setPacks(packsWithConfig);
    setLoading(false);
  }, []);

  const filteredPacks = packs.filter(
    (pack) =>
      pack.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pack.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pack.id.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleTogglePackActive = async (pack: StickerPackRow) => {
    try {
      const savedPassword = getStoredAdminPassword();
      if (!savedPassword) throw new Error("Not authenticated");

      // Update state and persist to localStorage
      const updatedPacks = packs.map((p) =>
        p.id === pack.id ? { ...p, is_active: !p.is_active } : p,
      );
      setPacks(updatedPacks);
      savePacksConfig(updatedPacks);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update pack");
    }
  };

  const handleToggleStickerActive = (packId: string, stickerId: string) => {
    const updatedPacks = packs.map((pack) =>
      pack.id === packId
        ? {
            ...pack,
            stickers: pack.stickers.map((s) =>
              s.id === stickerId ? { ...s, is_active: !s.is_active } : s,
            ),
          }
        : pack,
    );
    setPacks(updatedPacks);
    savePacksConfig(updatedPacks);
  };

  const handleDeletePack = async (packId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this pack? All stickers in it will also be deleted.",
      )
    )
      return;

    try {
      const savedPassword = getStoredAdminPassword();
      if (!savedPassword) throw new Error("Not authenticated");

      // API call would go here
      setPacks(packs.filter((p) => p.id !== packId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete pack");
    }
  };

  const handleReorderPacks = (fromIndex: number, toIndex: number) => {
    const newPacks = [...packs];
    const [moved] = newPacks.splice(fromIndex, 1);
    newPacks.splice(toIndex, 1, moved);
    setPacks(newPacks.map((p, i) => ({ ...p, sort_order: i + 1 })));
  };

  const handleReorderStickers = (
    packId: string,
    fromIndex: number,
    toIndex: number,
  ) => {
    setPacks(
      packs.map((pack) =>
        pack.id === packId
          ? {
              ...pack,
              stickers: [...pack.stickers].sort((a, b) => {
                if (a.id === pack.stickers[fromIndex]?.id) return 1;
                if (b.id === pack.stickers[fromIndex]?.id) return -1;
                return 0;
              }),
            }
          : pack,
      ),
    );
  };

  const handleCreatePack = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const savedPassword = getStoredAdminPassword();
      if (!savedPassword) throw new Error("Not authenticated");

      const newPack: PackWithStickers = {
        ...packForm,
        id: packForm.id || `pack-${Date.now()}`,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: null,
        stickers: [],
      };

      setPacks([...packs, newPack]);
      setShowCreatePackModal(false);
      setPackForm({
        id: "",
        name: "",
        emoji: "",
        description: "",
        sort_order: packs.length + 1,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create pack");
    }
  };

  const handleUploadSticker = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      setStickerUploadProgress(0);

      // Simulate upload progress
      const interval = setInterval(() => {
        setStickerUploadProgress((prev) => {
          const next = prev + 10;
          if (next >= 100) {
            clearInterval(interval);
            setUploading(false);
            return 100;
          }
          return next;
        });
      }, 200);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload sticker");
      setUploading(false);
    }
  };

  const handleImportPack = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      // In production, handle ZIP import
      // For now, just show success message
      alert("ZIP import feature coming soon!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import pack");
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">
            Sticker Packs
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage sticker packs and individual stickers
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={18}
            />
            <input
              type="text"
              placeholder="Search packs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-secondary/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 w-48 md:w-64"
            />
          </div>
          <button
            onClick={() => setShowCreatePackModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-colors shadow-lg shadow-primary/30"
          >
            <Plus size={18} />
            <span className="hidden md:inline">New Pack</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-bold rounded-xl transition-colors"
          >
            <FolderOpen size={18} />
            <span className="hidden md:inline">Import ZIP</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportPack}
            accept=".zip"
            className="hidden"
          />
        </div>
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

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Packs List */}
          <div className="bg-background rounded-2xl border border-border/80 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border/50 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                All Sticker Packs ({filteredPacks.length})
              </h2>
            </div>

            {filteredPacks.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <p>No sticker packs found</p>
                <p className="text-sm mt-1">
                  Try adjusting your search or create a new pack
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {filteredPacks.map((pack, packIndex) => (
                  <div
                    key={pack.id}
                    className="p-6 hover:bg-muted/50 transition-colors"
                  >
                    {/* Pack Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => handleTogglePackActive(pack)}
                          className={`p-2 rounded-lg transition-colors ${
                            pack.is_active
                              ? "text-foreground bg-muted/50 hover:bg-muted"
                              : "text-muted-foreground hover:bg-muted/50"
                          }`}
                          title={
                            pack.is_active ? "Disable pack" : "Enable pack"
                          }
                        >
                          {pack.is_active ? (
                            <Eye size={18} />
                          ) : (
                            <EyeOff size={18} />
                          )}
                        </button>
                        <div>
                          <p className="text-xl font-heading font-bold text-foreground">
                            <span className="mr-2">{pack.emoji}</span>
                            {pack.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {pack.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedPack(pack);
                            setShowUploadStickerModal(true);
                          }}
                          className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-xs rounded-lg transition-colors"
                        >
                          + Add Sticker
                        </button>
                        <button
                          onClick={() => {
                            setSelectedPack(pack);
                            setShowEditPackModal(true);
                            setPackForm({
                              id: pack.id,
                              name: pack.name,
                              emoji: pack.emoji,
                              description: pack.description || "",
                              sort_order: pack.sort_order,
                            });
                          }}
                          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                          title="Edit pack"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDeletePack(pack.id)}
                          className="p-2 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Delete pack"
                        >
                          <Trash2 size={18} />
                        </button>
                        <button
                          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                          title="Reorder"
                        >
                          <MoreVertical size={18} />
                        </button>
                      </div>
                    </div>

                    {/* Stickers Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                      {pack.stickers.map((sticker) => (
                        <div
                          key={sticker.id}
                          className={`relative group rounded-xl overflow-hidden border-2 transition-all ${
                            sticker.is_active
                              ? "border-border/50 hover:border-primary/30"
                              : "border-destructive/20 opacity-50"
                          }`}
                        >
                          <div className="aspect-square bg-muted/30 relative">
                            {/* Sticker preview */}
                            <div className="absolute inset-2 flex items-center justify-center">
                              {sticker.file.includes("y2k-text") ? (
                                <div className="bg-gradient-to-br from-pink-400 to-purple-500 p-2 rounded-lg">
                                  <span className="text-white font-bold text-xs">
                                    TEXT
                                  </span>
                                </div>
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                                  <ImageIcon
                                    size={24}
                                    className="text-primary/60"
                                  />
                                </div>
                              )}
                            </div>

                            {/* Overlay actions */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <button
                                onClick={() =>
                                  handleToggleStickerActive(pack.id, sticker.id)
                                }
                                className="p-1.5 rounded-lg bg-background/80 backdrop-blur-sm text-foreground"
                                title={sticker.is_active ? "Disable" : "Enable"}
                              >
                                {sticker.is_active ? (
                                  <Eye size={14} />
                                ) : (
                                  <EyeOff size={14} />
                                )}
                              </button>
                              <button
                                className="p-1.5 rounded-lg bg-background/80 backdrop-blur-sm text-destructive"
                                title="Delete"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>

                            {/* Inactive overlay */}
                            {!sticker.is_active && (
                              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                <EyeOff size={20} className="text-white/60" />
                              </div>
                            )}
                          </div>
                          <div className="p-2 text-center">
                            <p className="text-xs font-semibold truncate">
                              {sticker.name}
                            </p>
                          </div>
                        </div>
                      ))}

                      {/* Empty state for stickers */}
                      {pack.stickers.length === 0 && (
                        <div className="col-span-full p-8 text-center text-muted-foreground text-sm">
                          This pack has no stickers yet. Add one to get started!
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Pack Modal */}
      {showCreatePackModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowCreatePackModal(false)}
        >
          <div
            className="bg-background rounded-3xl border border-border/80 shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-heading font-bold">
                Create New Pack
              </h2>
              <button
                onClick={() => setShowCreatePackModal(false)}
                className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleCreatePack}
              className="p-6 flex flex-col gap-4"
            >
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold text-muted-foreground">
                  Pack ID *
                </span>
                <input
                  type="text"
                  value={packForm.id}
                  onChange={(e) =>
                    setPackForm({ ...packForm, id: e.target.value })
                  }
                  className="px-3 py-2.5 bg-secondary/50 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g., halloween-2024"
                  pattern="[a-z0-9-]+"
                  title="Use lowercase letters, numbers, and hyphens only"
                  required
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold text-muted-foreground">
                  Name *
                </span>
                <input
                  type="text"
                  value={packForm.name}
                  onChange={(e) =>
                    setPackForm({ ...packForm, name: e.target.value })
                  }
                  className="px-3 py-2.5 bg-secondary/50 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g., Halloween Pack"
                  required
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold text-muted-foreground">
                  Emoji *
                </span>
                <input
                  type="text"
                  value={packForm.emoji}
                  onChange={(e) =>
                    setPackForm({ ...packForm, emoji: e.target.value })
                  }
                  className="px-3 py-2.5 bg-secondary/50 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g., 🎃"
                  maxLength={2}
                  required
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold text-muted-foreground">
                  Description
                </span>
                <textarea
                  value={packForm.description}
                  onChange={(e) =>
                    setPackForm({ ...packForm, description: e.target.value })
                  }
                  className="px-3 py-2.5 bg-secondary/50 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[80px] resize-none"
                  placeholder="Describe this sticker pack..."
                />
              </label>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/50">
                <button
                  type="button"
                  onClick={() => setShowCreatePackModal(false)}
                  className="px-6 py-2.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-colors shadow-lg shadow-primary/30"
                >
                  <Plus size={16} />
                  <span>Create Pack</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Sticker Modal */}
      {showUploadStickerModal && selectedPack && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowUploadStickerModal(false);
            setSelectedPack(null);
          }}
        >
          <div
            className="bg-background rounded-3xl border border-border/80 shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-heading font-bold">
                Add Sticker to {selectedPack.name}
              </h2>
              <button
                onClick={() => {
                  setShowUploadStickerModal(false);
                  setSelectedPack(null);
                }}
                className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {uploading ? (
                <div className="space-y-4">
                  <div className="relative h-4 w-full rounded-full bg-secondary/50 overflow-hidden">
                    <div
                      className="absolute top-0 left-0 h-full bg-primary transition-all duration-200"
                      style={{ width: `${stickerUploadProgress}%` }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-primary-foreground">
                      {stickerUploadProgress}%
                    </span>
                  </div>
                  <p className="text-center text-muted-foreground">
                    Uploading sticker...
                  </p>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed border-border/50 rounded-2xl p-8 text-center cursor-pointer hover:border-primary/30 hover:bg-muted/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload
                    size={48}
                    className="mx-auto text-muted-foreground mb-4"
                  />
                  <p className="font-bold text-foreground mb-1">
                    Upload Sticker PNG
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Drag & drop or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-2">
                    Recommended: Transparent PNG, 512x512 or smaller
                  </p>
                </div>
              )}

              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => handleUploadSticker(e.target.files)}
                accept="image/png"
                className="hidden"
              />

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/50">
                <button
                  onClick={() => {
                    setShowUploadStickerModal(false);
                    setSelectedPack(null);
                  }}
                  className="px-6 py-2.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Pack Modal (reuses create pack modal logic) */}
      {showEditPackModal && selectedPack && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowEditPackModal(false);
            setSelectedPack(null);
          }}
        >
          <div
            className="bg-background rounded-3xl border border-border/80 shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-heading font-bold">Edit Pack</h2>
              <button
                onClick={() => {
                  setShowEditPackModal(false);
                  setSelectedPack(null);
                }}
                className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setPacks(
                  packs.map((p) =>
                    p.id === selectedPack.id ? { ...p, ...packForm } : p,
                  ),
                );
                setShowEditPackModal(false);
                setSelectedPack(null);
              }}
              className="p-6 flex flex-col gap-4"
            >
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold text-muted-foreground">
                  Pack ID *
                </span>
                <input
                  type="text"
                  value={packForm.id}
                  onChange={(e) =>
                    setPackForm({ ...packForm, id: e.target.value })
                  }
                  className="px-3 py-2.5 bg-secondary/50 border border-border rounded-lg text-foreground"
                  readOnly
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold text-muted-foreground">
                  Name *
                </span>
                <input
                  type="text"
                  value={packForm.name}
                  onChange={(e) =>
                    setPackForm({ ...packForm, name: e.target.value })
                  }
                  className="px-3 py-2.5 bg-secondary/50 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold text-muted-foreground">
                  Emoji *
                </span>
                <input
                  type="text"
                  value={packForm.emoji}
                  onChange={(e) =>
                    setPackForm({ ...packForm, emoji: e.target.value })
                  }
                  className="px-3 py-2.5 bg-secondary/50 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  maxLength={2}
                  required
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold text-muted-foreground">
                  Description
                </span>
                <textarea
                  value={packForm.description}
                  onChange={(e) =>
                    setPackForm({ ...packForm, description: e.target.value })
                  }
                  className="px-3 py-2.5 bg-secondary/50 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[80px] resize-none"
                  placeholder="Describe this sticker pack..."
                />
              </label>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/50">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditPackModal(false);
                    setSelectedPack(null);
                  }}
                  className="px-6 py-2.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-colors shadow-lg shadow-primary/30"
                >
                  <Edit2 size={16} />
                  <span>Update Pack</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
