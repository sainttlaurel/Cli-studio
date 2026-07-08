import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/admin-auth";

function checkPassword(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const password = request.headers.get("x-admin-password");
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

  if (authHeader === `Bearer ${adminPassword}`) return true;
  if (password === adminPassword) return true;

  const url = new URL(request.url);
  if (url.searchParams.get("password") === adminPassword) return true;

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
