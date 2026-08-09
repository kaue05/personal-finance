import { CategoryType, type PrismaClient } from "@prisma/client";

export const DEFAULT_EXPENSE_CATEGORIES = [
  "Casa",
  "Moto",
  "Carro",
  "Mercado",
  "Restaurante",
  "Outros",
];

export const DEFAULT_RECEIVABLE_CATEGORIES = [
  "Adiantamento",
  "Pagamento",
  "Adicional",
];

/**
 * Cria as categorias iniciais para um usuário recém-criado.
 * Usado tanto pelo hook de registro (Better Auth) quanto pelo seed do ADMIN.
 * Idempotente: usa skipDuplicates para nunca duplicar em reexecuções.
 */
export async function createDefaultCategoriesForUser(
  db: PrismaClient,
  userId: string
) {
  await db.category.createMany({
    data: [
      ...DEFAULT_EXPENSE_CATEGORIES.map((name) => ({
        userId,
        name,
        type: CategoryType.EXPENSE,
      })),
      ...DEFAULT_RECEIVABLE_CATEGORIES.map((name) => ({
        userId,
        name,
        type: CategoryType.RECEIVABLE,
      })),
    ],
    skipDuplicates: true,
  });
}
