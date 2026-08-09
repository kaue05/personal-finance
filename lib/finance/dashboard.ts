import "server-only";

import { Prisma, ExpenseStatus, ReceivableStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getPatrimonySummary } from "@/lib/finance/balance";
import { getDebtsSummary } from "@/lib/finance/debt";

function monthRange(reference = new Date()) {
  const start = new Date(reference.getFullYear(), reference.getMonth(), 1);
  const end = new Date(reference.getFullYear(), reference.getMonth() + 1, 1);
  return { start, end };
}

/**
 * Reúne todos os indicadores do Dashboard.
 * "Restante recebido do mês" é um INDICADOR calculado (recebido - pago),
 * nunca uma movimentação independente — deixamos isso explícito no card.
 */
export async function getDashboardSummary(userId: string) {
  const { start, end } = monthRange();

  const [patrimony, debts, receivedThisMonth, paidThisMonth, pendingExpenses] =
    await Promise.all([
      getPatrimonySummary(userId),
      getDebtsSummary(userId),
      prisma.receivable.aggregate({
        where: {
          userId,
          status: ReceivableStatus.RECEBIDO,
          receivedAt: { gte: start, lt: end },
        },
        _sum: { amount: true },
      }),
      prisma.expense.aggregate({
        where: {
          userId,
          status: ExpenseStatus.PAGO,
          paidAt: { gte: start, lt: end },
        },
        _sum: { amount: true },
      }),
      prisma.expense.aggregate({
        where: { userId, status: ExpenseStatus.PENDENTE },
        _sum: { amount: true },
      }),
    ]);

  const receitasDoMes = receivedThisMonth._sum.amount ?? new Prisma.Decimal(0);
  const gastosPagosDoMes = paidThisMonth._sum.amount ?? new Prisma.Decimal(0);
  const restanteRecebidoDoMes = receitasDoMes.minus(gastosPagosDoMes);

  return {
    patrimony,
    debts,
    receitasDoMes,
    gastosPagosDoMes,
    gastosPendentes: pendingExpenses._sum.amount ?? new Prisma.Decimal(0),
    restanteRecebidoDoMes,
  };
}
