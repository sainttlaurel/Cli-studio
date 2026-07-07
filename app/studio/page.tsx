"use client";

import Link from "next/link";
import { ArrowRight, Plus, X } from "lucide-react";
import { WizardHeader } from "@/components/WizardHeader";
import { SparkleOverlay } from "@/components/SparkleOverlay";
import { CameraCapture } from "@/components/CameraCapture";
import { useBoothStore } from "@/lib/store";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function StudioPage() {
  const { frames, removeFrame } = useBoothStore();

  return (
    <div className="min-h-screen w-full bg-background flex flex-col relative overflow-hidden">
      <SparkleOverlay />
      <WizardHeader step={2} />

      <main className="relative z-10 flex-1 max-w-5xl mx-auto px-6 py-8 flex flex-col gap-8 w-full">
        <ErrorBoundary page="studio">
          <CameraCapture />

          <div className="bg-background p-4 rounded-3xl border border-border/80 shadow-md">
            <h3 className="text-xs font-heading font-bold text-muted-foreground uppercase tracking-wider mb-3">
              Your Captured Frames ({frames.length} / 4)
            </h3>
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => {
                const frame = frames[i];
                return (
                  <div
                    key={i}
                    className="aspect-square bg-muted rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 relative overflow-hidden group"
                  >
                    {frame ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={frame}
                          alt={`Frame ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => removeFrame(i)}
                          className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={12} />
                        </button>
                      </>
                    ) : (
                      <>
                        <Plus className="text-muted-foreground" size={18} />
                        <span className="text-[10px] font-bold text-muted-foreground">
                          Frame {i + 1}
                        </span>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end">
            <Link
              href={frames.length > 0 ? "/editor" : "#"}
              aria-disabled={frames.length === 0}
              className={`px-6 py-3 font-heading font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 ${
                frames.length > 0
                  ? "bg-secondary-foreground text-primary-foreground hover:bg-secondary-foreground/90"
                  : "bg-border text-muted-foreground pointer-events-none"
              }`}
            >
              <span>Continue to Editor</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </ErrorBoundary>
      </main>

      <footer className="relative z-10 w-full py-6 border-t border-border bg-background/40 mt-auto text-center">
        <p className="text-xs text-muted-foreground">
          ✨ ClickStudio camera is processed entirely in your browser. Your
          privacy is safe with us.
        </p>
      </footer>
    </div>
  );
}
