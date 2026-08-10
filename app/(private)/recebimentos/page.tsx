import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

import { ReceivableManager } from "@/components/receivables/receivable-manager";

export default async function ReceivablesPage() {
  const user = await requireUser();

  const [categories, accounts, receivables] = await Promise.all([
    prisma.category.findMany({
      where: {
        userId: user.id,
        type: "RECEIVABLE",
        active: true,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
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

    prisma.receivable.findMany({
      where: {
        userId: user.id,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        receivedAccount: {
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
        expectedDate: "desc",
      },
    }),
  ]);

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6">
        <p className="font-display text-sm text-muted">Controle financeiro</p>

        <h1 className="font-display text-2xl text-ink sm:text-3xl">
          Recebimentos
        </h1>

        <p className="mt-1 max-w-2xl text-sm text-muted">
          Cadastre valores previstos e registre a entrada somente quando o
          dinheiro for efetivamente recebido.
        </p>
      </header>

      <ReceivableManager
        initialCategories={categories}
        initialAccounts={accounts}
        initialReceivables={receivables.map((receivable) => ({
          id: receivable.id,
          categoryId: receivable.categoryId,
          categoryName: receivable.category.name,
          title: receivable.title,
          amount: receivable.amount.toString(),
          expectedDate: receivable.expectedDate.toISOString().slice(0, 10),

          referenceMonth: receivable.referenceMonth
            ? receivable.referenceMonth.toISOString().slice(0, 7)
            : "",

          status: receivable.status,

          receivedAt: receivable.receivedAt
            ? receivable.receivedAt.toISOString().slice(0, 10)
            : null,

          receivedAccountName: receivable.receivedAccount
            ? `${receivable.receivedAccount.bank.name} — ${receivable.receivedAccount.name}`
            : null,
        }))}
      />
    </div>
  );
}
