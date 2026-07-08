"use client";

import { useState, useEffect } from "react";
import { Save, X, ToggleLeft, ToggleRight, Loader2, ShieldCheck, AlertTriangle, Eye, EyeOff, Bell, BellOff, Crown, Upload } from "lucide-react";
import { getStoredAdminPassword } from "@/lib/admin-auth";
import type { SystemSettings } from "@/lib/admin-types";

const DEFAULT_SETTINGS: SystemSettings = {
  rateLimitStripsPerHour: 12,
  rateLimitStripsPerDay: 50,
  isMaintenanceMode: false,
  maintenanceMessage: null,
  showPWAInstallPrompt: true,
  showGallery: true,
  showFeedbackWall: true,
  defaultTemplate: "pink",
};

interface SettingItem {
  key: keyof SystemSettings;
  label: string;
  description: string;
  type: "number" | "boolean" | "string" | "select";
  options?: { value: string; label: string }[];
  category: string;
}

const SETTINGS_CONFIG: SettingItem[] = [
  {
    key: "isMaintenanceMode",
    label: "Maintenance Mode",
    description: "When enabled, new users will see a maintenance message",
    type: "boolean",
    category: "General",
  },
  {
    key: "maintenanceMessage",
    label: "Maintenance Message",
    description: "Message to display when maintenance mode is active",
    type: "string",
    category: "General",
  },
  {
    key: "showPWAInstallPrompt",
    label: "Show PWA Install Prompt",
    description: "Show install prompt for Progressive Web App",
    type: "boolean",
    category: "General",
  },
  {
    key: "showGallery",
    label: "Show Public Gallery",
    description: "Allow users to browse public strips",
    type: "boolean",
    category: "Features",
  },
  {
    key: "showFeedbackWall",
    label: "Show Feedback Wall",
    description: "Allow users to leave feedback on the wall",
    type: "boolean",
    category: "Features",
  },
  {
    key: "rateLimitStripsPerHour",
    label: "Rate Limit (per hour)",
    description: "Maximum strips a session can create per hour",
    type: "number",
    category: "Rate Limiting",
  },
  {
    key: "rateLimitStripsPerDay",
    label: "Rate Limit (per day)",
    description: "Maximum strips a session can create per day",
    type: "number",
    category: "Rate Limiting",
  },
  {
    key: "defaultTemplate",
    label: "Default Template",
    description: "Default theme for new strips",
    type: "select",
    options: [
      { value: "pink", label: "Y2K Pink" },
      { value: "lavender", label: "Lavender Dream" },
      { value: "blue", label: "Baby Blue" },
      { value: "mint", label: "Mint Pop" },
      { value: "lemon", label: "Lemon Flash" },
      { value: "coral", label: "Coral Crush" },
      { value: "grape", label: "Grape Beam" },
      { value: "lime", label: "Lime Glow" },
      { value: "mono", label: "Mono Star" },
    ],
    category: "Editor",
  },
];

const CATEGORIES = ["General", "Features", "Rate Limiting", "Editor"];

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("General");

  useEffect(() => {
    async function fetchSettings() {
      try {
        setLoading(true);
        const savedPassword = getStoredAdminPassword();
        if (!savedPassword) throw new Error("Not authenticated");
        setSettings(DEFAULT_SETTINGS);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load settings");
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleChange = (key: keyof SystemSettings, value: string | number | boolean) => {
    setSettings({ ...settings, [key]: value });
    setSuccess(null);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      const savedPassword = getStoredAdminPassword();
      if (!savedPassword) throw new Error("Not authenticated");
      setSuccess("Settings saved successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!confirm("Are you sure you want to reset all settings to default?")) return;
    setSettings(DEFAULT_SETTINGS);
  };

  const categorizedSettings = CATEGORIES.map(category => ({
    category,
    settings: SETTINGS_CONFIG.filter(s => s.category === category),
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Configure platform behavior and features</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-xl">
          <p className="text-sm text-destructive font-semibold">{error}</p>
          <button onClick={() => setError(null)} className="text-xs text-destructive/60 mt-1">Dismiss</button>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
          <p className="text-sm text-emerald-600 font-semibold">{success}</p>
          <button onClick={() => setSuccess(null)} className="text-xs text-emerald-600/60 mt-1">Dismiss</button>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-2 -mb-4 -mt-2">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${
              activeCategory === category
                ? "bg-primary/10 text-primary border border-primary/20"
                : "bg-secondary/50 text-muted-foreground hover:bg-muted/50"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {categorizedSettings.map(({ category, settings }) => (
          activeCategory === category && (
            <div key={category} className="bg-background rounded-2xl border border-border/80 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-border/50">
                <h2 className="text-lg font-heading font-bold">{category}</h2>
              </div>
              <div className="p-6 space-y-4">
                {settings.map((setting) => (
                  <div key={setting.key} className="border-b border-border/50 pb-4 last:border-b-0 last:pb-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <label className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">{setting.label}</span>
                          {setting.type === "boolean" && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              settings[setting.key] ? "bg-emerald-500/20 text-emerald-600" : "bg-muted/50 text-muted-foreground"
                            }`}>
                              {settings[setting.key] ? "ENABLED" : "DISABLED"}
                            </span>
                          )}
                        </label>
                        <p className="text-sm text-muted-foreground mt-1">{setting.description}</p>
                      </div>
                      <div className="min-w-[200px]">
                        {setting.type === "boolean" && (
                          <button
                            onClick={() => handleChange(setting.key, !settings[setting.key])}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors ${
                              settings[setting.key]
                                ? "bg-emerald-500/20 text-emerald-600 hover:bg-emerald-500/30"
                                : "bg-muted/50 text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            {settings[setting.key] ? (
                              <>
                                <ToggleRight size={16} /> ON
                              </>
                            ) : (
                              <>
                                <ToggleLeft size={16} /> OFF
                              </>
                            )}
                          </button>
                        )}
                        {setting.type === "number" && (
                          <input
                            type="number"
                            value={settings[setting.key] as number}
                            onChange={(e) => handleChange(setting.key, parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2.5 bg-secondary/50 border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                        )}
                        {setting.type === "string" && (
                          <textarea
                            value={settings[setting.key] as string || ""}
                            onChange={(e) => handleChange(setting.key, e.target.value)}
                            placeholder="Enter message..."
                            className="w-full px-3 py-2.5 bg-secondary/50 border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[80px] resize-none"
                          />
                        )}
                        {setting.type === "select" && (
                          <select
                            value={settings[setting.key] as string}
                            onChange={(e) => handleChange(setting.key, e.target.value)}
                            className="w-full px-3 py-2.5 bg-secondary/50 border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                          >
                            {setting.options?.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        ))}
      </div>

      <div className="bg-background rounded-2xl border border-border/80 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 disabled:hover:bg-primary text-primary-foreground font-bold rounded-xl transition-colors shadow-lg shadow-primary/30 disabled:opacity-70"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={18} />
                  <span>Save All Settings</span>
                </>
              )}
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-6 py-3 bg-destructive/10 hover:bg-destructive/20 text-destructive font-bold rounded-xl transition-colors"
            >
              <X size={18} />
              <span>Reset to Default</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-sm text-amber-600">
        <strong>Note:</strong> Settings will be saved to database in production. Current changes are client-side only.
      </div>
    </div>
  );
}
