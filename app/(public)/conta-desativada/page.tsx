"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export default function ContaDesativadaPage() {
    async function handleLogout() {
        await authClient.signOut();
        window.location.href = "/login";
    }

    return (
        <div className="mx-auto max-w-md">
            <Card>
                <h1 className="font-display text-xl text-ink">Conta desativada</h1>
                <p className="mt-2 text-sm text-muted">
                    Sua conta foi desativada. Entre em contato com o administrador para reativar.
                </p>

                <div className="mt-6">
                    <Button onClick={handleLogout} className="w-full">
                        Sair e voltar ao login
                    </Button>
                </div>
            </Card>
        </div>
    );
}