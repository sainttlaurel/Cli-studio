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
    const url = new URL(request.url);
    const page     = parseInt(url.searchParams.get("page")     || "1");
    const pageSize = parseInt(url.searchParams.get("pageSize") || "25");
    const action   = url.searchParams.get("action");
    const search   = url.searchParams.get("search");

    let query = supabase
      .from("admin_actions")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (action) query = query.eq("action", action);
    if (search) query = query.or(`action.ilike.%${search}%,resource.ilike.%${search}%,detail.ilike.%${search}%`);

    const { data, count, error } = await query;
    if (error) throw error;

    return NextResponse.json({
      data:       data  ?? [],
      total:      count ?? 0,
      page,
      pageSize,
      totalPages: Math.ceil((count ?? 0) / pageSize),
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}

// POST — write an audit entry (called internally by other admin routes)
export async function POST(request: NextRequest) {
  if (!checkPassword(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const supabase = createAdminClient();
    const { action, resource, detail } = await request.json();
    const { data, error } = await supabase
      .from("admin_actions")
      .insert({ action, resource, detail })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}
