"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type User = {
    id: string;
    name: string;
    email: string;
};

type ProfileSettingsProps = {
    user: User;
};

export function ProfileSettings({ user }: ProfileSettingsProps) {
    const [name, setName] = useState(user.name);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isChangingPassword, setIsChangingPassword] =
        useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordSuccess, setPasswordSuccess] = useState(false);

    async function handleSaveProfile(e: React.FormEvent) {
        e.preventDefault();

        setIsSaving(true);
        setError(null);
        setSuccess(false);

        try {
            const response = await fetch("/api/settings/profile", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || "Não foi possível atualizar o perfil",
                );
            }

            setSuccess(true);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Erro ao atualizar",
            );
        } finally {
            setIsSaving(false);
        }
    }

    async function handleChangePassword(e: React.FormEvent) {
        e.preventDefault();

        setIsChangingPassword(true);
        setPasswordError(null);
        setPasswordSuccess(false);

        try {
            const response = await fetch("/api/settings/password", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword,
                    confirmPassword,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || "Não foi possível alterar a senha",
                );
            }

            setPasswordSuccess(true);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (err) {
            setPasswordError(
                err instanceof Error ? err.message : "Erro ao alterar senha",
            );
        } finally {
            setIsChangingPassword(false);
        }
    }

    return (
        <div className="space-y-8">
            <section>
                <h2 className="font-display text-lg text-ink">
                    Informações pessoais
                </h2>

                <p className="mt-1 text-sm text-muted">
                    Atualize seus dados de perfil.
                </p>

                <form onSubmit={handleSaveProfile} className="mt-4 space-y-4">
                    <div>
                        <Label htmlFor="name">Nome completo</Label>
                        <Input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={user.email}
                            disabled
                            className="mt-1 bg-muted"
                        />
                        <p className="mt-1 text-xs text-muted">
                            O email não pode ser alterado.
                        </p>
                    </div>

                    {error && (
                        <p className="text-sm text-red-600">{error}</p>
                    )}

                    {success && (
                        <p className="text-sm text-green-600">
                            Perfil atualizado com sucesso!
                        </p>
                    )}

                    <Button type="submit" disabled={isSaving}>
                        {isSaving ? "Salvando..." : "Salvar alterações"}
                    </Button>
                </form>
            </section>

            <section>
                <h2 className="font-display text-lg text-ink">
                    Alterar senha
                </h2>

                <p className="mt-1 text-sm text-muted">
                    Atualize sua senha de acesso.
                </p>

                <form onSubmit={handleChangePassword} className="mt-4 space-y-4">
                    <div>
                        <Label htmlFor="currentPassword">Senha atual</Label>
                        <Input
                            id="currentPassword"
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <Label htmlFor="newPassword">Nova senha</Label>
                        <Input
                            id="newPassword"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="mt-1"
                        />
                    </div>

                    {passwordError && (
                        <p className="text-sm text-red-600">{passwordError}</p>
                    )}

                    {passwordSuccess && (
                        <p className="text-sm text-green-600">
                            Senha alterada com sucesso!
                        </p>
                    )}

                    <Button type="submit" disabled={isChangingPassword}>
                        {isChangingPassword ? "Alterando..." : "Alterar senha"}
                    </Button>
                </form>
            </section>
        </div>
    );
}