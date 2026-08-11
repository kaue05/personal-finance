"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

type InactiveBank = {
    id: string;
    name: string;
    logoUrl: string | null;
};

type InactiveAccount = {
    id: string;
    name: string;
    bankName: string;
};

type FinancialSettingsProps = {
    inactiveBanks: InactiveBank[];
    inactiveAccounts: InactiveAccount[];
};

export function FinancialSettings({
    inactiveBanks,
    inactiveAccounts,
}: FinancialSettingsProps) {
    const [fiscalYearStart, setFiscalYearStart] =
        useState("0");
    const [isRestoring, setIsRestoring] = useState(false);
    const [success, setSuccess] = useState(false);

    const [reactivatingBank, setReactivatingBank] =
        useState<string | null>(null);
    const [reactivatingAccount, setReactivatingAccount] =
        useState<string | null>(null);

    // Adicione esta função no componente
    async function handleRestoreCategories() {
        setIsRestoring(true);
        setSuccess(false);

        try {
            const response = await fetch(
                "/api/settings/categories/restore",
                {
                    method: "POST",
                },
            );

            if (!response.ok) {
                throw new Error("Não foi possível restaurar as categorias");
            }

            setSuccess(true);
        } catch {
            // erro
        } finally {
            setIsRestoring(false);
        }
    }

    async function handleReactivateBank(id: string) {
        setReactivatingBank(id);

        try {
            const response = await fetch(
                `/api/settings/banks/${id}/reactivate`,
                {
                    method: "POST",
                },
            );

            if (!response.ok) {
                throw new Error("Não foi possível reativar o banco");
            }

            // Recarregar a página ou remover da lista
            window.location.reload();
        } catch {
            setReactivatingBank(null);
        }
    }

    async function handleReactivateAccount(id: string) {
        setReactivatingAccount(id);

        try {
            const response = await fetch(
                `/api/settings/accounts/${id}/reactivate`,
                {
                    method: "POST",
                },
            );

            if (!response.ok) {
                throw new Error("Não foi possível reativar a conta");
            }

            window.location.reload();
        } catch {
            setReactivatingAccount(null);
        }
    }

    return (
        <div className="space-y-8">
            <section>
                <h2 className="font-display text-lg text-ink">
                    Ano fiscal
                </h2>

                <p className="mt-1 text-sm text-muted">
                    Defina o mês de início do seu ano fiscal.
                </p>

                <div className="mt-4">
                    <Label htmlFor="fiscalYearStart">
                        Mês de início
                    </Label>
                    <Select
                        value={fiscalYearStart}
                        onValueChange={setFiscalYearStart}
                    >
                        <SelectTrigger id="fiscalYearStart" className="mt-1">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="0">Janeiro</SelectItem>
                            <SelectItem value="1">Fevereiro</SelectItem>
                            <SelectItem value="2">Março</SelectItem>
                            <SelectItem value="3">Abril</SelectItem>
                            <SelectItem value="4">Maio</SelectItem>
                            <SelectItem value="5">Junho</SelectItem>
                            <SelectItem value="6">Julho</SelectItem>
                            <SelectItem value="7">Agosto</SelectItem>
                            <SelectItem value="8">Setembro</SelectItem>
                            <SelectItem value="9">Outubro</SelectItem>
                            <SelectItem value="10">Novembro</SelectItem>
                            <SelectItem value="11">Dezembro</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </section>

            <section>
                <h2 className="font-display text-lg text-ink">
                    Categorias
                </h2>

                <p className="mt-1 text-sm text-muted">
                    Restaure as categorias padrão do sistema.
                </p>

                <Button
                    onClick={handleRestoreCategories}
                    disabled={isRestoring}
                    className="mt-4"
                    variant="outline"
                >
                    {isRestoring
                        ? "Restaurando..."
                        : "Restaurar categorias padrão"}
                </Button>

                {success && (
                    <p className="mt-2 text-sm text-green-600">
                        Categorias restauradas com sucesso!
                    </p>
                )}
            </section>

            {inactiveBanks.length > 0 && (
                <section>
                    <h2 className="font-display text-lg text-ink">
                        Bancos inativos
                    </h2>

                    <p className="mt-1 text-sm text-muted">
                        Reative bancos que foram desativados.
                    </p>

                    <ul className="mt-4 space-y-2">
                        {inactiveBanks.map((bank) => (
                            <li
                                key={bank.id}
                                className="flex items-center justify-between rounded border border-line p-3"
                            >
                                <div className="flex items-center gap-3">
                                    {bank.logoUrl && (
                                        <img
                                            src={bank.logoUrl}
                                            alt={bank.name}
                                            className="h-8 w-8 object-contain"
                                        />
                                    )}
                                    <span className="font-medium text-ink">
                                        {bank.name}
                                    </span>
                                </div>

                                <Button
                                    size="sm"
                                    onClick={() => handleReactivateBank(bank.id)}
                                    disabled={reactivatingBank === bank.id}
                                >
                                    {reactivatingBank === bank.id
                                        ? "Reativando..."
                                        : "Reativar"}
                                </Button>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {inactiveAccounts.length > 0 && (
                <section>
                    <h2 className="font-display text-lg text-ink">
                        Contas inativas
                    </h2>

                    <p className="mt-1 text-sm text-muted">
                        Reative contas que foram desativadas.
                    </p>

                    <ul className="mt-4 space-y-2">
                        {inactiveAccounts.map((account) => (
                            <li
                                key={account.id}
                                className="flex items-center justify-between rounded border border-line p-3"
                            >
                                <div>
                                    <span className="font-medium text-ink">
                                        {account.name}
                                    </span>
                                    <span className="ml-2 text-sm text-muted">
                                        {account.bankName}
                                    </span>
                                </div>

                                <Button
                                    size="sm"
                                    onClick={() =>
                                        handleReactivateAccount(account.id)
                                    }
                                    disabled={reactivatingAccount === account.id}
                                >
                                    {reactivatingAccount === account.id
                                        ? "Reativando..."
                                        : "Reativar"}
                                </Button>
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </div>
    );
}