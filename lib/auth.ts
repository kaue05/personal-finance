import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { createDefaultCategoriesForUser } from "./default-categories";

/**
 * Configuração central de autenticação (Better Auth).
 *
 * - `role` e `active` são campos de PLATAFORMA, não financeiros. `role` nunca
 *   é aceito como input do client (`input: false`) — só pode ser alterado
 *   diretamente no banco/servidor, nunca pelo próprio usuário na requisição
 *   de cadastro. Isso evita que alguém se autopromova a ADMIN.
 * - Ao criar um novo usuário, populamos automaticamente as categorias
 *   padrão dele (Casa, Moto, Carro... / Adiantamento, Pagamento...).
 */
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },

  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 dias
    updateAge: 60 * 60 * 24, // renova a cada 24h de uso
  },

  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "USER",
        input: false, // nunca aceito do client — só definido no servidor
      },
      active: {
        type: "boolean",
        defaultValue: true,
        input: false,
      },
    },
  },

  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await createDefaultCategoriesForUser(prisma, user.id);
        },
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
