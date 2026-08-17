"use client";

import { useState, useRef } from "react";

import { Button } from "@/components/ui/button";

export function DataSettings() {
    const [isExporting, setIsExporting] = useState<string | null>(null);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [isClearing, setIsClearing] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [importResult, setImportResult] = useState<{
        imported?: number;
        errors?: string[];
    } | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

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

    function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        if (!file) return;

        handleImport(file);
    }

    async function handleImport(file: File) {
        setIsImporting(true);
        setImportResult(null);

        try {
            const text = await file.text();
            const lines = text.split("\n").filter((line) => line.trim());

            if (lines.length < 2) {
                throw new Error("Arquivo vazio ou inválido");
            }

            // Detectar tipo pelo nome do arquivo
            const isExpenses = file.name.toLowerCase().includes("gasto");
            const type = isExpenses ? "expenses" : "receivables";

            // Parse CSV
            const headers = lines[0]!.split(";").map((h) => h.trim().replace(/"/g, ""));
            const data = lines.slice(1).map((line) => {
                const values = line.split(";").map((v) => v.trim().replace(/"/g, ""));
                const row: Record<string, string> = {};
                headers.forEach((header, i) => {
                    row[header] = values[i] || "";
                });
                return row;
            });

            const response = await fetch("/api/settings/import", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    type,
                    data,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Não foi possível importar");
            }

            setImportResult({
                imported: result.imported,
                errors: result.errors,
            });

            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        } catch (err) {
            setImportResult({
                errors: [err instanceof Error ? err.message : "Erro ao importar"],
            });
        } finally {
            setIsImporting(false);
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
                    Importar dados
                </h2>

                <p className="mt-1 text-sm text-muted">
                    Importe gastos ou recebimentos de um arquivo CSV.
                </p>

                <div className="mt-4 flex items-center gap-2">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="import-file"
                    />

                    <Button
                        variant="outline"
                        onClick={() => {
                            if (fileInputRef.current) {
                                fileInputRef.current.click();
                            }
                        }}
                        disabled={isImporting}
                    >
                        {isImporting ? "Importando..." : "Selecionar arquivo CSV"}
                    </Button>

                    <span className="text-sm text-muted">
                        Apenas arquivos exportados do sistema
                    </span>
                </div>

                {importResult && (
                    <div className="mt-4 rounded-xl border border-line bg-surface p-4">
                        {importResult.imported !== undefined && (
                            <p className="text-sm text-positive">
                                ✓ {importResult.imported} registro(s) importado(s) com sucesso
                            </p>
                        )}

                        {importResult.errors && importResult.errors.length > 0 && (
                            <div className="mt-2">
                                <p className="text-sm text-negative">
                                    Erros na importação:
                                </p>
                                <ul className="mt-1 list-disc pl-5 text-sm text-muted">
                                    {importResult.errors.slice(0, 5).map((error, i) => (
                                        <li key={i}>{error}</li>
                                    ))}
                                    {importResult.errors.length > 5 && (
                                        <li>...e mais {importResult.errors.length - 5} erros</li>
                                    )}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
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