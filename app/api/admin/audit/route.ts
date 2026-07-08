import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, ADMIN_PASSWORD } from "@/lib/admin-auth";

function checkPassword(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const password = request.headers.get("x-admin-password");

  if (authHeader === `Bearer ${ADMIN_PASSWORD}`) return true;
  if (password === ADMIN_PASSWORD) return true;

  const url = new URL(request.url);
  if (url.searchParams.get("password") === ADMIN_PASSWORD) return true;

  return false;
}

function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

// GET audit logs
export async function GET(request: NextRequest) {
  if (!checkPassword(request)) return unauthorizedResponse();

  try {
    const supabase = createAdminClient();
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const pageSize = parseInt(url.searchParams.get("pageSize") || "20");
    const action = url.searchParams.get("action");
    const resourceType = url.searchParams.get("resourceType");
    const search = url.searchParams.get("search");

    let query = supabase
      .from("audit_log")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (action) query = query.eq("action", action);
    if (resourceType) query = query.eq("resource_type", resourceType);
    if (search) {
      query = query.or(
        `id.ilike.%${search}%,admin_id.ilike.%${search}%,resource_id.ilike.%${search}%`,
      );
    }

    const { data, count } = await query;

    return NextResponse.json({
      data: data || [],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch audit logs",
      },
      { status: 500 },
    );
  }
}
