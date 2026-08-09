import "server-only";

import { MovementOrigin, MovementType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Implementação de referência do mecanismo de transferência.
 *
 * Isto NÃO é a tela/CRUD de transferências (fora do escopo desta fase) — é a
 * prova de que a modelagem suporta o requisito central da arquitetura:
 * transferência = 1 Transfer + 2 Movements atômicas, dentro de uma única
 * transaction do Prisma. As próximas fases (Server Actions dos CRUDs) devem
 * seguir este mesmo padrão para gastos, recebimentos e pagamentos de dívida.
 *
 * Transferências NÃO são receita nem gasto: `origin` é sempre TRANSFERENCIA
 * e nenhuma categoryId é atribuída às movimentações geradas.
 */
export async function createTransfer(params: {
  userId: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number | string;
  date: Date;
  description?: string;
}) {
  const { userId, fromAccountId, toAccountId, amount, date, description } = params;

  if (fromAccountId === toAccountId) {
    throw new Error("Conta de origem e destino não podem ser a mesma.");
  }

  return prisma.$transaction(async (tx) => {
    // Ownership: garante que AMBAS as contas pertencem ao usuário da sessão —
    // nunca confiar em um accountId vindo do client sem revalidar o dono.
    const [fromAccount, toAccount] = await Promise.all([
      tx.bankAccount.findFirstOrThrow({ where: { id: fromAccountId, userId, active: true } }),
      tx.bankAccount.findFirstOrThrow({ where: { id: toAccountId, userId, active: true } }),
    ]);

    const transfer = await tx.transfer.create({
      data: {
        userId,
        fromAccountId: fromAccount.id,
        toAccountId: toAccount.id,
        amount,
        date,
        description,
      },
    });

    await tx.movement.createMany({
      data: [
        {
          userId,
          accountId: fromAccount.id,
          type: MovementType.SAIDA,
          amount,
          date,
          description,
          origin: MovementOrigin.TRANSFERENCIA,
          transferId: transfer.id,
        },
        {
          userId,
          accountId: toAccount.id,
          type: MovementType.ENTRADA,
          amount,
          date,
          description,
          origin: MovementOrigin.TRANSFERENCIA,
          transferId: transfer.id,
        },
      ],
    });

    return transfer;
  });
}
