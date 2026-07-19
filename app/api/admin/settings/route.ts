import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/admin-auth";

function checkPassword(req: NextRequest): boolean {
  const pwd = req.headers.get("x-admin-password") ?? req.headers.get("authorization")?.replace("Bearer ", "");
  return pwd === (process.env.ADMIN_PASSWORD || "admin123");
}

export async function GET(request: NextRequest) {
  if (!checkPassword(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("admin_settings")
      .select("key, value");
    if (error) throw error;

    const settings: Record<string, string> = {};
    (data ?? []).forEach((row) => { settings[row.key] = row.value; });
    return NextResponse.json(settings);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!checkPassword(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const supabase = createAdminClient();
    const body: Record<string, string> = await request.json();

    const rows = Object.entries(body).map(([key, value]) => ({
      key,
      value: String(value),
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from("admin_settings")
      .upsert(rows, { onConflict: "key" });
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}
