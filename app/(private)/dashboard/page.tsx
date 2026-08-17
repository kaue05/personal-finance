import { requireUser } from "@/lib/auth/guards";
import { getDashboardSummary } from "@/lib/finance/dashboard";
import {
  Card,
  CardLabel,
  CardValue,
} from "@/components/ui/card";
import { formatBRL } from "@/lib/utils";
import { MonthSelector } from "@/components/dashboard/month-selector";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    month?: string;
  }>;
}) {
  const user = await requireUser();
  const params = await searchParams;

  const monthParam = params.month;

  let referenceDate: Date;

  if (monthParam) {
    const [yearStr, monthStr] = monthParam.split("-");
    const year = Number(yearStr);
    const month = Number(monthStr);

    if (
      year &&
      month &&
      month >= 1 &&
      month <= 12
    ) {
      // Date.UTC usa índice 0-11, então subtraímos 1
      referenceDate = new Date(
        Date.UTC(year, month - 1, 1, 12, 0, 0),
      );
    } else {
      referenceDate = new Date();
    }
  } else {
    referenceDate = new Date();
  }

  const summary = await getDashboardSummary(
    user.id,
    referenceDate,
  );

  const hasAnyAccount =
    summary.patrimony.byAccount.length > 0;

  const firstName = user.name.trim().split(" ")[0];

  const currentMonthLabel = referenceDate.toLocaleString(
    "pt-BR",
    {
      month: "long",
      year: "numeric",
    },
  );

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6">
        <p className="font-display text-sm text-muted">
          Olá, {firstName}
        </p>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-2xl text-ink sm:text-3xl">
            Visão geral
          </h1>

          <MonthSelector />
        </div>

        <p className="mt-1 text-sm text-muted">
          Mês de referência:{" "}
          {currentMonthLabel.charAt(0).toUpperCase() +
            currentMonthLabel.slice(1)}
        </p>
      </header>

      {!hasAnyAccount && (
        <Card className="mb-6 border-dashed">
          <p className="font-display text-lg text-ink">
            Nenhuma conta cadastrada ainda
          </p>

          <p className="mt-1 text-sm text-muted">
            Cadastre um banco e uma conta para começar a registrar suas
            movimentações. Os indicadores serão preenchidos conforme você
            utilizar o sistema.
          </p>
        </Card>
      )}

      <section>
        <div className="mb-3">
          <h2 className="font-display text-lg text-ink">
            Patrimônio atual
          </h2>

          <p className="text-sm text-muted">
            Valores derivados das entradas, saídas e transferências efetivadas.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <Card className="col-span-2 sm:col-span-3 lg:col-span-2 bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950/20 dark:to-blue-950/20">
            <CardLabel>Saldo total</CardLabel>

            <CardValue className="text-3xl">
              {formatBRL(
                summary.patrimony.total.toString(),
              )}
            </CardValue>

            <p className="mt-1 text-xs text-muted">
              Calculado pelas movimentações das contas
            </p>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20">
            <CardLabel>Recebido no mês</CardLabel>

            <CardValue className="text-positive">
              {formatBRL(
                summary.receitasDoMes.toString(),
              )}
            </CardValue>

            <p className="mt-1 text-xs text-muted">
              Pela data real de recebimento
            </p>
          </Card>

          <Card className="bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-950/20 dark:to-red-950/20">
            <CardLabel>Gastos pagos no mês</CardLabel>

            <CardValue className="text-negative">
              {formatBRL(
                summary.gastosPagosDoMes.toString(),
              )}
            </CardValue>

            <p className="mt-1 text-xs text-muted">
              Pela data real de pagamento
            </p>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20">
            <CardLabel>Gastos pendentes</CardLabel>

            <CardValue>
              {formatBRL(
                summary.gastosPendentes.toString(),
              )}
            </CardValue>

            <p className="mt-1 text-xs text-muted">
              Ainda não alteram o saldo
            </p>
          </Card>

          <Card className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20">
            <CardLabel>Recebimentos pendentes</CardLabel>

            <CardValue className="text-positive">
              {formatBRL(
                summary.recebimentosPendentes.toString(),
              )}
            </CardValue>

            <p className="mt-1 text-xs text-muted">
              Ainda não alteram o saldo
            </p>
          </Card>

          <Card className="bg-gradient-to-br from-cyan-50 to-sky-50 dark:from-cyan-950/20 dark:to-sky-950/20">
            <CardLabel>Recebido referente ao mês</CardLabel>

            <CardValue className="text-positive">
              {formatBRL(
                summary.recebidosReferentesAoMes.toString(),
              )}
            </CardValue>

            <p className="mt-1 text-xs text-muted">
              Inclui adiantamentos da competência atual
            </p>
          </Card>

          <Card className="border-dashed bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-950/20 dark:to-gray-950/20">
            <CardLabel>Restante recebido do mês</CardLabel>

            <CardValue>
              {formatBRL(
                summary.restanteRecebidoDoMes.toString(),
              )}
            </CardValue>

            <p className="mt-1 text-xs text-muted">
              Indicador: recebido no mês − pago no mês
            </p>
          </Card>

          <Card className="bg-gradient-to-br from-zinc-50 to-neutral-50 dark:from-zinc-950/20 dark:to-neutral-950/20">
            <CardLabel>Recebimentos cancelados</CardLabel>

            <CardValue>
              {summary.recebimentosCancelados}
            </CardValue>

            <p className="mt-1 text-xs text-muted">
              Não entram nos cálculos financeiros
            </p>
          </Card>
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-3">
          <h2 className="font-display text-lg text-ink">
            Distribuição do patrimônio
          </h2>

          <p className="text-sm text-muted">
            Veja onde seu saldo está concentrado.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <CardLabel>Saldo por banco</CardLabel>

            {summary.patrimony.byBank.length === 0 ? (
              <p className="mt-3 text-sm text-muted">
                Nenhum banco cadastrado.
              </p>
            ) : (
              <ul className="mt-3">
                {summary.patrimony.byBank.map((bank) => (
                  <li
                    key={bank.bankId}
                    className="ledger-row flex justify-between py-2 text-sm"
                  >
                    <span className="text-ink/80">
                      {bank.bankName}
                    </span>

                    <span className="tabular font-medium">
                      {formatBRL(
                        bank.total.toString(),
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardLabel>Saldo por conta</CardLabel>

            {summary.patrimony.byAccount.length === 0 ? (
              <p className="mt-3 text-sm text-muted">
                Nenhuma conta cadastrada.
              </p>
            ) : (
              <ul className="mt-3">
                {summary.patrimony.byAccount.map(
                  ({ account, balance }) => (
                    <li
                      key={account.id}
                      className="ledger-row flex justify-between gap-3 py-2 text-sm"
                    >
                      <span className="truncate text-ink/80">
                        {account.name}
                      </span>

                      <span className="tabular shrink-0 font-medium">
                        {formatBRL(
                          balance.toString(),
                        )}
                      </span>
                    </li>
                  ),
                )}
              </ul>
            )}
          </Card>

          <Card>
            <CardLabel>Saldo por tipo de conta</CardLabel>

            {summary.patrimony.byType.length === 0 ? (
              <p className="mt-3 text-sm text-muted">
                Sem dados ainda.
              </p>
            ) : (
              <ul className="mt-3">
                {summary.patrimony.byType.map((item) => (
                  <li
                    key={item.type}
                    className="ledger-row flex justify-between py-2 text-sm"
                  >
                    <span className="text-ink/80">
                      {formatAccountType(item.type)}
                    </span>

                    <span className="tabular font-medium">
                      {formatBRL(
                        item.total.toString(),
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-3">
          <h2 className="font-display text-lg text-ink">
            Dívidas
          </h2>

          <p className="text-sm text-muted">
            Acompanhe o total devido e os pagamentos realizados.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Card className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-950/20 dark:to-gray-950/20">
            <CardLabel>Total das dívidas</CardLabel>

            <CardValue>
              {formatBRL(
                summary.debts.total.toString(),
              )}
            </CardValue>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20">
            <CardLabel>Total pago</CardLabel>

            <CardValue className="text-positive">
              {formatBRL(
                summary.debts.paid.toString(),
              )}
            </CardValue>
          </Card>

          <Card className="bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-950/20 dark:to-red-950/20">
            <CardLabel>Total restante</CardLabel>

            <CardValue className="text-negative">
              {formatBRL(
                summary.debts.remaining.toString(),
              )}
            </CardValue>
          </Card>
        </div>
      </section>
    </div>
  );
}

function formatAccountType(type: string) {
  const labels: Record<string, string> = {
    CORRENTE: "Conta corrente",
    POUPANCA: "Poupança",
    RESERVA: "Reserva",
  };

  return labels[type] ?? type;
}