import { requireUser } from "@/lib/auth/guards";

import { ReportsCharts } from "@/components/reports/reports-charts";

export default async function ReportsPage() {
  const user = await requireUser();

  return (
    <div className="mx-auto max-w-7xl">
      <header className="mb-6">
        <p className="font-display text-sm text-muted">
          Análise financeira
        </p>

        <h1 className="font-display text-2xl text-ink sm:text-3xl">
          Relatórios
        </h1>

        <p className="mt-1 max-w-2xl text-sm text-muted">
          Visualize seus gastos e receitas por categoria e por mês,
          além de uma projeção do quanto você pode gastar.
        </p>
      </header>

      <ReportsCharts userId={user.id} />
    </div>
  );
}