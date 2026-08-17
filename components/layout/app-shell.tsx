"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRIVATE_NAV_ITEMS } from "@/components/layout/nav-items";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import Image from "next/image";

function Brand() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2 px-1">
      <Image
        src="/logo.png"
        alt="Personal Finance Logo"
        width={28}
        height={28}
        className="rounded-sm"
      />
      <span className="font-display text-lg tracking-tight text-ink">
        Personal Finance
      </span>
    </Link>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-0.5">
      {PRIVATE_NAV_ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              active
                ? "bg-primary/10 font-medium text-primary"
                : "text-ink/80 hover:bg-bg hover:text-ink"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({
  children,
  userName,
  userEmail,
  isAdmin,
}: {
  children: React.ReactNode;
  userName: string;
  userEmail: string;
  isAdmin: boolean;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-dvh md:flex">
      {/* Sidebar fixa — desktop */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:border-border md:bg-surface">
        <div className="sticky top-0 flex flex-col p-4">
          <Brand />

          {/* Links de navegação */}
          <div className="mt-6 flex flex-1 flex-col">
            <NavLinks />

            {isAdmin && (
              <Link
                href="/admin/dashboard"
                className="mt-4 flex items-center gap-3 rounded-md border border-dashed border-border px-3 py-2 text-sm text-ink/80 hover:bg-bg"
              >
                <ShieldCheck className="h-4 w-4 shrink-0" />
                Área administrativa
              </Link>
            )}
          </div>

          {/* Footer fixo no final da sidebar */}
          <div className="mt-6 border-t border-border pt-3">
            <p className="truncate text-sm font-medium text-ink">{userName}</p>
            <p className="truncate text-xs text-muted">{userEmail}</p>
            <div className="mt-2 flex items-center gap-2">
              <ThemeToggle />
              <SignOutButton />
            </div>
          </div>
        </div>
      </aside>

      {/* Topbar — mobile */}
      <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 md:hidden">
        <Brand />
        <button
          aria-label="Abrir menu"
          onClick={() => setDrawerOpen(true)}
          className="rounded-md p-2 hover:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Drawer — mobile */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-ink/40"
            onClick={() => setDrawerOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-surface p-4 shadow-card">
            <div className="flex items-center justify-between">
              <Brand />
              <button
                aria-label="Fechar menu"
                onClick={() => setDrawerOpen(false)}
                className="rounded-md p-2 hover:bg-bg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-6 flex flex-1 flex-col">
              <NavLinks onNavigate={() => setDrawerOpen(false)} />
              {isAdmin && (
                <Link
                  href="/admin/dashboard"
                  onClick={() => setDrawerOpen(false)}
                  className="mt-4 flex items-center gap-3 rounded-md border border-dashed border-border px-3 py-2 text-sm text-ink/80 hover:bg-bg"
                >
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  Área administrativa
                </Link>
              )}
            </div>
            <div className="mt-4 border-t border-border pt-3">
              <p className="truncate text-sm font-medium text-ink">{userName}</p>
              <p className="truncate text-xs text-muted">{userEmail}</p>
              <div className="mt-2">
                <SignOutButton />
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="min-w-0 flex-1 bg-bg p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}