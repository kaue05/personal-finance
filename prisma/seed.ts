/**
 * Seed inicial.
 *
 * - Cria o usuário ADMIN a partir de variáveis de ambiente (nunca hardcoded).
 * - Usa a própria API do Better Auth para criar o usuário, garantindo que a
 *   senha seja hasheada corretamente pelo mesmo mecanismo usado no login.
 * - Promove o usuário recém-criado a ADMIN diretamente no banco (role nunca
 *   é aceito como input em cadastros normais).
 * - Categorias padrão já são criadas automaticamente pelo hook de criação de
 *   usuário do Better Auth (ver lib/auth.ts), então não duplicamos aqui.
 *
 * Rodar com: npm run prisma:seed
 * Requer ADMIN_SEED_EMAIL e ADMIN_SEED_PASSWORD definidos no .env.
 */
import { PrismaClient } from "@prisma/client";
import { auth } from "../lib/auth";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_SEED_EMAIL;
  const password = process.env.ADMIN_SEED_PASSWORD;
  const name = process.env.ADMIN_SEED_NAME ?? "Administrador";

  if (!email || !password) {
    throw new Error(
      "Defina ADMIN_SEED_EMAIL e ADMIN_SEED_PASSWORD no .env antes de rodar o seed."
    );
  }

  if (password.length < 8) {
    throw new Error("ADMIN_SEED_PASSWORD deve ter ao menos 8 caracteres.");
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    if (existing.role !== "ADMIN") {
      await prisma.user.update({
        where: { id: existing.id },
        data: { role: "ADMIN" },
      });
      console.log(`Usuário existente '${email}' promovido a ADMIN.`);
    } else {
      console.log(`Usuário ADMIN '${email}' já existe. Nada a fazer.`);
    }
    return;
  }

  const result = await auth.api.signUpEmail({
    body: { email, password, name },
  });

  if (!result.user) {
    throw new Error("Falha ao criar usuário ADMIN via Better Auth.");
  }

  await prisma.user.update({
    where: { id: result.user.id },
    data: { role: "ADMIN" },
  });

  console.log(`Usuário ADMIN criado com sucesso: ${email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
