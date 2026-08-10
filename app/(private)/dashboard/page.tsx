import { requireUser } from "@/lib/auth/guards";
import { getDashboardSummary } from "@/lib/finance/dashboard";
import {
  Card,
  CardLabel,
  CardValue,
} from "@/components/ui/card";
import { formatBRL } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await requireUser();
  const summary = await getDashboardSummary(user.id);

  const hasAnyAccount =
    summary.patrimony.byAccount.length > 0;

  const firstName = user.name.trim().split(" ")[0];

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6">
        <p className="font-display text-sm text-muted">
          Olá, {firstName}
        </p>

        <h1 className="font-display text-2xl text-ink sm:text-3xl">
          Visão geral
        </h1>

        <p className="mt-1 text-sm text-muted">
          Acompanhe seu patrimônio e o fluxo financeiro do mês.
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
          <Card className="col-span-2 sm:col-span-3 lg:col-span-2">
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

          <Card>
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

          <Card>
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

          <Card>
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

          <Card>
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

          <Card>
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

          <Card className="border-dashed">
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

          <Card>
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
          <Card>
            <CardLabel>Total das dívidas</CardLabel>

            <CardValue>
              {formatBRL(
                summary.debts.total.toString(),
              )}
            </CardValue>
          </Card>

          <Card>
            <CardLabel>Total pago</CardLabel>

            <CardValue className="text-positive">
              {formatBRL(
                summary.debts.paid.toString(),
              )}
            </CardValue>
          </Card>

          <Card>
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