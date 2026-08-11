import { Prisma } from "@prisma/client";

import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

import { DebtManager } from "@/components/debts/debt-manager";

export default async function DebtsPage() {
  const user = await requireUser();

  const [debts, accounts] = await Promise.all([
    prisma.debt.findMany({
      where: {
        userId: user.id,
      },
      include: {
        payments: {
          include: {
            account: {
              select: {
                id: true,
                name: true,
                bank: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: {
            date: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),

    prisma.bankAccount.findMany({
      where: {
        userId: user.id,
        active: true,
      },
      select: {
        id: true,
        name: true,
        bank: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  const serializedDebts = debts.map((debt) => {
    const paid = debt.payments.reduce(
      (total, payment) =>
        total.plus(payment.amount),
      new Prisma.Decimal(0),
    );

    const remaining = debt.totalAmount.minus(paid);

    return {
      id: debt.id,
      title: debt.title,
      totalAmount: debt.totalAmount.toString(),
      paid: paid.toString(),
      remaining: remaining.toString(),
      status: debt.status,
      lastPaymentAt: debt.lastPaymentAt
        ? debt.lastPaymentAt
          .toISOString()
          .slice(0, 10)
        : null,

      payments: debt.payments.map((payment) => ({
        id: payment.id,
        amount: payment.amount.toString(),
        date: payment.date
          .toISOString()
          .slice(0, 10),
        note: payment.note,
        accountName: `${payment.account.bank.name} — ${payment.account.name}`,
      })),
    };
  });

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6">
        <p className="font-display text-sm text-muted">
          Controle financeiro
        </p>

        <h1 className="font-display text-2xl text-ink sm:text-3xl">
          Dívidas
        </h1>

        <p className="mt-1 max-w-2xl text-sm text-muted">
          Cadastre dívidas, registre pagamentos parciais e acompanhe o
          valor restante.
        </p>
      </header>

      <DebtManager
        initialAccounts={accounts}
        initialDebts={serializedDebts}
      />
    </div>
  );
}