"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit2, Trash2, Check, X, Eye, EyeOff, Loader2 } from "lucide-react";
import { LOCAL_TEMPLATES } from "@/lib/templates";

// Password is validated via API, not hardcoded on client

interface TemplateRow {
  id: string;
  name: string;
  hex_color: string;
  border_class: string;
  accent_class: string;
  paper_class: string;
  category: string;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
}

const DEFAULT_TEMPLATE: Partial<TemplateRow> = {
  id: "",
  name: "",
  hex_color: "#FF1493",
  border_class: "border-primary",
  accent_class: "bg-primary",
  paper_class: "bg-pink-50",
  category: "custom",
  sort_order: 10,
  is_active: true,
};

export default function AdminTemplatesPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state for create/edit
  const [editingTemplate, setEditingTemplate] = useState<TemplateRow | null>(null);
  const [formData, setFormData] = useState<Partial<TemplateRow>>(DEFAULT_TEMPLATE);
  const [submitting, setSubmitting] = useState(false);

  // Check authentication
  useEffect(() => {
    // Check for password in sessionStorage (for page refresh)
    const savedAuth = sessionStorage.getItem("admin_auth");
    if (savedAuth) {
      setAuthenticated(true);
      fetchTemplates();
    }
  }, []);

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      // Validate password via API
      const response = await fetch("/api/admin/templates", {
        headers: {
          "x-admin-password": password,
        },
      });

      if (response.ok) {
        setAuthenticated(true);
        sessionStorage.setItem("admin_auth", password);
        fetchTemplates();
      } else {
        setError("Incorrect password");
      }
    } catch (err) {
      setError("Failed to validate password");
    }
  };

  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const savedPassword = sessionStorage.getItem("admin_auth");
      const response = await fetch("/api/admin/templates", {
        headers: {
          "x-admin-password": savedPassword || "",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch templates");
      }

      const data = await response.json();
      setTemplates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load templates");
      // Fallback to local templates
      setTemplates(LOCAL_TEMPLATES.map(t => ({ ...t, is_active: true })));
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    setFormData({
      ...DEFAULT_TEMPLATE,
      sort_order: templates.length > 0 ? Math.max(...templates.map(t => t.sort_order)) + 1 : 10,
    });
  };

  const handleEdit = (template: TemplateRow) => {
    setEditingTemplate(template);
    setFormData({ ...template });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      const savedPassword = sessionStorage.getItem("admin_auth");
      const response = await fetch("/api/admin/templates", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": savedPassword || "",
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) throw new Error("Failed to delete template");

      // Refresh the list
      fetchTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete template");
    }
  };

  const handleToggleActive = async (template: TemplateRow) => {
    try {
      const savedPassword = sessionStorage.getItem("admin_auth");
      const response = await fetch("/api/admin/templates", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": savedPassword || "",
        },
        body: JSON.stringify({
          id: template.id,
          is_active: !template.is_active,
        }),
      });

      if (!response.ok) throw new Error("Failed to update template");

      // Refresh the list
      fetchTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update template");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        id: formData.id || `custom-${Date.now()}`,
      };

      const url = editingTemplate ? `/api/admin/templates` : `/api/admin/templates`;
      const method = editingTemplate ? "PUT" : "POST";

      const savedPassword = sessionStorage.getItem("admin_auth");
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": savedPassword || "",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save template");
      }

      // Refresh and reset form
      fetchTemplates();
      setEditingTemplate(null);
      setFormData(DEFAULT_TEMPLATE);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save template");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field: keyof TemplateRow, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-6">
        <div className="bg-background rounded-3xl border border-border/80 shadow-lg p-8 w-full max-w-md">
          <h1 className="text-2xl font-heading font-bold text-center mb-6">
            Admin Login
          </h1>
          <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-muted-foreground">Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                className="px-4 py-2.5 bg-secondary/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                placeholder="Enter admin password"
                required
              />
            </label>
            {error && (
              <p className="text-sm text-destructive font-semibold">{error}</p>
            )}
            <button
              type="submit"
              className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-heading font-bold rounded-xl transition-colors shadow-lg shadow-primary/30"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background p-6">
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-heading font-bold">Template Management</h1>
        <button
          onClick={() => {
            sessionStorage.removeItem("admin_auth");
            setAuthenticated(false);
          }}
          className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground text-sm font-bold rounded-xl transition-colors"
        >
          Sign Out
        </button>
      </header>

      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-xl">
          <p className="text-sm text-destructive font-semibold">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 px-3 py-1 bg-destructive/20 hover:bg-destructive/30 text-destructive text-xs font-bold rounded-lg transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="bg-background rounded-3xl border border-border/80 shadow-lg overflow-hidden">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            All Templates ({templates.length})
          </h2>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold rounded-xl transition-colors shadow-lg shadow-primary/30"
          >
            <Plus size={16} />
            <span>Add Template</span>
          </button>
        </div>

        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {templates.map((template) => (
              <div
                key={template.id}
                className="p-6 flex items-center justify-between hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div
                    className="w-12 h-12 rounded-xl border-2"
                    style={{
                      borderColor: template.hex_color,
                      backgroundColor: template.hex_color + "20",
                    }}
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-foreground">{template.name}</p>
                    <p className="text-xs text-muted-foreground">
                      ID: {template.id} | Category: {template.category} | Order: {template.sort_order}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(template)}
                    className={`p-2 rounded-lg transition-colors ${
                      template.is_active
                        ? "text-foreground bg-muted hover:bg-muted/80"
                        : "text-muted-foreground hover:bg-muted/50"
                    }`}
                    title={template.is_active ? "Disable" : "Enable"}
                  >
                    {template.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                  <button
                    onClick={() => handleEdit(template)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="p-2 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(editingTemplate || !editingTemplate) && (
        <div
          className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 ${
            editingTemplate === null && formData.id === "" ? "hidden" : ""
          }`}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setEditingTemplate(null);
              setFormData(DEFAULT_TEMPLATE);
            }
          }}
        >
          <div className="bg-background rounded-3xl border border-border/80 shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-heading font-bold">
                {editingTemplate ? "Edit Template" : "Add Template"}
              </h2>
              <button
                onClick={() => {
                  setEditingTemplate(null);
                  setFormData(DEFAULT_TEMPLATE);
                }}
                className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-semibold text-muted-foreground">Template ID *</span>
                  <input
                    type="text"
                    value={formData.id || ""}
                    onChange={(e) => handleChange("id", e.target.value)}
                    className="px-3 py-2 bg-secondary/50 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="e.g., halloween-2024"
                    required
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-semibold text-muted-foreground">Name *</span>
                  <input
                    type="text"
                    value={formData.name || ""}
                    onChange={(e) => handleChange("name", e.target.value)}
                    className="px-3 py-2 bg-secondary/50 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="e.g., Halloween Theme"
                    required
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-semibold text-muted-foreground">Hex Color *</span>
                  <input
                    type="color"
                    value={formData.hex_color || "#FF1493"}
                    onChange={(e) => handleChange("hex_color", e.target.value)}
                    className="h-10 w-full cursor-pointer"
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-semibold text-muted-foreground">Category</span>
                  <input
                    type="text"
                    value={formData.category || ""}
                    onChange={(e) => handleChange("category", e.target.value)}
                    className="px-3 py-2 bg-secondary/50 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="e.g., seasonal"
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-semibold text-muted-foreground">Border Class</span>
                  <input
                    type="text"
                    value={formData.border_class || ""}
                    onChange={(e) => handleChange("border_class", e.target.value)}
                    className="px-3 py-2 bg-secondary/50 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="e.g., border-orange-500"
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-semibold text-muted-foreground">Accent Class</span>
                  <input
                    type="text"
                    value={formData.accent_class || ""}
                    onChange={(e) => handleChange("accent_class", e.target.value)}
                    className="px-3 py-2 bg-secondary/50 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="e.g., bg-orange-500"
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-semibold text-muted-foreground">Paper Class</span>
                  <input
                    type="text"
                    value={formData.paper_class || ""}
                    onChange={(e) => handleChange("paper_class", e.target.value)}
                    className="px-3 py-2 bg-secondary/50 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="e.g., bg-orange-50"
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-semibold text-muted-foreground">Sort Order</span>
                  <input
                    type="number"
                    value={formData.sort_order || 0}
                    onChange={(e) => handleChange("sort_order", parseInt(e.target.value) || 0)}
                    className="px-3 py-2 bg-secondary/50 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="e.g., 10"
                  />
                </label>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active ?? true}
                  onChange={(e) => handleChange("is_active", e.target.checked)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
                />
                <span className="text-sm font-semibold text-muted-foreground">Active</span>
              </label>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/50">
                <button
                  type="button"
                  onClick={() => {
                    setEditingTemplate(null);
                    setFormData(DEFAULT_TEMPLATE);
                  }}
                  className="px-6 py-2.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary/90 disabled:hover:bg-primary text-primary-foreground font-bold rounded-xl transition-colors shadow-lg shadow-primary/30 disabled:opacity-70"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>Save Template</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
