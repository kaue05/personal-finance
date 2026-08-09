import "server-only";

import { Prisma, MovementType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * O saldo de uma conta é SEMPRE consequência das movimentações:
 *   saldo = soma(ENTRADA) - soma(SAIDA)
 * Nunca lemos/gravamos um campo "balance" em BankAccount.
 */
export async function getAccountBalance(
  userId: string,
  accountId: string
): Promise<Prisma.Decimal> {
  const [entradas, saidas] = await Promise.all([
    prisma.movement.aggregate({
      where: { userId, accountId, type: MovementType.ENTRADA },
      _sum: { amount: true },
    }),
    prisma.movement.aggregate({
      where: { userId, accountId, type: MovementType.SAIDA },
      _sum: { amount: true },
    }),
  ]);

  const total = (entradas._sum.amount ?? new Prisma.Decimal(0)).minus(
    saidas._sum.amount ?? new Prisma.Decimal(0)
  );

  return total;
}

/** Saldo de todas as contas do usuário, agrupado por conta. */
export async function getBalancesByAccount(userId: string) {
  const accounts = await prisma.bankAccount.findMany({
    where: { userId, active: true },
    include: { bank: true },
  });

  const balances = await Promise.all(
    accounts.map(async (account) => ({
      account,
      balance: await getAccountBalance(userId, account.id),
    }))
  );

  return balances;
}

/** Saldo total (patrimônio), saldo por banco e saldo por tipo de conta — para o dashboard. */
export async function getPatrimonySummary(userId: string) {
  const balances = await getBalancesByAccount(userId);

  const total = balances.reduce(
    (acc, b) => acc.plus(b.balance),
    new Prisma.Decimal(0)
  );

  const byBank = new Map<string, { bankName: string; total: Prisma.Decimal }>();
  const byType = new Map<string, Prisma.Decimal>();

  for (const { account, balance } of balances) {
    const bankEntry = byBank.get(account.bankId) ?? {
      bankName: account.bank.name,
      total: new Prisma.Decimal(0),
    };
    bankEntry.total = bankEntry.total.plus(balance);
    byBank.set(account.bankId, bankEntry);

    const typeTotal = byType.get(account.type) ?? new Prisma.Decimal(0);
    byType.set(account.type, typeTotal.plus(balance));
  }

  return {
    total,
    byAccount: balances,
    byBank: Array.from(byBank.entries()).map(([bankId, v]) => ({
      bankId,
      ...v,
    })),
    byType: Array.from(byType.entries()).map(([type, total]) => ({
      type,
      total,
    })),
  };
}
