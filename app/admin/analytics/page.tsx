"use client";

import { useState, useEffect } from "react";
import { BarChart3, LineChart, PieChart, Calendar, Clock, Users, Download, Eye, TrendingUp, TrendingDown, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { getStoredAdminPassword } from "@/lib/admin-auth";
import type { AnalyticsTimeSeries, PopularItem } from "@/lib/admin-types";



const RANGES = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "year", label: "This year" },
  { value: "all", label: "All time" },
] as const;

function ChartCard({ title, value, change, icon: Icon, color }: { title: string; value: number | string; change?: number; icon: any; color?: string }) {
  return (
    <div className="bg-background rounded-2xl border border-border/80 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-3 rounded-xl ${color || "bg-primary/10"}`}>
          <Icon size={24} className={color?.replace("bg-", "text-") || "text-primary"} />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-heading font-bold text-foreground">{value.toLocaleString()}</p>
        </div>
      </div>
      {change !== undefined && (
        <p className={`text-sm font-semibold ${change >= 0 ? "text-emerald-500" : "text-destructive"}`}>
          {change >= 0 ? `+${change}` : change}% from last period
        </p>
      )}
    </div>
  );
}

function TimeSeriesChart({ data }: { data: AnalyticsTimeSeries[] }) {
  const maxValue = Math.max(...data.flatMap(d => [d.strips, d.views, d.downloads])) * 1.2;
  const height = 200;

  return (
    <div className="bg-background rounded-2xl border border-border/80 shadow-sm p-6">
      <h3 className="text-lg font-heading font-bold mb-4">Daily Activity</h3>
      <div className="relative h-[200px] w-full">
        <svg viewBox={`0 0 100% ${height}`} className="absolute inset-0 w-full h-full">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((v) => (
            <line
              key={v}
              x1="0%" y1={`${v * height}%`}
              x2="100%" y2={`${v * height}%`}
              stroke="#e4e4e7" strokeWidth="1"
              strokeDasharray="4"
            />
          ))}

          {/* Strips line */}
          <polyline
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            points={data.map((d, i) => `${(i / (data.length - 1)) * 100}%,${(1 - d.strips / maxValue) * height}`).join(" ")}
          />

          {/* Views line */}
          <polyline
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
            points={data.map((d, i) => `${(i / (data.length - 1)) * 100}%,${(1 - d.views / maxValue) * height}`).join(" ")}
          />

          {/* Downloads line */}
          <polyline
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2"
            points={data.map((d, i) => `${(i / (data.length - 1)) * 100}%,${(1 - d.downloads / maxValue) * height}`).join(" ")}
          />
        </svg>
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-muted-foreground px-2 pb-1">
          {data.filter((_, i) => i % 5 === 0).map((d, i) => (
            <span key={d.date}>{d.date.slice(5)}</span>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-center gap-6 mt-2 text-sm">
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500" /> Strips</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500" /> Views</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-500" /> Downloads</div>
      </div>
    </div>
  );
}

function BarChart({ title, data, color }: { title: string; data: PopularItem[]; color?: string }) {
  const maxValue = Math.max(...data.map(d => d.count)) * 1.2;

  return (
    <div className="bg-background rounded-2xl border border-border/80 shadow-sm p-6">
      <h3 className="text-lg font-heading font-bold mb-4">{title}</h3>
      <div className="space-y-3">
        {data.map((item) => (
          <div key={item.id} className="flex items-center gap-3">
            <span className="text-sm font-semibold text-muted-foreground w-8">{item.percentage}%</span>
            <div className="flex-1 h-8 bg-secondary/50 rounded-lg overflow-hidden">
              <div
                className={`h-full ${color || "bg-primary"} rounded-lg transition-all`}
                style={{ width: `${item.percentage}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-foreground w-20 text-right">{item.count.toLocaleString()}</span>
            <span className="text-sm text-muted-foreground truncate flex-1">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DeviceChart({ data }: { data: { desktop: number; mobile: number; tablet: number; other: number } }) {
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  const entries = Object.entries(data).map(([key, value]) => ({ id: key, name: key.charAt(0).toUpperCase() + key.slice(1), count: value, percentage: Math.round((value / total) * 100) }));

  return (
    <div className="bg-background rounded-2xl border border-border/80 shadow-sm p-6">
      <h3 className="text-lg font-heading font-bold mb-4">Device Breakdown</h3>
      <div className="flex items-center justify-center gap-4 mb-6">
        <div className="relative w-32 h-32">
          <svg viewBox="0 0 36 36" className="absolute inset-0">
            {entries.map((entry, i) => {
              const startAngle = entries.slice(0, i).reduce((sum, e) => sum + e.percentage, 0) * 3.6;
              const endAngle = (startAngle + entry.percentage * 3.6);
              const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
              const colors: Record<string, string> = {
                desktop: "#3b82f6", mobile: "#10b981", tablet: "#f59e0b", other: "#6b7280"
              };
              return (
                <path
                  key={entry.id}
                  d={`M18 18 L18 18 L18 18 L18 18 M18,6 a12,12 0 ${largeArcFlag},1 ${Math.cos(endAngle * Math.PI / 180) * 12 + 18},${Math.sin(endAngle * Math.PI / 180) * 12 + 18} A12,12 0 ${largeArcFlag},0 ${Math.cos(startAngle * Math.PI / 180) * 12 + 18},${Math.sin(startAngle * Math.PI / 180) * 12 + 18} Z`}
                  fill={colors[entry.id] || "#6b7280"}
                  stroke="white" strokeWidth="0.5"
                />
              );
            })}
          </svg>
        </div>
        <div className="space-y-2">
          {entries.map((entry) => (
            <div key={entry.id} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: {
                desktop: "#3b82f6", mobile: "#10b981", tablet: "#f59e0b", other: "#6b7280"
              }[entry.id] || "#6b7280" }} />
              <span className="text-sm text-muted-foreground w-20">{entry.name}</span>
              <span className="text-sm font-semibold text-foreground w-12">{entry.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState("30d");

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true);
        const savedPassword = getStoredAdminPassword();
        if (!savedPassword) throw new Error("Not authenticated");
        // Fetch from API with authentication
        const response = await fetch(`/api/admin/analytics?range=${range}`, {
          headers: {
            "x-admin-password": savedPassword,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const apiData = await response.json();
        setData(apiData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, [range]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-12 text-center">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const totalStrips = data.totals?.strips || 0;
  const totalViews = data.totals?.views || 0;
  const totalDownloads = data.totals?.downloads || 0;
  const avgStripsPerDay = data.timeSeries.length > 0
    ? Math.round(totalStrips / data.timeSeries.length)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground mt-1">Track usage, engagement, and trends over time</p>
      </div>

      <div className="flex justify-center gap-2">
        {RANGES.map((r) => (
          <button
            key={r.value}
            onClick={() => setRange(r.value)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              range === r.value
                ? "bg-primary/10 text-primary border border-primary/20"
                : "bg-secondary/50 text-muted-foreground hover:bg-muted/50"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ChartCard title="Total Strips" value={totalStrips} change={12} icon={Calendar} color="bg-blue-500/10" />
        <ChartCard title="Total Views" value={totalViews} change={8} icon={Eye} color="bg-emerald-500/10" />
        <ChartCard title="Total Downloads" value={totalDownloads} change={15} icon={Download} color="bg-amber-500/10" />
        <ChartCard title="Avg. Strips/Day" value={avgStripsPerDay} change={-2} icon={TrendingUp} color="bg-violet-500/10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TimeSeriesChart data={data.timeSeries} />
        <BarChart title="Popular Templates" data={data.popularTemplates ?? []} color="bg-blue-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChart title="Popular Filters" data={data.popularFilters ?? []} color="bg-emerald-500" />
      </div>
    </div>
  );
}
