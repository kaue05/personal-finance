import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

import { AccountManager } from "@/components/accounts/account-manager";

export default async function AccountsPage() {
  const user = await requireUser();

  const [banks, accounts] = await Promise.all([
    prisma.bank.findMany({
      where: {
        userId: user.id,
        active: true,
      },
      select: {
        id: true,
        name: true,
        logoUrl: true,
      },
      orderBy: {
        name: "asc",
      },
    }),

    prisma.bankAccount.findMany({
      where: {
        userId: user.id,
      },
      include: {
        bank: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
          },
        },
        _count: {
          select: {
            movementsAsSource: true,
          },
        },
      },
      orderBy: [
        {
          active: "desc",
        },
        {
          name: "asc",
        },
      ],
    }),
  ]);

  const serializedAccounts = accounts.map((account) => ({
    id: account.id,
    bankId: account.bank.id,
    bankName: account.bank.name,
    bankLogoUrl: account.bank.logoUrl,
    name: account.name,
    type: account.type,
    active: account.active,
    movementCount: account._count.movementsAsSource,
  }));

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6">
        <p className="font-display text-sm text-muted">Estrutura financeira</p>

        <h1 className="font-display text-2xl text-ink sm:text-3xl">Contas</h1>

        <p className="mt-1 max-w-2xl text-sm text-muted">
          Cadastre suas contas correntes, poupanças e reservas. O saldo será
          calculado posteriormente pelas movimentações.
        </p>
      </header>

      <AccountManager
        initialBanks={banks}
        initialAccounts={serializedAccounts}
      />
    </div>
  );
}
