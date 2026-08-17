import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

import { SettingsTabs } from "@/components/settings/settings-tabs";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Configurações",
};

export default async function SettingsPage() {
  const user = await requireUser();

  const [banks, accounts, sessions] = await Promise.all([
    prisma.bank.findMany({
      where: {
        userId: user.id,
        active: false,
      },
      orderBy: {
        name: "asc",
      },
    }),

    prisma.bankAccount.findMany({
      where: {
        userId: user.id,
        active: false,
      },
      include: {
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

    prisma.session.findMany({
      where: {
        userId: user.id,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  const serializedInactiveBanks = banks.map((bank) => ({
    id: bank.id,
    name: bank.name,
    logoUrl: bank.logoUrl,
  }));

  const serializedInactiveAccounts = accounts.map(
    (account) => ({
      id: account.id,
      name: account.name,
      bankName: account.bank.name,
    }),
  );

  const serializedSessions = sessions.map((session) => ({
    id: session.id,
    userAgent: session.userAgent,
    ipAddress: session.ipAddress,
    createdAt: session.createdAt.toISOString(),
    expiresAt: session.expiresAt.toISOString(),
  }));

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-6">
        <p className="font-display text-sm text-muted">
          Sistema
        </p>

        <h1 className="font-display text-2xl text-ink sm:text-3xl">
          Configurações
        </h1>

        <p className="mt-1 max-w-2xl text-sm text-muted">
          Gerencie seu perfil, preferências e segurança.
        </p>
      </header>

      <SettingsTabs
        user={{
          id: user.id,
          name: user.name,
          email: user.email,
        }}
        inactiveBanks={serializedInactiveBanks}
        inactiveAccounts={serializedInactiveAccounts}
        sessions={serializedSessions}
      />
    </div>
  );
}