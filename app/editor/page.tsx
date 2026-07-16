"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Camera } from "lucide-react";
import { WizardHeader } from "@/components/WizardHeader";
import { SparkleOverlay } from "@/components/SparkleOverlay";
import { StripPreview } from "@/components/StripPreview";
import { EditorPanel } from "@/components/EditorPanel";
import { useBoothStore } from "@/lib/store";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function EditorPage() {
  const router = useRouter();
  const { frames, resetFrames } = useBoothStore();

  useEffect(() => {
    if (frames.length === 0) router.replace("/studio");
  }, [frames.length, router]);

  if (frames.length === 0) return null;

  return (
    <div className="min-h-screen w-full bg-background flex flex-col relative overflow-hidden">
      <SparkleOverlay />
      <WizardHeader step={3} />

      <main className="relative z-10 flex-1 max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8 w-full lg:items-start">
        <ErrorBoundary page="editor">
          {/* Left: strip preview — sticky so it stays in view while right column scrolls */}
          <section className="flex flex-col gap-3 w-full lg:sticky lg:top-6">
            <StripPreview />
            <p className="text-xs text-muted-foreground font-semibold text-center">
              Pick a filter, fine-tune, and caption your strip.
            </p>
          </section>

          {/* Right: editor controls + action buttons */}
          <section className="flex flex-col gap-6 w-full">
            <EditorPanel />

            <div className="border-t border-border pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                onClick={() => {
                  resetFrames();
                  router.push("/studio");
                }}
                className="px-4 py-2.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
              >
                <Camera size={14} />
                <span>Retake Frames</span>
              </button>

              <Link
                href="/export"
                className="w-full sm:w-auto px-8 py-3.5 bg-primary hover:bg-primary/95 text-primary-foreground font-heading font-bold text-sm rounded-xl shadow-lg shadow-primary/30 transition-all flex items-center justify-center gap-2"
              >
                <span>Lock Edits & Export</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </section>
        </ErrorBoundary>
      </main>

      <footer className="relative z-10 w-full py-6 border-t border-border bg-background/40 mt-auto text-center">
        <p className="text-xs text-muted-foreground">
          ✨ ClickStudio photo editing is fully client-side. Your original
          images never leave your device.
        </p>
      </footer>
    </div>
  );
}
