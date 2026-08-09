import Link from "next/link";
import { requireAdmin } from "@/lib/auth/guards";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { LayoutDashboard, Users, Settings, ArrowLeft } from "lucide-react";

const ADMIN_NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/usuarios", label: "Usuários", icon: Users },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Role verificada no servidor — quem não é ADMIN é redirecionado para /dashboard.
  const admin = await requireAdmin();

  return (
    <div className="min-h-dvh md:flex">
      <aside className="w-full shrink-0 border-b border-border bg-surface p-4 md:w-64 md:border-b-0 md:border-r">
        <div className="flex items-center gap-2 px-1">
          <span className="flex h-7 w-7 items-center justify-center rounded-sm bg-ink font-display text-sm text-bg">
            A
          </span>
          <span className="font-display text-lg tracking-tight text-ink">Administração</span>
        </div>

        <nav className="mt-6 flex flex-col gap-0.5">
          {ADMIN_NAV.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-ink/80 hover:bg-bg hover:text-ink"
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
          <Link
            href="/dashboard"
            className="mt-3 flex items-center gap-3 rounded-md border border-dashed border-border px-3 py-2 text-sm text-ink/80 hover:bg-bg"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            Voltar para o app
          </Link>
        </nav>

        <div className="mt-4 border-t border-border pt-3 md:mt-auto">
          <p className="truncate text-sm font-medium text-ink">{admin.name}</p>
          <p className="truncate text-xs text-muted">{admin.email}</p>
          <div className="mt-2">
            <SignOutButton />
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 bg-bg p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
