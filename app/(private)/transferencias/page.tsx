import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { TransferManager } from "@/components/transfers/transfer-manager";

import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Transferências",
};

export default async function TransferenciasPage() {
    const user = await requireUser();

    const [accounts, transfers] = await Promise.all([
        prisma.bankAccount.findMany({
            where: {
                userId: user.id,
                active: true,
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

        prisma.transfer.findMany({
            where: {
                userId: user.id,
            },
            include: {
                fromAccount: {
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
                toAccount: {
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
        }),
    ]);

    const serializedAccounts = accounts.map((acc) => ({
        id: acc.id,
        name: acc.name,
        bankName: acc.bank.name,
    }));

    const serializedTransfers = transfers.map((t) => ({
        id: t.id,
        fromAccount: {
            id: t.fromAccount.id,
            name: t.fromAccount.name,
            bankName: t.fromAccount.bank.name,
        },
        toAccount: {
            id: t.toAccount.id,
            name: t.toAccount.name,
            bankName: t.toAccount.bank.name,
        },
        amount: t.amount.toString(),
        date: t.date.toISOString(),
        description: t.description,
    }));

    return (
        <div className="mx-auto max-w-4xl">
            <header className="mb-6">
                <p className="font-display text-sm text-muted">Sistema</p>
                <h1 className="font-display text-2xl text-ink sm:text-3xl">
                    Transferências
                </h1>
                <p className="mt-1 text-sm text-muted">
                    Transfira valores entre suas contas.
                </p>
            </header>

            <TransferManager
                initialAccounts={serializedAccounts}
                initialTransfers={serializedTransfers}
            />
        </div>
    );
}