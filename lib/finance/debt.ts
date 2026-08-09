import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * valorPago e valorRestante NUNCA são armazenados — sempre derivados de
 * sum(DebtPayment.amount). valorRestante = totalAmount - valorPago.
 */
export async function getDebtProgress(userId: string, debtId: string) {
  const debt = await prisma.debt.findFirstOrThrow({
    where: { id: debtId, userId },
  });

  const paid = await prisma.debtPayment.aggregate({
    where: { userId, debtId },
    _sum: { amount: true },
  });

  const valorPago = paid._sum.amount ?? new Prisma.Decimal(0);
  const valorRestante = debt.totalAmount.minus(valorPago);

  return { debt, valorPago, valorRestante };
}

/** Totais agregados de todas as dívidas do usuário — para dashboard/relatórios. */
export async function getDebtsSummary(userId: string) {
  const [totalDebts, totalPaid] = await Promise.all([
    prisma.debt.aggregate({
      where: { userId },
      _sum: { totalAmount: true },
    }),
    prisma.debtPayment.aggregate({
      where: { userId },
      _sum: { amount: true },
    }),
  ]);

  const total = totalDebts._sum.totalAmount ?? new Prisma.Decimal(0);
  const paid = totalPaid._sum.amount ?? new Prisma.Decimal(0);
  const remaining = total.minus(paid);

  return { total, paid, remaining };
}
