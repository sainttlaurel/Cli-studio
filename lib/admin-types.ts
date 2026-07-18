export interface AdminNavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  badge?: number | string;
}

export interface DashboardMetrics {
  totalStrips: number;
  totalViews: number;
  totalDownloads: number;
  activeSessions: number;
  publicStrips: number;
  privateStrips: number;
  recentlyCreated: number; // last 24h
  popularTemplates: PopularItem[];
  popularStickers: PopularItem[];
}

export interface StatCardProps {
  title: string;
  value: number | string;
  change?: { value: number; direction: "up" | "down" | "neutral" };
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  color?: string;
}

export interface StripRow {
  id: string;
  session_id: string;
  image_url: string;
  storage_path: string | null;
  theme: string | null;
  filter: string | null;
  caption: string | null;
  is_public: boolean;
  view_count: number;
  download_count: number;
  created_at: string;
}

export interface GalleryModerationItem extends StripRow {
  is_flagged: boolean;
  is_featured: boolean;
  flagged_reason: string | null;
  flagged_at: string | null;
  flagged_by: string | null;
}

export interface StickerPackRow {
  id: string;
  name: string;
  emoji: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string | null;
}

export interface StickerRow {
  id: string;
  pack_id: string;
  name: string;
  file_name: string;
  storage_path: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface UploadedStickerFile {
  file: File;
  preview: string;
  uploadProgress: number;
  status: "idle" | "uploading" | "complete" | "error";
}

export interface SessionRow {
  id: string;
  created_at: string;
  last_active_at: string;
  strip_count: number;
  ip_address: string | null;
  user_agent: string | null;
  is_blocked: boolean;
  blocked_reason: string | null;
}

export interface AuditLogEntry {
  id: string;
  admin_id: string;
  action: AuditAction;
  resource_type: AuditResourceType;
  resource_id: string;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "toggle"
  | "block"
  | "unblock"
  | "flag"
  | "unflag"
  | "feature"
  | "unfeature"
  | "export"
  | "import";

export type AuditResourceType =
  | "template"
  | "sticker_pack"
  | "sticker"
  | "strip"
  | "session"
  | "settings"
  | "gallery"
  | "message";

export interface AdminSettings {
  id: string;
  key: string;
  value: string | number | boolean;
  description: string;
  category: string;
  updated_at: string;
}

export interface SystemSettings {
  rateLimitStripsPerHour: number;
  rateLimitStripsPerDay: number;
  isMaintenanceMode: boolean;
  maintenanceMessage: string | null;
  showPWAInstallPrompt: boolean;
  showGallery: boolean;
  showFeedbackWall: boolean;
  defaultTemplate: string;
  [key: string]: number | boolean | string | null;
}

export interface AnalyticsTimeSeries {
  date: string;
  strips: number;
  views: number;
  downloads: number;
}

export interface PopularItem {
  name: string;
  id: string;
  count: number;
  percentage: number;
}

export interface DeviceAnalytics {
  desktop: number;
  mobile: number;
  tablet: number;
  other: number;
}

export interface BrowserAnalytics {
  chrome: number;
  firefox: number;
  safari: number;
  edge: number;
  other: number;
}

export interface AnalyticsFilters {
  startDate: string;
  endDate: string;
  range: "day" | "week" | "month" | "year" | "custom";
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  count?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SearchParams {
  search?: string;
  filter?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: string;
  pageSize?: string;
}
