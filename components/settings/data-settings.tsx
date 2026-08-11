"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function DataSettings() {
    const [isExporting, setIsExporting] = useState<string | null>(null);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [isClearing, setIsClearing] = useState(false);

    async function handleExport(type: string) {
        setIsExporting(type);

        try {
            const response = await fetch(
                `/api/settings/export?type=${type}`,
            );

            if (!response.ok) {
                throw new Error("Não foi possível exportar os dados");
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;

            const filename =
                type === "expenses"
                    ? "gastos.csv"
                    : type === "receivables"
                        ? "recebimentos.csv"
                        : "movimentacoes.csv";

            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch {
            // erro
        } finally {
            setIsExporting(null);
        }
    }

    async function handleClearData() {
        setIsClearing(true);

        try {
            const response = await fetch("/api/settings/clear", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    confirm: "DELETE_ALL_DATA",
                }),
            });

            if (!response.ok) {
                throw new Error("Não foi possível limpar os dados");
            }

            window.location.reload();
        } catch {
            setIsClearing(false);
            setShowClearConfirm(false);
        }
    }

    return (
        <div className="space-y-8">
            <section>
                <h2 className="font-display text-lg text-ink">
                    Exportar relatórios
                </h2>

                <p className="mt-1 text-sm text-muted">
                    Baixe seus dados em formato CSV.
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                        variant="outline"
                        onClick={() => handleExport("expenses")}
                        disabled={isExporting === "expenses"}
                    >
                        {isExporting === "expenses"
                            ? "Exportando..."
                            : "Gastos (CSV)"}
                    </Button>

                    <Button
                        variant="outline"
                        onClick={() => handleExport("receivables")}
                        disabled={isExporting === "receivables"}
                    >
                        {isExporting === "receivables"
                            ? "Exportando..."
                            : "Recebimentos (CSV)"}
                    </Button>

                    <Button
                        variant="outline"
                        onClick={() => handleExport("movements")}
                        disabled={isExporting === "movements"}
                    >
                        {isExporting === "movements"
                            ? "Exportando..."
                            : "Movimentações (CSV)"}
                    </Button>
                </div>
            </section>

            <section>
                <h2 className="font-display text-lg text-ink">
                    Backup
                </h2>

                <p className="mt-1 text-sm text-muted">
                    Seus dados estão armazenados de forma segura em nosso
                    banco de dados. Recomendamos exportar relatórios
                    periodicamente para ter uma cópia local.
                </p>
            </section>

            <section>
                <h2 className="font-display text-lg text-ink">
                    Limpar dados
                </h2>

                <p className="mt-1 text-sm text-muted">
                    Remova todos os seus registros (gastos, recebimentos e
                    movimentações). Esta ação não pode ser desfeita.
                </p>

                {!showClearConfirm ? (
                    <Button
                        className="mt-4"
                        variant="destructive"
                        onClick={() => setShowClearConfirm(true)}
                    >
                        Limpar todos os dados
                    </Button>
                ) : (
                    <div className="mt-4 rounded border border-red-200 bg-red-50 p-4">
                        <p className="text-sm text-red-800">
                            Tem certeza? Todos os seus registros serão
                            permanentemente apagados.
                        </p>

                        <div className="mt-4 flex gap-2">
                            <Button
                                variant="destructive"
                                onClick={handleClearData}
                                disabled={isClearing}
                            >
                                {isClearing ? "Limpando..." : "Sim, limpar tudo"}
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => setShowClearConfirm(false)}
                                disabled={isClearing}
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