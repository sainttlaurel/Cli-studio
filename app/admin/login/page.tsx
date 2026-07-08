"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { storeAdminAuth } from "@/lib/admin-auth";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Basic validation
    if (!password) {
      setError("Please enter a password");
      setLoading(false);
      return;
    }

    try {
      // Validate password via server-side API
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || "Incorrect password");
        setLoading(false);
        return;
      }

      // Store auth and redirect
      storeAdminAuth(password);
      setLoading(false);
      router.push("/admin");
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-6">
      <div className="bg-background rounded-3xl border border-border/80 shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
            ClickStudio Admin
          </h1>
          <p className="text-muted-foreground text-sm">
            Sign in to manage your photo booth
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-muted-foreground">
              Password
            </span>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all pr-12"
                placeholder="Enter admin password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </label>

          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-xl">
              <p className="text-sm text-destructive font-semibold">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-primary hover:bg-primary/90 disabled:hover:bg-primary text-primary-foreground font-heading font-bold rounded-xl transition-colors shadow-lg shadow-primary/30 disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-border/50 text-center">
          <p className="text-xs text-muted-foreground">
            For security, set ADMIN_PASSWORD in your environment variables
          </p>
        </div>
      </div>
    </div>
  );
}
