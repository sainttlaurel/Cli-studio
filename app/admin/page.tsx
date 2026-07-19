"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Image as ImageIcon,
  Users,
  Download,
  Eye,
  Clock,
  TrendingUp,
  TrendingDown,
  Loader2,
  Calendar,
  Plus,
} from "lucide-react";
import { getStoredAdminPassword } from "@/lib/admin-auth";
import type { DashboardMetrics, PopularItem } from "@/lib/admin-types";

interface QuickAction {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
}

const quickActions: QuickAction[] = [
  {
    title: "Add Template",
    description: "Create new frame themes",
    href: "/admin/templates",
    icon: Plus,
  },
  {
    title: "Upload Stickers",
    description: "Add new sticker packs",
    href: "/admin/stickers",
    icon: ImageIcon,
  },
  {
    title: "Moderate Gallery",
    description: "Review public strips",
    href: "/admin/gallery",
    icon: Eye,
  },
  {
    title: "View Analytics",
    description: "See usage statistics",
    href: "/admin/analytics",
    icon: TrendingUp,
  },
];

function StatCard({
  title,
  value,
  change,
  icon: Icon,
  color = "text-primary",
}: {
  title: string;
  value: number | string;
  change?: { value: number; direction: "up" | "down" | "neutral" };
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  color?: string;
}) {
  return (
    <div className="bg-background rounded-2xl border border-border/80 shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${color.replace("text-", "bg-")}/10`}>
          <Icon size={24} className={color} />
        </div>
        {change && (
          <span
            className={`text-xs font-bold px-2 py-1 rounded-full ${
              change.direction === "up"
                ? "bg-emerald-500/10 text-emerald-600"
                : change.direction === "down"
                  ? "bg-destructive/10 text-destructive"
                  : "bg-muted/50 text-muted-foreground"
            }`}
          >
            {change.direction === "up" && "+"}
            {change.value}%
          </span>
        )}
      </div>
      <p className="text-3xl font-heading font-bold text-foreground mb-1">
        {value.toLocaleString()}
      </p>
      <p className="text-sm text-muted-foreground">{title}</p>
    </div>
  );
}

function PopularList({
  title,
  items,
}: {
  title: string;
  items: PopularItem[];
}) {
  return (
    <div className="bg-background rounded-2xl border border-border/80 shadow-sm p-6">
      <h3 className="text-lg font-heading font-bold text-foreground mb-4">
        {title}
      </h3>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={item.id || item.name}
            className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-muted-foreground w-6">
                {index + 1}
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-foreground truncate">
                  {item.name}
                </p>
              </div>
            </div>
            <span className="text-sm font-bold text-muted-foreground">
              {item.count.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuickActionCard({ action }: { action: QuickAction }) {
  const Icon = action.icon;
  return (
    <Link
      href={action.href}
      className="bg-background rounded-2xl border border-border/80 shadow-sm p-6 hover:border-primary/30 hover:shadow-primary/10 transition-all group"
    >
      <div className="p-3 rounded-xl bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors">
        <Icon
          size={24}
          className="text-primary group-hover:scale-105 transition-transform"
        />
      </div>
      <h3 className="font-heading font-bold text-foreground mb-1">
        {action.title}
      </h3>
      <p className="text-sm text-muted-foreground">{action.description}</p>
    </Link>
  );
}

function RecentActivity() {
  const [items, setItems] = useState<{ action: string; resource: string; detail: string | null; created_at: string }[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const pwd = getStoredAdminPassword();
        if (!pwd) return;
        const res = await fetch("/api/admin/audit?pageSize=5", { headers: { "x-admin-password": pwd } });
        if (!res.ok) return;
        const data = await res.json();
        setItems(data.data ?? []);
      } catch { /* silent */ }
    }
    load();
  }, []);

  return (
    <div className="bg-background rounded-2xl border border-border/80 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-heading font-bold text-foreground">Recent Activity</h3>
        <Link href="/admin/audit" className="text-sm text-primary font-semibold hover:underline">View all</Link>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">No admin actions logged yet</p>
      ) : (
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
              <div className="w-2 h-2 rounded-full bg-primary/60 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {item.action} — {item.resource}
                  {item.detail && <span className="font-normal text-muted-foreground"> · {item.detail}</span>}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(item.created_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DateRangeSelector() {
  const [range, setRange] = useState("7d");

  const ranges = [
    { value: "1d", label: "Today" },
    { value: "7d", label: "Last 7 days" },
    { value: "30d", label: "Last 30 days" },
    { value: "90d", label: "Last 90 days" },
    { value: "all", label: "All time" },
  ];

  return (
    <div className="flex items-center gap-2 bg-secondary/50 rounded-xl p-1">
      {ranges.map((r) => (
        <button
          key={r.value}
          onClick={() => setRange(r.value)}
          className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors ${
            range === r.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        setLoading(true);
        setApiError(null);

        const password = getStoredAdminPassword();
        if (!password) throw new Error("Not authenticated");

        const response = await fetch("/api/admin", {
          headers: { "x-admin-password": password },
        });

        if (!response.ok) throw new Error("Failed to fetch metrics");

        const data = await response.json();

        setMetrics({
          totalStrips:      data.totalStrips      ?? 0,
          totalViews:       data.totalViews        ?? 0,
          totalDownloads:   data.totalDownloads    ?? 0,
          activeSessions:   data.activeSessions    ?? 0,
          publicStrips:     data.publicStrips      ?? 0,
          privateStrips:    data.privateStrips     ?? 0,
          recentlyCreated:  data.recentlyCreated   ?? 0,
          popularTemplates: (data.popularTemplates ?? []).map((t: Record<string, unknown>) => ({
            name:       (t.name || t.id) as string,
            id:         (t.id   || t.name) as string,
            count:      (t.count       ?? 0) as number,
            percentage: (t.percentage  ?? 0) as number,
          })),
          popularStickers: [],
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to fetch metrics:", error);
        setApiError("Could not load dashboard data. Check your connection and try again.");
        setMetrics({
          totalStrips: 0, totalViews: 0, totalDownloads: 0,
          activeSessions: 0, publicStrips: 0, privateStrips: 0,
          recentlyCreated: 0, popularTemplates: [], popularStickers: [],
        });
      } finally {
        setLoading(false);
      }
    }
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load metrics</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Error banner */}
      {apiError && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-amber-600 text-sm">
          {apiError}
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here&apos;s what&apos;s happening with ClickStudio.
          </p>
        </div>
        <DateRangeSelector />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Strips"
          value={metrics.totalStrips}
          change={{ value: 12, direction: "up" }}
          icon={LayoutDashboard}
        />
        <StatCard
          title="Total Views"
          value={metrics.totalViews}
          change={{ value: 8, direction: "up" }}
          icon={Eye}
          color="text-emerald-500"
        />
        <StatCard
          title="Downloads"
          value={metrics.totalDownloads}
          change={{ value: 5, direction: "up" }}
          icon={Download}
          color="text-amber-500"
        />
        <StatCard
          title="Active Sessions"
          value={metrics.activeSessions}
          change={{ value: 2, direction: "down" }}
          icon={Users}
          color="text-violet-500"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard
          title="Public Strips"
          value={metrics.publicStrips}
          icon={ImageIcon}
          color="text-sky-500"
        />
        <StatCard
          title="Recently Created (24h)"
          value={metrics.recentlyCreated}
          change={{ value: 20, direction: "up" }}
          icon={Clock}
          color="text-orange-500"
        />
      </div>

      {/* Popular Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PopularList
          title="Popular Templates"
          items={metrics.popularTemplates}
        />
        <PopularList title="Popular Stickers" items={metrics.popularStickers} />
      </div>

      {/* Quick Actions */}
      <section>
        <h2 className="text-xl font-heading font-bold text-foreground mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <QuickActionCard key={action.title} action={action} />
          ))}
        </div>
      </section>

      {/* Recent Activity */}
      <RecentActivity />
    </div>
  );
}
