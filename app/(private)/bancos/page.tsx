import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

import { BankManager } from "@/components/banks/bank-manager";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bancos",
};

export default async function BanksPage() {
  const user = await requireUser();

  const banks = await prisma.bank.findMany({
    where: {
      userId: user.id,
    },
    include: {
      _count: {
        select: {
          bankAccounts: true,
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
  });

  const serializedBanks = banks.map((bank) => ({
    id: bank.id,
    name: bank.name,
    logoUrl: bank.logoUrl,
    active: bank.active,
    accountCount: bank._count.bankAccounts,
  }));

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6">
        <p className="font-display text-sm text-muted">Estrutura financeira</p>

        <h1 className="font-display text-2xl text-ink sm:text-3xl">Bancos</h1>

        <p className="mt-1 max-w-2xl text-sm text-muted">
          Cadastre os bancos onde suas contas estão registradas. Depois, você
          poderá adicionar contas correntes, poupanças e reservas.
        </p>
      </header>

      <BankManager initialBanks={serializedBanks} />
    </div>
  );
}
