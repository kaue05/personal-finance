import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const PUBLIC_ROUTES = ["/login", "/cadastro"];

/**
 * Checagem RÁPIDA baseada em cookie (roda no edge, sem acessar o banco).
 * Isso é apenas a primeira camada de defesa (evita renderizar telas privadas
 * para quem obviamente não tem sessão). A validação real de sessão, role
 * (USER/ADMIN) e ownership dos dados é sempre refeita no servidor
 * (ver lib/auth/guards.ts) — nunca confiamos somente nesta camada.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = getSessionCookie(request);
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  if (!sessionCookie && !isPublicRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (sessionCookie && isPublicRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/gastos/:path*",
    "/recebimentos/:path*",
    "/contas/:path*",
    "/bancos/:path*",
    "/dividas/:path*",
    "/relatorios/:path*",
    "/categorias/:path*",
    "/configuracoes/:path*",
    "/admin/:path*",
    "/login",
    "/cadastro",
  ],
};
