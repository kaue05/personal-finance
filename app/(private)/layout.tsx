import { requireUser } from "@/lib/auth/guards";
import { AppShell } from "@/components/layout/app-shell";
import { ThemeProvider } from "@/components/theme-provider";

export default async function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Autenticação real (não apenas cookie) verificada aqui no servidor,
  // independente do que o middleware já checou.
  const user = await requireUser();

  return (
    <ThemeProvider defaultTheme="light" storageKey="theme">
      <AppShell
        userName={user.name}
        userEmail={user.email}
        isAdmin={user.role === "ADMIN"}
      >
        {children}
      </AppShell>
    </ThemeProvider>
  );
}
