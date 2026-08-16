// app/(admin)/admin/usuarios/page.tsx
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { formatDateBR } from "@/lib/utils";
import { ToggleUserStatusButton } from "@/components/admin/toggle-user-status-button";

export default async function AdminUsuariosPage() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6">
        <h1 className="font-display text-2xl text-ink sm:text-3xl">
          Usuários
        </h1>
        <p className="mt-1 text-sm text-muted">
          Gerencie o status das contas. Ativar/desativar não afeta dados financeiros.
        </p>
      </header>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">E-mail</th>
              <th className="px-4 py-3 font-medium">Papel</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Criado em</th>
              <th className="px-4 py-3 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="ledger-row">
                <td className="px-4 py-3 text-ink">{u.name}</td>
                <td className="px-4 py-3 text-ink/80">{u.email}</td>
                <td className="px-4 py-3 text-ink/80">{u.role}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      u.active
                        ? "rounded-sm bg-positive/10 px-2 py-0.5 text-xs text-positive"
                        : "rounded-sm bg-negative/10 px-2 py-0.5 text-xs text-negative"
                    }
                  >
                    {u.active ? "Ativo" : "Desativado"}
                  </span>
                </td>
                <td className="px-4 py-3 text-ink/80">{formatDateBR(u.createdAt)}</td>
                <td className="px-4 py-3">
                  <ToggleUserStatusButton
                    userId={u.id}
                    isActive={u.active}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <p className="p-6 text-sm text-muted">Nenhum usuário cadastrado.</p>
        )}
      </Card>
    </div>
  );
}