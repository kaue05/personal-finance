"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

type Session = {
    id: string;
    userAgent: string | null;
    ipAddress: string | null;
    createdAt: string;
    expiresAt: string;
};

type SecuritySettingsProps = {
    sessions: Session[];
};

export function SecuritySettings({ sessions }: SecuritySettingsProps) {
    const [revokingId, setRevokingId] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] =
        useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    async function handleRevokeSession(id: string) {
        setRevokingId(id);

        try {
            const response = await fetch(`/api/settings/sessions/${id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Não foi possível revogar a sessão");
            }

            window.location.reload();
        } catch {
            setRevokingId(null);
        }
    }

    async function handleDeleteAccount() {
        setIsDeleting(true);

        try {
            const response = await fetch("/api/settings/account", {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                confirm: "DELETE_MY_ACCOUNT",
            }),
            });

            if (!response.ok) {
            throw new Error("Não foi possível excluir a conta");
            }

            // Redirecionar para home ou login
            window.location.href = "/";
        } catch {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    }

    function formatSessionInfo(session: Session) {
        const ua = session.userAgent || "Dispositivo desconhecido";
        const ip = session.ipAddress || "IP desconhecido";

        const browser = ua.includes("Chrome")
            ? "Chrome"
            : ua.includes("Firefox")
                ? "Firefox"
                : ua.includes("Safari")
                    ? "Safari"
                    : "Outro";

        const device = ua.includes("Mobile")
            ? "Celular"
            : ua.includes("Table")
                ? "Tablet"
                : "Computador";

        return `${device} — ${browser} — ${ip}`;
    }

    function formatDate(isoString: string) {
        return new Date(isoString).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    return (
        <div className="space-y-8">
            <section>
                <h2 className="font-display text-lg text-ink">
                    Sessões ativas
                </h2>

                <p className="mt-1 text-sm text-muted">
                    Gerencie os dispositivos onde você está logado.
                </p>

                {sessions.length === 0 ? (
                    <p className="mt-4 text-sm text-muted">
                        Nenhuma sessão ativa encontrada.
                    </p>
                ) : (
                    <ul className="mt-4 space-y-2">
                        {sessions.map((session) => (
                            <li
                                key={session.id}
                                className="flex items-center justify-between rounded border border-line p-3"
                            >
                                <div>
                                    <p className="font-medium text-ink">
                                        {formatSessionInfo(session)}
                                    </p>
                                    <p className="text-xs text-muted">
                                        Iniciada em {formatDate(session.createdAt)} •{" "}
                                        Expira em {formatDate(session.expiresAt)}
                                    </p>
                                </div>

                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleRevokeSession(session.id)}
                                    disabled={revokingId === session.id}
                                >
                                    {revokingId === session.id
                                        ? "Revogando..."
                                        : "Revogar"}
                                </Button>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <section>
                <h2 className="font-display text-lg text-ink">
                    Autenticação de dois fatores
                </h2>

                <p className="mt-1 text-sm text-muted">
                    Adicione uma camada extra de segurança à sua conta.
                </p>

                <Button className="mt-4" variant="outline" disabled>
                    Em breve
                </Button>
            </section>

            <section>
                <h2 className="font-display text-lg text-ink">
                    Excluir conta
                </h2>

                <p className="mt-1 text-sm text-muted">
                    Esta ação é irreversível. Todos os seus dados serão
                    permanentemente apagados.
                </p>

                {!showDeleteConfirm ? (
                    <Button
                        className="mt-4"
                        variant="destructive"
                        onClick={() => setShowDeleteConfirm(true)}
                    >
                        Excluir conta
                    </Button>
                ) : (
                    <div className="mt-4 rounded border border-red-200 bg-red-50 p-4">
                        <p className="text-sm text-red-800">
                            Tem certeza? Esta ação não pode ser desfeita.
                        </p>

                        <div className="mt-4 flex gap-2">
                            <Button
                                variant="destructive"
                                onClick={handleDeleteAccount}
                                disabled={isDeleting}
                            >
                                {isDeleting ? "Excluindo..." : "Sim, excluir minha conta"}
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={isDeleting}
                            >
                                Cancelar
                            </Button>
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}