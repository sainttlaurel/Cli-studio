import { NextRequest, NextResponse } from "next/server";
import {
  validateAdminPassword,
  createAdminClient,
  ADMIN_PASSWORD,
} from "@/lib/admin-auth";

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

// GET dashboard metrics
export async function GET(request: NextRequest) {
  if (!checkPassword(request)) return unauthorizedResponse();

  try {
    const supabase = createAdminClient();

    // Get total strips
    const { count: totalStrips } = await supabase
      .from("strips")
      .select("*", { count: "exact", head: true });

    // Get total views and downloads
    const { data: stats } = await supabase
      .from("strips")
      .select("view_count, download_count");

    const totalViews =
      stats?.reduce((sum, row) => sum + (row.view_count || 0), 0) || 0;
    const totalDownloads =
      stats?.reduce((sum, row) => sum + (row.download_count || 0), 0) || 0;

    // Get active sessions (sessions with strips created in last 24h)
    const { count: activeSessions } = await supabase
      .from("strips")
      .select("session_id", { count: "exact", head: true })
      .gte(
        "created_at",
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      );

    // Get public/private counts
    const { data: publicData } = await supabase
      .from("strips")
      .select("is_public")
      .eq("is_public", true);

    const publicStrips = publicData?.length || 0;
    const privateStrips = (totalStrips || 0) - publicStrips;

    // Get popular templates
    const { data: templateData } = await supabase
      .from("strips")
      .select("theme")
      .neq("theme", null);

    const templateCounts: Record<string, number> = {};
    templateData?.forEach((row) => {
      if (row.theme) {
        templateCounts[row.theme] = (templateCounts[row.theme] || 0) + 1;
      }
    });
    const popularTemplates = Object.entries(templateCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    return NextResponse.json({
      totalStrips: totalStrips || 0,
      totalViews,
      totalDownloads,
      activeSessions: activeSessions || 0,
      publicStrips,
      privateStrips,
      popularTemplates,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch metrics",
      },
      { status: 500 },
    );
  }
}

// GET audit logs
export async function GET_AUDIT(request: NextRequest) {
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

// GET sessions
export async function GET_SESSIONS(request: NextRequest) {
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
