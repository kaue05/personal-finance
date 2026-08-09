"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/dashboard";
  const desativada = searchParams.get("erro") === "conta-desativada";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signInError } = await authClient.signIn.email({ email, password });

    setLoading(false);

    if (signInError) {
      setError("E-mail ou senha inválidos.");
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <Card>
      <h1 className="font-display text-xl text-ink">Entrar</h1>
      <p className="mt-1 text-sm text-muted">Acesse seu controle financeiro.</p>

      {desativada && (
        <p className="mt-4 rounded-md bg-negative/10 px-3 py-2 text-sm text-negative">
          Esta conta está desativada. Entre em contato com o administrador.
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-negative">{error}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-muted">
        Não tem uma conta?{" "}
        <a href="/cadastro" className="font-medium text-primary hover:underline">
          Cadastre-se
        </a>
      </p>
    </Card>
  );
}
