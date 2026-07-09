"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Sticker,
  Image as ImageIcon,
  Users,
  BarChart3,
  Settings,
  FileText,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { isAdminAuthenticated, clearAdminAuth } from "@/lib/admin-auth";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Stickers", href: "/admin/stickers", icon: Sticker },
  { label: "Gallery", href: "/admin/gallery", icon: ImageIcon },
  { label: "Sessions", href: "/admin/sessions", icon: Users },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Settings", href: "/admin/settings", icon: Settings },
  { label: "Audit Log", href: "/admin/audit", icon: FileText },
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check authentication on mount and route changes
  useEffect(() => {
    const checkAuth = () => {
      const isAuth = isAdminAuthenticated();
      setAuthenticated(isAuth);
      setLoading(false);
    };
    checkAuth();
  }, [pathname]);

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!loading && !authenticated && pathname !== "/admin/login") {
      router.push("/admin/login");
    }
  }, [loading, authenticated, pathname, router]);

  const handleLogout = () => {
    clearAdminAuth();
    setAuthenticated(false);
    router.push("/admin/login");
  };

  // Show loading state or redirect to login if not authenticated
  if (loading) {
    return (
      <div className="min-h-screen w-full bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!authenticated && pathname !== "/admin/login") {
    return null; // Will be redirected by useEffect
  }

  return (
    <div className="min-h-screen w-full bg-background">
      {/* Mobile header */}
      <header className="lg:hidden sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border/50">
        <div className="flex items-center justify-between p-4">
          <Link
            href="/admin"
            className="text-xl font-heading font-bold text-foreground"
          >
            ClickStudio
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 sticky top-0 h-screen bg-secondary/30 border-r border-border/50 overflow-y-auto">
          <div className="p-6">
            <Link
              href="/admin"
              className="text-xl font-heading font-bold text-foreground block mb-8"
            >
              ClickStudio
            </Link>
            <nav className="space-y-2">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      isActive
                        ? "bg-primary/10 text-primary font-semibold border border-primary/20"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    }`}
                  >
                    <item.icon size={20} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border/50 bg-secondary/30">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-2 text-destructive hover:bg-destructive/10 rounded-xl transition-colors w-full"
            >
              <LogOut size={18} />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Mobile Sidebar (overlay) */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-50 lg:hidden bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div
              className="fixed top-0 left-0 bottom-0 w-64 bg-background border-r border-border/50 p-6 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <span className="text-xl font-heading font-bold">Menu</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-muted/50"
                >
                  <X size={20} />
                </button>
              </div>
              <nav className="space-y-2">
                {navItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        isActive
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-muted-foreground hover:bg-muted/50"
                      }`}
                    >
                      <item.icon size={20} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
              <div className="mt-8 pt-4 border-t border-border/50">
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-4 py-2 text-destructive hover:bg-destructive/10 rounded-xl transition-colors w-full"
                >
                  <LogOut size={18} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
