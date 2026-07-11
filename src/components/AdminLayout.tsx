"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.refresh();
  }

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/admin" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">Б</span>
                </div>
                <span className="font-semibold text-foreground">
                  Brief & КП
                </span>
              </Link>
              <nav className="hidden sm:flex items-center gap-1">
                <Link
                  href="/admin"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname === "/admin"
                      ? "bg-indigo-50 text-primary"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  Проекты
                </Link>
                <Link
                  href="/admin/projects/new"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname === "/admin/projects/new"
                      ? "bg-indigo-50 text-primary"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  Новый проект
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/privacy"
                className="text-xs text-muted hover:text-foreground hidden sm:inline"
              >
                152-ФЗ
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                Выйти
              </Button>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
