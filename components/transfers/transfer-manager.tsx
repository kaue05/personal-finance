"use client";

import { useState } from "react";

type Account = {
    id: string;
    name: string;
    bankName: string;
};

type Transfer = {
    id: string;
    fromAccount: {
        id: string;
        name: string;
        bankName: string;
    };
    toAccount: {
        id: string;
        name: string;
        bankName: string;
    };
    amount: string;
    date: string;
    description: string | null;
};

type TransferManagerProps = {
    initialAccounts: Account[];
    initialTransfers: Transfer[];
};

function formatBRL(value: string) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(Number(value));
}

function formatDate(value: string) {
    // Se já for ISO completo, usa direto
    if (value.includes("T")) {
        return new Intl.DateTimeFormat("pt-BR").format(
            new Date(value),
        );
    }

    // Se for só data (YYYY-MM-DD), adiciona o tempo
    return new Intl.DateTimeFormat("pt-BR").format(
        new Date(`${value}T12:00:00`),
    );
}

export function TransferManager({
    initialAccounts,
    initialTransfers,
}: TransferManagerProps) {
    const [accounts] = useState(initialAccounts);
    const [transfers, setTransfers] = useState(initialTransfers);

    const [fromAccountId, setFromAccountId] = useState("");
    const [toAccountId, setToAccountId] = useState("");
    const [amount, setAmount] = useState("");
    const [date, setDate] = useState(
        new Date().toISOString().slice(0, 10),
    );
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    function resetForm() {
        setFromAccountId("");
        setToAccountId("");
        setAmount("");
        setDate(new Date().toISOString().slice(0, 10));
        setDescription("");
        setError("");
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const response = await fetch("/api/transfers", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    fromAccountId,
                    toAccountId,
                    amount,
                    date,
                    description,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Não foi possível criar transferência");
            }

            const newTransfer: Transfer = {
                id: data.id,
                fromAccount: {
                    id: data.fromAccount?.id || "",
                    name: data.fromAccount?.name || "",
                    bankName: data.fromAccount?.bank?.name || "",
                },
                toAccount: {
                    id: data.toAccount?.id || "",
                    name: data.toAccount?.name || "",
                    bankName: data.toAccount?.bank?.name || "",
                },
                amount: data.amount.toString(),
                date: data.date,
                description: data.description,
            };

            setTransfers([newTransfer, ...transfers]);
            resetForm();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erro ao criar transferência");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-6">
            {error && (
                <div className="rounded-xl bg-negative/10 px-4 py-3 text-sm text-negative">
                    {error}
                </div>
            )}

            <section className="rounded-2xl border border-line bg-surface p-5">
                <h2 className="font-display text-lg text-ink">Nova transferência</h2>
                <p className="mt-1 text-sm text-muted">
                    Transfira valores entre suas contas.
                </p>

                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label htmlFor="fromAccount" className="mb-1 block text-sm font-medium text-ink">
                                Conta de origem
                            </label>
                            <select
                                id="fromAccount"
                                value={fromAccountId}
                                onChange={(e) => setFromAccountId(e.target.value)}
                                required
                                className="w-full rounded-xl border border-line bg-background px-3 py-2 text-sm outline-none focus:border-ink text-ink dark:bg-surface dark:text-ink"
                            >
                                <option value="">Selecione</option>
                                {accounts.map((acc) => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.bankName} — {acc.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="toAccount" className="mb-1 block text-sm font-medium text-ink">
                                Conta de destino
                            </label>
                            <select
                                id="toAccount"
                                value={toAccountId}
                                onChange={(e) => setToAccountId(e.target.value)}
                                required
                                className="w-full rounded-xl border border-line bg-background px-3 py-2 text-sm outline-none focus:border-ink text-ink dark:bg-surface dark:text-ink"
                            >
                                <option value="">Selecione</option>
                                {accounts.map((acc) => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.bankName} — {acc.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                        <div>
                            <label htmlFor="amount" className="mb-1 block text-sm font-medium text-ink">
                                Valor
                            </label>
                            <input
                                id="amount"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0,00"
                                inputMode="decimal"
                                required
                                className="w-full rounded-xl border border-line bg-background px-3 py-2 text-sm outline-none focus:border-ink text-ink dark:bg-surface dark:text-ink"
                            />
                        </div>

                        <div>
                            <label htmlFor="date" className="mb-1 block text-sm font-medium text-ink">
                                Data
                            </label>
                            <input
                                id="date"
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                required
                                className="w-full rounded-xl border border-line bg-background px-3 py-2 text-sm outline-none focus:border-ink text-ink dark:bg-surface dark:text-ink dark:[color-scheme:dark]"
                            />
                        </div>

                        <div>
                            <label htmlFor="description" className="mb-1 block text-sm font-medium text-ink">
                                Descrição (opcional)
                            </label>
                            <input
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Ex.: Reserva para investimento"
                                maxLength={150}
                                className="w-full rounded-xl border border-line bg-background px-3 py-2 text-sm outline-none focus:border-ink text-ink dark:bg-surface dark:text-ink"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-50 bg-primary text-primary-foreground"
                    >
                        {loading ? "Criando..." : "Transferir"}
                    </button>
                </form>
            </section>

            <section className="rounded-2xl border border-line bg-surface p-5">
                <h2 className="font-display text-lg text-ink">Transferências</h2>
                <p className="mt-1 text-sm text-muted">
                    {transfers.length} transferência(s)
                </p>

                {transfers.length === 0 ? (
                    <div className="mt-4 rounded-xl border border-dashed border-line p-6 text-center">
                        <p className="text-sm text-muted">Nenhuma transferência realizada.</p>
                    </div>
                ) : (
                    <div className="mt-4 space-y-3">
                        {transfers.map((transfer) => (
                            <div
                                key={transfer.id}
                                className="flex flex-col justify-between gap-3 rounded-xl border border-line p-4 sm:flex-row sm:items-center"
                            >
                                <div>
                                    <p className="font-medium text-ink">
                                        {formatDate(transfer.date)}
                                    </p>
                                    <p className="text-sm text-muted">
                                        {transfer.fromAccount.bankName} — {transfer.fromAccount.name} →{" "}
                                        {transfer.toAccount.bankName} — {transfer.toAccount.name}
                                    </p>
                                    {transfer.description && (
                                        <p className="text-xs text-muted mt-1">{transfer.description}</p>
                                    )}
                                </div>
                                <p className="font-medium text-ink">
                                    {formatBRL(transfer.amount)}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}