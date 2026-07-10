"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Camera,
  Loader2,
  Trash2,
  Globe,
  GlobeLock,
  Eye,
  Download,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getSessionId } from "@/lib/session";
import { LanguageDropdown } from "@/components/LanguageSwitcher";
import type { Strip } from "@/lib/types";

type Status = "loading" | "ready" | "error";

export default function HistoryPage() {
  const [strips, setStrips] = useState<Strip[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setStatus("loading");
      const userId = await getSessionId();
      const { data, error: queryError } = await supabase
        .from("strips")
        .select("*")
        .eq("session_id", userId)
        .order("created_at", { ascending: false });
      if (queryError) throw queryError;
      setStrips((data ?? []) as Strip[]);
      setStatus("ready");
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Could not load your strips.",
      );
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (id: string) => {
    if (!window.confirm("Delete this strip? This cannot be undone.")) return;
    setBusyId(id);
    try {
      const { error: deleteError } = await supabase
        .from("strips")
        .delete()
        .eq("id", id);
      if (deleteError) throw deleteError;
      setStrips((s) => s.filter((strip) => strip.id !== id));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      window.alert("Could not delete that strip. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const toggleGallery = async (strip: Strip) => {
    setBusyId(strip.id);
    try {
      const { error: updateError } = await supabase
        .from("strips")
        .update({ is_public: !strip.is_public })
        .eq("id", strip.id);
      if (updateError) throw updateError;
      setStrips((s) =>
        s.map((x) =>
          x.id === strip.id ? { ...x, is_public: !x.is_public } : x,
        ),
      );
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      window.alert("Could not update that strip. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col">
      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-border bg-background/70 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow">
            <Camera className="text-primary-foreground" size={16} />
          </div>
          <span className="text-xl font-heading font-bold text-primary tracking-wide">
            Click<span className="text-secondary-foreground">Studio</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <LanguageDropdown />
          <Link
            href="/studio"
            className="px-4 py-2 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-heading font-bold rounded-xl shadow-md shadow-primary/20 transition-all"
          >
            Shoot a New Strip
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto px-6 py-10 w-full flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-foreground">
            Your Strips
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Only strips made from this browser. Private by default — flip one to
            Public to add it to the{" "}
            <Link href="/gallery" className="underline">
              gallery
            </Link>
            .
          </p>
        </div>

        {status === "loading" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-12 justify-center">
            <Loader2 className="animate-spin" size={18} />
            <span>Loading your strips...</span>
          </div>
        )}

        {status === "error" && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {status === "ready" && strips.length === 0 && (
          <div className="text-center py-16 flex flex-col items-center gap-3">
            <p className="text-sm text-muted-foreground">
              No strips yet from this browser.
            </p>
            <Link
              href="/studio"
              className="px-6 py-3 bg-primary text-primary-foreground font-heading font-bold text-sm rounded-xl shadow-md"
            >
              Make Your First Strip
            </Link>
          </div>
        )}

        {status === "ready" && strips.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {strips.map((strip) => (
              <div
                key={strip.id}
                className="bg-background rounded-2xl border border-border/80 shadow-md overflow-hidden flex flex-col"
              >
                <Link href={`/s/${strip.id}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={strip.image_url}
                    alt="Photo strip"
                    className="w-full aspect-[4/3] object-contain"
                  />
                </Link>
                <div className="p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(strip.created_at).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-0.5">
                        <Eye size={11} />
                        {strip.view_count.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Download size={11} />
                        {strip.download_count.toLocaleString()}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleGallery(strip)}
                      disabled={busyId === strip.id}
                      title={
                        strip.is_public
                          ? "Remove from public gallery"
                          : "Add to public gallery"
                      }
                      className="flex-1 py-1.5 px-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                      {strip.is_public ? (
                        <Globe size={12} />
                      ) : (
                        <GlobeLock size={12} />
                      )}
                      <span>{strip.is_public ? "Public" : "Private"}</span>
                    </button>
                    <button
                      onClick={() => remove(strip.id)}
                      disabled={busyId === strip.id}
                      title="Delete"
                      className="p-1.5 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-lg transition-all disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
