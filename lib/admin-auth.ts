import { createClient } from "@supabase/supabase-js";

/** Admin client with service role key for full access */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase configuration missing");
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

/** Check if password matches admin password */
export function validateAdminPassword(password: string): boolean {
  // Hardcoded for testing - replace with process.env once verified
  return password === "ClickStudio@";
}

/** Client-side auth storage key */
export const ADMIN_AUTH_STORAGE_KEY = "clickstudio_admin_auth";

/** Check if user is authenticated on client side */
export function isAdminAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(ADMIN_AUTH_STORAGE_KEY) !== null;
}

/** Store admin auth token */
export function storeAdminAuth(password: string): void {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(ADMIN_AUTH_STORAGE_KEY, password);
  }
}

/** Clear admin auth */
export function clearAdminAuth(): void {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
  }
}

/** Get stored admin password for API calls */
export function getStoredAdminPassword(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(ADMIN_AUTH_STORAGE_KEY);
}
