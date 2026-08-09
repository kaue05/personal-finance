import { prisma } from "@/lib/prisma";
import { Card, CardLabel, CardValue } from "@/components/ui/card";

export default async function AdminDashboardPage() {
  // Importante: consultas aqui só podem tocar em campos de PLATAFORMA
  // (contagens, status da conta). Nunca importar/consultar modelos
  // financeiros (Movement, Expense, Receivable, Debt, BankAccount) nesta
  // área — essa fronteira é o que garante que o ADMIN não acessa dados
  // financeiros de ninguém.
  const [totalUsers, activeUsers, inactiveUsers, admins] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { active: true } }),
    prisma.user.count({ where: { active: false } }),
    prisma.user.count({ where: { role: "ADMIN" } }),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6">
        <h1 className="font-display text-2xl text-ink sm:text-3xl">Dashboard administrativo</h1>
        <p className="mt-1 text-sm text-muted">
          Métricas gerais da plataforma. Nenhum dado financeiro de usuários é exibido aqui.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardLabel>Usuários</CardLabel>
          <CardValue>{totalUsers}</CardValue>
        </Card>
        <Card>
          <CardLabel>Ativos</CardLabel>
          <CardValue className="text-positive">{activeUsers}</CardValue>
        </Card>
        <Card>
          <CardLabel>Desativados</CardLabel>
          <CardValue className="text-negative">{inactiveUsers}</CardValue>
        </Card>
        <Card>
          <CardLabel>Administradores</CardLabel>
          <CardValue>{admins}</CardValue>
        </Card>
      </section>
    </div>
  );
}
