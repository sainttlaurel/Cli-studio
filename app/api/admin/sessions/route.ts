import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/admin-auth";

function checkPassword(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const password = request.headers.get("x-admin-password");
  // Hardcoded for testing
  const adminPassword = "ClickStudio@";

  if (authHeader === `Bearer ${adminPassword}`) return true;
  if (password === adminPassword) return true;

  const url = new URL(request.url);
  if (url.searchParams.get("password") === adminPassword) return true;

  return false;
}

function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

// GET sessions
export async function GET(request: NextRequest) {
  if (!checkPassword(request)) return unauthorizedResponse();

  try {
    const supabase = createAdminClient();
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const pageSize = parseInt(url.searchParams.get("pageSize") || "20");
    const search = url.searchParams.get("search");

    // Note: In current schema, we need to query strips and aggregate by session_id
    // This is a simplified implementation
    const { data: strips } = await supabase
      .from("strips")
      .select("session_id, created_at, is_public")
      .order("created_at", { ascending: false });

    // Aggregate session data
    const sessionMap: Record<
      string,
      {
        created_at: string;
        last_active_at: string;
        strip_count: number;
        is_public: boolean;
      }
    > = {};
    strips?.forEach((strip) => {
      if (!sessionMap[strip.session_id]) {
        sessionMap[strip.session_id] = {
          created_at: strip.created_at,
          last_active_at: strip.created_at,
          strip_count: 0,
          is_public: strip.is_public,
        };
      }
      sessionMap[strip.session_id].last_active_at = strip.created_at;
      sessionMap[strip.session_id].strip_count += 1;
    });

    const sessions = Object.entries(sessionMap).map(([id, data]) => ({
      id,
      created_at: data.created_at,
      last_active_at: data.last_active_at,
      strip_count: data.strip_count,
      ip_address: null, // Not in current schema
      user_agent: null, // Not in current schema
      is_blocked: false, // Not in current schema
      blocked_reason: null, // Not in current schema
    }));

    const filtered = sessions.filter((s) => !search || s.id.includes(search));
    const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

    return NextResponse.json({
      data: paginated,
      total: filtered.length,
      page,
      pageSize,
      totalPages: Math.ceil(filtered.length / pageSize),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch sessions",
      },
      { status: 500 },
    );
  }
}
