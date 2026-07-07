"use client";

import { Component, type ReactNode } from "react";
import Link from "next/link";
import { RotateCcw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  /** Short label shown in the error message, e.g. "studio", "editor", "export" */
  page?: string;
}

interface State {
  hasError: boolean;
  message: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: null };

  static getDerivedStateFromError(error: unknown): State {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    return { hasError: true, message };
  }

  componentDidCatch(error: unknown, info: { componentStack: string }) {
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary]", this.props.page ?? "", error, info);
  }

  reset = () => this.setState({ hasError: false, message: null });

  render() {
    if (!this.state.hasError) return this.props.children;

    const { page } = this.props;
    const label = page ? `the ${page} page` : "this page";

    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 py-16 text-center">
        <div className="text-5xl">😵</div>
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-heading font-bold text-foreground">
            Something went wrong on {label}
          </h2>
          {this.state.message && (
            <p className="text-xs text-muted-foreground font-mono max-w-sm break-words">
              {this.state.message}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={this.reset}
            className="px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-heading font-bold rounded-xl transition-all flex items-center gap-2"
          >
            <RotateCcw size={14} />
            <span>Try Again</span>
          </button>
          <Link
            href="/"
            className="px-4 py-2.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground text-sm font-heading font-bold rounded-xl transition-all flex items-center gap-2"
          >
            <Home size={14} />
            <span>Go Home</span>
          </Link>
        </div>
      </div>
    );
  }
}
