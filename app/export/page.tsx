"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { WizardHeader } from "@/components/WizardHeader";
import { SparkleOverlay } from "@/components/SparkleOverlay";
import { StripPreview } from "@/components/StripPreview";
import { ExportPanel } from "@/components/ExportPanel";
import { useBoothStore } from "@/lib/store";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function ExportPage() {
  const router = useRouter();
  const { frames } = useBoothStore();

  useEffect(() => {
    if (frames.length === 0) router.replace("/studio");
  }, [frames.length, router]);

  if (frames.length === 0) return null;

  return (
    <div className="min-h-screen w-full bg-background flex flex-col relative overflow-hidden">
      <SparkleOverlay />
      <WizardHeader step={4} />

      <main className="relative z-10 flex-1 max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-12 gap-8 w-full">
        <ErrorBoundary page="export">
          <section className="md:col-span-5 flex flex-col items-center gap-4">
            <StripPreview />
            <span className="text-xs font-semibold text-muted-foreground">
              ✨ Your high-res strip is ready to save!
            </span>
          </section>

          <ExportPanel />
        </ErrorBoundary>
      </main>

      <footer className="relative z-10 w-full py-6 border-t border-border bg-background/40 mt-auto text-center">
        <p className="text-xs text-muted-foreground">
          ✨ ClickStudio strips are stored securely for 30 days before being
          automatically deleted.
        </p>
      </footer>
    </div>
  );
}
