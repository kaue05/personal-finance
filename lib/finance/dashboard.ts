import "server-only";

import { Prisma, ExpenseStatus, ReceivableStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getPatrimonySummary } from "@/lib/finance/balance";
import { getDebtsSummary } from "@/lib/finance/debt";

const ZERO = new Prisma.Decimal(0);

function monthRange(reference = new Date()) {
  const year = reference.getFullYear();
  const month = reference.getMonth();

  return {
    start: new Date(Date.UTC(year, month, 1)),
    end: new Date(Date.UTC(year, month + 1, 1)),
  };
}

/**
 * Reúne todos os indicadores da Dashboard.
 *
 * Importante:
 * - receitasDoMes usa a data real da movimentação de entrada;
 * - gastosPagosDoMes usa a data real da movimentação de saída;
 * - referenceMonth representa competência, não fluxo de caixa;
 * - restanteRecebidoDoMes é apenas um indicador calculado.
 */
export async function getDashboardSummary(userId: string) {
  const { start, end } = monthRange();

  const [
    patrimony,
    debts,
    receivedThisMonth,
    paidThisMonth,
    pendingExpenses,
    pendingReceivables,
    receivedByReferenceMonth,
    cancelledReceivables,
  ] = await Promise.all([
    getPatrimonySummary(userId),

    getDebtsSummary(userId),

    // Entradas efetivadas no mês.
    // A data principal é Movement.date.
    prisma.movement.aggregate({
      where: {
        userId,
        type: "ENTRADA",
        origin: "RECEBIMENTO",
        date: {
          gte: start,
          lt: end,
        },
      },
      _sum: {
        amount: true,
      },
    }),

    // Gastos efetivamente pagos no mês.
    // A data principal é Movement.date.
    prisma.movement.aggregate({
      where: {
        userId,
        type: "SAIDA",
        origin: "GASTO",
        date: {
          gte: start,
          lt: end,
        },
      },
      _sum: {
        amount: true,
      },
    }),

    prisma.expense.aggregate({
      where: {
        userId,
        status: ExpenseStatus.PENDENTE,
      },
      _sum: {
        amount: true,
      },
    }),

    prisma.receivable.aggregate({
      where: {
        userId,
        status: ReceivableStatus.PENDENTE,
      },
      _sum: {
        amount: true,
      },
    }),

    // Recebimentos recebidos cuja competência é o mês atual.
    prisma.receivable.aggregate({
      where: {
        userId,
        status: ReceivableStatus.RECEBIDO,
        referenceMonth: {
          gte: start,
          lt: end,
        },
      },
      _sum: {
        amount: true,
      },
    }),

    prisma.receivable.count({
      where: {
        userId,
        status: ReceivableStatus.CANCELADO,
      },
    }),
  ]);

  const receitasDoMes = receivedThisMonth._sum.amount ?? ZERO;

  const gastosPagosDoMes = paidThisMonth._sum.amount ?? ZERO;

  const gastosPendentes = pendingExpenses._sum.amount ?? ZERO;

  const recebimentosPendentes = pendingReceivables._sum.amount ?? ZERO;

  const recebidosReferentesAoMes = receivedByReferenceMonth._sum.amount ?? ZERO;

  const restanteRecebidoDoMes = receitasDoMes.minus(gastosPagosDoMes);

  return {
    patrimony,
    debts,

    receitasDoMes,
    gastosPagosDoMes,
    gastosPendentes,

    recebimentosPendentes,
    recebidosReferentesAoMes,
    recebimentosCancelados: cancelledReceivables,

    restanteRecebidoDoMes,
  };
}
