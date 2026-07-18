import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase configuration missing");
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

export function validateAdminPassword(password: string): boolean {
  return password === (process.env.ADMIN_PASSWORD || "admin123");
}

export const ADMIN_AUTH_STORAGE_KEY = "clickstudio_admin_auth";

export function isAdminAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(ADMIN_AUTH_STORAGE_KEY) !== null;
}

export function storeAdminAuth(password: string): void {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(ADMIN_AUTH_STORAGE_KEY, password);
  }
}

export function clearAdminAuth(): void {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
  }
}

export function getStoredAdminPassword(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(ADMIN_AUTH_STORAGE_KEY);
}
