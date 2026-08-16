import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/**
 * Todo acesso a dado financeiro DEVE passar por aqui para obter o userId —
 * nunca aceitar um userId vindo do body/query do client. A sessão é a única
 * fonte de verdade sobre "quem está pedindo".
 */
export async function getCurrentSession() {
  return auth.api.getSession({ headers: await headers() });
}

/** Usa em Server Components/Actions de páginas privadas. Redireciona para /login se não autenticado. */
export async function requireUser() {
  const session = await getCurrentSession();

  if (!session?.user) {
    redirect("/login");
  }

  if (!session.user.active) {
    redirect("/conta-desativada");
  }

  return session.user;
}

/**
 * Usa em Server Components/Actions da área administrativa.
 * Autorização por role verificada SEMPRE no servidor — nunca confiar em
 * proteção de rota do frontend isoladamente.
 */
export async function requireAdmin() {
  const user = await requireUser();

  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return user;
}
