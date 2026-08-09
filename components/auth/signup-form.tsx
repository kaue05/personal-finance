"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export function SignUpForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("A senha deve ter ao menos 8 caracteres.");
      return;
    }

    setLoading(true);
    // Observação: `role` nunca é enviado aqui — é sempre USER por padrão no
    // servidor (ver lib/auth.ts). Não há como um usuário se autopromover.
    const { error: signUpError } = await authClient.signUp.email({ name, email, password });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message ?? "Não foi possível criar a conta.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Card>
      <h1 className="font-display text-xl text-ink">Criar conta</h1>
      <p className="mt-1 text-sm text-muted">Comece a organizar suas finanças.</p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <Label htmlFor="name">Nome</Label>
          <Input
            id="name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
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
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p className="mt-1 text-xs text-muted">Mínimo de 8 caracteres.</p>
        </div>

        {error && <p className="text-sm text-negative">{error}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Criando conta..." : "Criar conta"}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-muted">
        Já tem uma conta?{" "}
        <a href="/login" className="font-medium text-primary hover:underline">
          Entrar
        </a>
      </p>
    </Card>
  );
}
