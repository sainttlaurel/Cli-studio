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

// Helper to get date range filter
function getDateFilter(range: string) {
  const now = new Date();
  let startDate: Date;

  switch (range) {
    case "1d":
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case "7d":
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "30d":
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "90d":
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case "year":
      startDate = new Date(now.getFullYear(), now.getMonth() - 12, now.getDate());
      break;
    case "all":
    default:
      // No filter - all time
      return {};
  }

  return { created_at: startDate.toISOString() };
}

// Generate date series for the given range
function generateDateSeries(range: string): string[] {
  const now = new Date();
  const dates: string[] = [];
  let days: number;

  switch (range) {
    case "1d":
      days = 1;
      break;
    case "7d":
      days = 7;
      break;
    case "30d":
      days = 30;
      break;
    case "90d":
      days = 90;
      break;
    case "year":
      days = 365;
      break;
    case "all":
    default:
      // Return last 30 days as default
      days = 30;
  }

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    dates.push(date.toISOString().split("T")[0]);
  }

  return dates;
}

// GET analytics data
export async function GET(request: NextRequest) {
  if (!checkPassword(request)) return unauthorizedResponse();

  try {
    const supabase = createAdminClient();
    const url = new URL(request.url);
    const range = url.searchParams.get("range") || "30d";

    // Get date filter
    const dateFilter = getDateFilter(range);
    const dateSeries = generateDateSeries(range);

    // 1. Get time series data (strips, views, downloads per day)
    const { data: stripsData, error: stripsError } = await supabase
      .from("strips")
      .select("created_at, view_count, download_count")
      .gte("created_at", dateFilter.created_at || "1970-01-01")
      .order("created_at", { ascending: true });

    if (stripsError) throw stripsError;

    // Group by date for time series
    const dailyStats: Record<string, { strips: number; views: number; downloads: number }> = {};
    dateSeries.forEach((date) => {
      dailyStats[date] = { strips: 0, views: 0, downloads: 0 };
    });

    stripsData?.forEach((row) => {
      const date = row.created_at.split("T")[0];
      if (dailyStats[date]) {
        dailyStats[date].strips++;
        dailyStats[date].views += row.view_count || 0;
        dailyStats[date].downloads += row.download_count || 0;
      }
    });

    const timeSeries = dateSeries.map((date) => ({
      date,
      strips: dailyStats[date].strips,
      views: dailyStats[date].views,
      downloads: dailyStats[date].downloads,
    }));

    // 2. Get popular templates
    const { data: templateData, error: templateError } = await supabase
      .from("strips")
      .select("theme")
      .neq("theme", null)
      .gte("created_at", dateFilter.created_at || "1970-01-01");

    if (templateError) throw templateError;

    const templateCounts: Record<string, number> = {};
    templateData?.forEach((row) => {
      if (row.theme) {
        templateCounts[row.theme] = (templateCounts[row.theme] || 0) + 1;
      }
    });

    const popularTemplates = Object.entries(templateCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count], index) => ({
        id: name.toLowerCase().replace(/\s+/g, "-"),
        name,
        count,
        percentage: Math.round((count / (templateData?.length || 1)) * 1000) / 10,
      }));

    // 3. Get popular filters
    const { data: filterData, error: filterError } = await supabase
      .from("strips")
      .select("filter")
      .neq("filter", null)
      .gte("created_at", dateFilter.created_at || "1970-01-01");

    if (filterError) throw filterError;

    const filterCounts: Record<string, number> = {};
    filterData?.forEach((row) => {
      if (row.filter) {
        filterCounts[row.filter] = (filterCounts[row.filter] || 0) + 1;
      }
    });

    const popularFilters = Object.entries(filterCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count], index) => ({
        id: name.toLowerCase().replace(/\s+/g, "-"),
        name,
        count,
        percentage: Math.round((count / (filterData?.length || 1)) * 1000) / 10,
      }));

    // 4. Get totals
    const { count: totalStrips } = await supabase
      .from("strips")
      .select("*", { count: "exact", head: true })
      .gte("created_at", dateFilter.created_at || "1970-01-01");

    const { data: allStats } = await supabase
      .from("strips")
      .select("view_count, download_count")
      .gte("created_at", dateFilter.created_at || "1970-01-01");

    const totalViews = allStats?.reduce((sum, row) => sum + (row.view_count || 0), 0) || 0;
    const totalDownloads = allStats?.reduce((sum, row) => sum + (row.download_count || 0), 0) || 0;

    return NextResponse.json({
      timeSeries,
      popularTemplates,
      popularFilters,
      totals: {
        strips: totalStrips || 0,
        views: totalViews,
        downloads: totalDownloads,
      },
      range,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch analytics",
      },
      { status: 500 },
    );
  }
}
