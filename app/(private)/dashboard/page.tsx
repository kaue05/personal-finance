import { requireUser } from "@/lib/auth/guards";
import { getDashboardSummary } from "@/lib/finance/dashboard";
import { Card, CardLabel, CardValue } from "@/components/ui/card";
import { formatBRL } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await requireUser();
  const summary = await getDashboardSummary(user.id);

  const hasAnyAccount = summary.patrimony.byAccount.length > 0;

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6">
        <p className="font-display text-sm text-muted">Olá, {user.name.split(" ")[0]}</p>
        <h1 className="font-display text-2xl text-ink sm:text-3xl">Visão geral</h1>
      </header>

      {!hasAnyAccount && (
        <Card className="mb-6 border-dashed">
          <p className="font-display text-lg text-ink">Nenhuma conta cadastrada ainda</p>
          <p className="mt-1 text-sm text-muted">
            Cadastre um banco e uma conta para começar a registrar suas movimentações. Os
            indicadores abaixo vão preencher automaticamente conforme você usa o sistema.
          </p>
        </Card>
      )}

      {/* Patrimônio */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <Card className="col-span-2 sm:col-span-3 lg:col-span-2">
          <CardLabel>Saldo total</CardLabel>
          <CardValue className="text-3xl">{formatBRL(summary.patrimony.total.toString())}</CardValue>
        </Card>

        <Card>
          <CardLabel>Receitas do mês</CardLabel>
          <CardValue className="text-positive">
            {formatBRL(summary.receitasDoMes.toString())}
          </CardValue>
        </Card>

        <Card>
          <CardLabel>Gastos pagos do mês</CardLabel>
          <CardValue className="text-negative">
            {formatBRL(summary.gastosPagosDoMes.toString())}
          </CardValue>
        </Card>

        <Card>
          <CardLabel>Gastos pendentes</CardLabel>
          <CardValue>{formatBRL(summary.gastosPendentes.toString())}</CardValue>
        </Card>

        {/* Indicador calculado — deixado visualmente distinto (borda tracejada + nota)
            para deixar claro que não é uma movimentação independente. */}
        <Card className="border-dashed">
          <CardLabel>Restante recebido do mês</CardLabel>
          <CardValue>{formatBRL(summary.restanteRecebidoDoMes.toString())}</CardValue>
          <p className="mt-1 text-xs text-muted">Indicador: recebido − pago no mês</p>
        </Card>
      </section>

      {/* Saldo por banco / conta / tipo */}
      <section className="mt-8 grid gap-4 lg:grid-cols-3">
        <Card>
          <CardLabel>Saldo por banco</CardLabel>
          {summary.patrimony.byBank.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Nenhum banco cadastrado.</p>
          ) : (
            <ul className="mt-3">
              {summary.patrimony.byBank.map((b) => (
                <li key={b.bankId} className="ledger-row flex justify-between py-2 text-sm">
                  <span className="text-ink/80">{b.bankName}</span>
                  <span className="tabular font-medium">{formatBRL(b.total.toString())}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardLabel>Saldo por conta</CardLabel>
          {summary.patrimony.byAccount.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Nenhuma conta cadastrada.</p>
          ) : (
            <ul className="mt-3">
              {summary.patrimony.byAccount.map(({ account, balance }) => (
                <li key={account.id} className="ledger-row flex justify-between py-2 text-sm">
                  <span className="text-ink/80">{account.name}</span>
                  <span className="tabular font-medium">{formatBRL(balance.toString())}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardLabel>Saldo por tipo de conta</CardLabel>
          {summary.patrimony.byType.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Sem dados ainda.</p>
          ) : (
            <ul className="mt-3">
              {summary.patrimony.byType.map((t) => (
                <li key={t.type} className="ledger-row flex justify-between py-2 text-sm">
                  <span className="text-ink/80">{t.type}</span>
                  <span className="tabular font-medium">{formatBRL(t.total.toString())}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      {/* Dívidas */}
      <section className="mt-8 grid grid-cols-3 gap-3">
        <Card>
          <CardLabel>Total das dívidas</CardLabel>
          <CardValue>{formatBRL(summary.debts.total.toString())}</CardValue>
        </Card>
        <Card>
          <CardLabel>Total pago</CardLabel>
          <CardValue className="text-positive">{formatBRL(summary.debts.paid.toString())}</CardValue>
        </Card>
        <Card>
          <CardLabel>Total restante</CardLabel>
          <CardValue className="text-negative">
            {formatBRL(summary.debts.remaining.toString())}
          </CardValue>
        </Card>
      </section>
    </div>
  );
}
