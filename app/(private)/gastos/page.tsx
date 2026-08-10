import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

import { ExpenseManager } from "@/components/expenses/expense-manager";

export default async function ExpensesPage() {
  const user = await requireUser();

  const [categories, accounts, expenses] = await Promise.all([
    prisma.category.findMany({
      where: {
        userId: user.id,
        type: "EXPENSE",
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

    prisma.expense.findMany({
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
        paidAccount: {
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
        dueDate: "desc",
      },
    }),
  ]);

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6">
        <p className="font-display text-sm text-muted">Controle financeiro</p>

        <h1 className="font-display text-2xl text-ink sm:text-3xl">Gastos</h1>

        <p className="mt-1 max-w-2xl text-sm text-muted">
          Cadastre despesas previstas e registre o pagamento somente quando ele
          realmente acontecer.
        </p>
      </header>

      <ExpenseManager
        initialCategories={categories}
        initialAccounts={accounts}
        initialExpenses={expenses.map((expense) => ({
          id: expense.id,
          categoryId: expense.categoryId,
          categoryName: expense.category.name,
          title: expense.title,
          amount: expense.amount.toString(),
          dueDate: expense.dueDate.toISOString().slice(0, 10),
          status: expense.status,
          paidAt: expense.paidAt
            ? expense.paidAt.toISOString().slice(0, 10)
            : null,
          paidAccountName: expense.paidAccount
            ? `${expense.paidAccount.bank.name} — ${expense.paidAccount.name}`
            : null,

          installmentGroupId: expense.installmentGroupId,
          installmentNumber: expense.installmentNumber,
          installmentTotal: expense.installmentTotal,
        }))}
      />
    </div>
  );
}
