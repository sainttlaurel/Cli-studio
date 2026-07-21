import Link from "next/link";
import { Camera, Zap, Eye, Download, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ShareActions } from "@/components/ShareActions";
import { YearbookSignatures } from "@/components/YearbookSignatures";
import type { Strip } from "@/lib/types";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

const BASE_URL = "https://cli-studiodev.vercel.app";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const strip = await getStrip(params.id);

  if (!strip) {
    return {
      title: "Strip not found — ClickStudio",
      description: "This photo strip may have expired or the link is incorrect.",
    };
  }

  const title = strip.caption
    ? `"${strip.caption}" — ClickStudio`
    : "A Y2K photo strip — ClickStudio";
  const description = `Check out this photo strip made with ClickStudio. Make your own — no signup needed!`;
  const url = `${BASE_URL}/s/${strip.id}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      siteName: "ClickStudio",
      title,
      description,
      images: [
        {
          url: strip.image_url,
          width: 800,
          alt: strip.caption ?? "ClickStudio photo strip",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [strip.image_url],
    },
  };
}

async function getStrip(id: string): Promise<Strip | null> {
  const { data, error } = await supabase.rpc("get_strip_by_id", { p_id: id });
  if (error || !data || data.length === 0) return null;
  return data[0] as Strip;
}

export default async function SharePage({
  params,
}: {
  params: { id: string };
}) {
  const strip = await getStrip(params.id);

  // ── Not found ──────────────────────────────────────────────────────────────
  if (!strip) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-5 bg-background text-center px-6">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Camera className="text-primary/50" size={28} />
        </div>
        <div>
          <h1 className="text-xl font-heading font-bold text-foreground">
            This strip has vanished ✨
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            It may have expired (strips are kept for 30 days) or the link is
            incorrect.
          </p>
        </div>
        <Link
          href="/studio"
          className="px-6 py-3 bg-primary text-primary-foreground font-heading font-bold text-sm rounded-xl shadow-md shadow-primary/20 hover:bg-primary/90 transition-all flex items-center gap-2"
        >
          <Zap size={14} />
          Make your own strip
        </Link>
      </div>
    );
  }

  // Fire-and-forget view count — don't await, shouldn't block render.
  supabase.rpc("increment_strip_view", { p_id: strip.id });

  const capturedDate = new Date(strip.created_at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // ── Strip found ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen w-full bg-background flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 sparkle-bg pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 w-full px-6 py-4 flex items-center justify-between border-b border-border bg-background/70 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow">
            <Camera className="text-primary-foreground" size={16} />
          </div>
          <span className="text-xl font-heading font-bold text-primary tracking-wide">
            Click<span className="text-secondary-foreground">Studio</span>
          </span>
        </Link>
        <Link
          href="/studio"
          className="px-4 py-2 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-heading font-bold rounded-xl shadow-md shadow-primary/20 transition-all flex items-center gap-1.5"
        >
          <Zap size={14} />
          <span>Shoot Your Own</span>
        </Link>
      </header>

      {/* Main */}
      <main className="relative z-10 flex-1 w-full max-w-5xl mx-auto px-6 py-10">
        <div className="flex flex-col lg:flex-row gap-10 items-start justify-center">

          {/* ── Strip image ─────────────────────────────────────────────── */}
          <div className="flex flex-col items-center gap-3 w-full lg:w-auto">
            {/* Card */}
            <div className="bg-background rounded-3xl shadow-2xl border-4 border-primary/20 p-4 w-full max-w-[320px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={strip.image_url}
                alt="Shared photo strip"
                className="w-full h-auto rounded-2xl"
              />
              {strip.caption && (
                <p className="text-center text-sm font-heading font-bold text-foreground mt-3 px-1">
                  {strip.caption}
                </p>
              )}
            </div>

            {/* Engagement stats */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye size={12} />
                {(strip.view_count + 1).toLocaleString()} views
              </span>
              <span className="flex items-center gap-1">
                <Download size={12} />
                {strip.download_count.toLocaleString()} saves
              </span>
            </div>
          </div>

          {/* ── Info + actions ──────────────────────────────────────────── */}
          <div className="flex flex-col gap-6 w-full max-w-sm">
            {/* Meta */}
            <div>
              <h1 className="text-2xl font-heading font-extrabold text-foreground leading-tight">
                A Wild Vibe<br />Appeared! ✨
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Captured {capturedDate}
              </p>
            </div>

            {/* Share / save actions */}
            <ShareActions imageUrl={strip.image_url} id={strip.id} />

            {/* Expiry notice */}
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-muted border border-border text-xs text-muted-foreground">
              <Clock size={13} className="mt-0.5 shrink-0" />
              <span>
                Strips are kept for <strong>30 days</strong> then automatically
                deleted. Save yours before it's gone.
              </span>
            </div>

            {/* Make your own CTA */}
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 flex flex-col gap-3">
              <div>
                <p className="text-sm font-heading font-bold text-foreground">
                  Love this vibe?
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Make your own strip — no account, no app, completely free.
                </p>
              </div>
              <Link
                href="/studio"
                className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-heading font-bold text-sm rounded-xl shadow-md shadow-primary/20 transition-all flex items-center justify-center gap-2"
              >
                <Zap size={15} />
                Start the Studio
              </Link>
            </div>

            {/* Yearbook signatures */}
            <div className="bg-background border border-border rounded-2xl p-5">
              <YearbookSignatures stripId={strip.id} />
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full py-6 border-t border-border bg-background/40 mt-auto text-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} ClickStudio — built for self-expression.
          No tracking, no ads.
        </p>
      </footer>
    </div>
  );
}
