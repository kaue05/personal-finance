"use client";

import {
    FormEvent,
    useMemo,
    useState,
} from "react";

type Account = {
    id: string;
    name: string;
    bank: {
        name: string;
    };
};

type DebtStatus = "ABERTA" | "QUITADA";

type Payment = {
    id: string;
    amount: string;
    date: string;
    note: string | null;
    accountName: string;
};

type Debt = {
    id: string;
    title: string;
    totalAmount: string;
    paid: string;
    remaining: string;
    status: DebtStatus;
    lastPaymentAt: string | null;
    payments: Payment[];
};

type DebtManagerProps = {
    initialAccounts: Account[];
    initialDebts: Debt[];
};

function formatBRL(value: string) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(Number(value));
}

function formatDate(value: string) {
    return new Intl.DateTimeFormat("pt-BR").format(
        new Date(`${value}T12:00:00`),
    );
}

export function DebtManager({
    initialAccounts,
    initialDebts,
}: DebtManagerProps) {
    const [accounts] = useState(initialAccounts);
    const [debts, setDebts] = useState(initialDebts);

    const [title, setTitle] = useState("");
    const [totalAmount, setTotalAmount] =
        useState("");

    const [editingDebt, setEditingDebt] =
        useState<Debt | null>(null);

    const [paymentDebt, setPaymentDebt] =
        useState<Debt | null>(null);

    const [paymentAmount, setPaymentAmount] =
        useState("");
    const [paymentAccountId, setPaymentAccountId] =
        useState("");
    const [paymentDate, setPaymentDate] =
        useState("");
    const [paymentNote, setPaymentNote] =
        useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const summary = useMemo(() => {
        return debts.reduce(
            (result, debt) => ({
                total:
                    result.total + Number(debt.totalAmount),
                paid:
                    result.paid + Number(debt.paid),
                remaining:
                    result.remaining + Number(debt.remaining),
            }),
            {
                total: 0,
                paid: 0,
                remaining: 0,
            },
        );
    }, [debts]);

    function resetForm() {
        setTitle("");
        setTotalAmount("");
        setEditingDebt(null);
        setError("");
    }

    function startEditing(debt: Debt) {
        setEditingDebt(debt);
        setTitle(debt.title);
        setTotalAmount(debt.totalAmount);
        setError("");
    }

    async function handleDebtSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        setLoading(true);
        setError("");

        const isEditing = Boolean(editingDebt);

        try {
            const response = await fetch(
                isEditing && editingDebt
                    ? `/api/debts/${editingDebt.id}`
                    : "/api/debts",
                {
                    method: isEditing ? "PATCH" : "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        title,
                        totalAmount,
                    }),
                },
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error ??
                    "Não foi possível salvar a dívida",
                );
            }

            if (isEditing && editingDebt) {
                setDebts((current) =>
                    current.map((debt) =>
                        debt.id === editingDebt.id
                            ? {
                                ...debt,
                                title: data.title,
                                totalAmount:
                                    data.totalAmount.toString(),
                            }
                            : debt,
                    ),
                );
            } else {
                const total =
                    data.totalAmount.toString();

                const newDebt: Debt = {
                    id: data.id,
                    title: data.title,
                    totalAmount: total,
                    paid: "0",
                    remaining: total,
                    status: data.status,
                    lastPaymentAt: null,
                    payments: [],
                };

                setDebts((current) => [
                    newDebt,
                    ...current,
                ]);
            }

            resetForm();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Não foi possível salvar a dívida",
            );
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(debt: Debt) {
        const confirmed = window.confirm(
            `Deseja excluir a dívida "${debt.title}"?`,
        );

        if (!confirmed) {
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await fetch(
                `/api/debts/${debt.id}`,
                {
                    method: "DELETE",
                },
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error ??
                    "Não foi possível excluir a dívida",
                );
            }

            setDebts((current) =>
                current.filter((item) => item.id !== debt.id),
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Não foi possível excluir a dívida",
            );
        } finally {
            setLoading(false);
        }
    }

    function openPayment(debt: Debt) {
        setPaymentDebt(debt);
        setPaymentAmount("");
        setPaymentAccountId("");
        setPaymentDate(
            new Date().toISOString().slice(0, 10),
        );
        setPaymentNote("");
        setError("");
    }

    async function handlePayment(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        if (!paymentDebt) {
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await fetch(
                `/api/debts/${paymentDebt.id}/payments`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        amount: paymentAmount,
                        accountId: paymentAccountId,
                        date: paymentDate,
                        note: paymentNote,
                    }),
                },
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error ??
                    "Não foi possível registrar o pagamento",
                );
            }

            const account = accounts.find(
                (item) => item.id === paymentAccountId,
            );

            const payment: Payment = {
                id: data.payment.id,
                amount: data.payment.amount.toString(),
                date: paymentDate,
                note: data.payment.note,
                accountName: account
                    ? `${account.bank.name} — ${account.name}`
                    : "",
            };

            const paymentValue = Number(payment.amount);
            const currentPaid = Number(paymentDebt.paid);
            const currentRemaining = Number(
                paymentDebt.remaining,
            );

            const newPaid = currentPaid + paymentValue;
            const newRemaining =
                currentRemaining - paymentValue;

            setDebts((current) =>
                current.map((debt) =>
                    debt.id === paymentDebt.id
                        ? {
                            ...debt,
                            paid: newPaid.toFixed(2),
                            remaining: Math.max(
                                0,
                                newRemaining,
                            ).toFixed(2),
                            status: data.debt.status,
                            lastPaymentAt: paymentDate,
                            payments: [
                                payment,
                                ...debt.payments,
                            ],
                        }
                        : debt,
                ),
            );

            setPaymentDebt(null);
            setPaymentAmount("");
            setPaymentAccountId("");
            setPaymentDate("");
            setPaymentNote("");
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Não foi possível registrar o pagamento",
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-6">
            {error && !paymentDebt && (
                <div className="rounded-xl bg-negative/10 px-4 py-3 text-sm text-negative">
                    {error}
                </div>
            )}

            <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-line bg-surface p-5">
                    <p className="text-sm text-muted">
                        Total das dívidas
                    </p>

                    <p className="mt-2 text-xl font-medium text-ink">
                        {formatBRL(
                            summary.total.toFixed(2),
                        )}
                    </p>
                </div>

                <div className="rounded-2xl border border-line bg-surface p-5">
                    <p className="text-sm text-muted">
                        Total pago
                    </p>

                    <p className="mt-2 text-xl font-medium text-positive">
                        {formatBRL(
                            summary.paid.toFixed(2),
                        )}
                    </p>
                </div>

                <div className="rounded-2xl border border-line bg-surface p-5">
                    <p className="text-sm text-muted">
                        Total restante
                    </p>

                    <p className="mt-2 text-xl font-medium text-negative">
                        {formatBRL(
                            summary.remaining.toFixed(2),
                        )}
                    </p>
                </div>
            </section>

            <section className="rounded-2xl border border-line bg-surface p-5">
                <div className="mb-5">
                    <h2 className="font-display text-lg text-ink">
                        {editingDebt
                            ? "Editar dívida"
                            : "Nova dívida"}
                    </h2>

                    <p className="mt-1 text-sm text-muted">
                        O valor total não poderá ser alterado depois que houver
                        pagamentos.
                    </p>
                </div>

                <form
                    onSubmit={handleDebtSubmit}
                    className="grid gap-4 md:grid-cols-2"
                >
                    <div>
                        <label
                            htmlFor="debt-title"
                            className="mb-1 block text-sm font-medium text-ink"
                        >
                            Título
                        </label>

                        <input
                            id="debt-title"
                            value={title}
                            onChange={(event) =>
                                setTitle(event.target.value)
                            }
                            placeholder="Ex.: Empréstimo pessoal"
                            required
                            maxLength={150}
                            className="w-full rounded-xl border border-line bg-background px-3 py-2 text-sm outline-none focus:border-ink text-ink dark:bg-surface dark:text-ink"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="debt-total"
                            className="mb-1 block text-sm font-medium text-ink"
                        >
                            Valor total
                        </label>

                        <input
                            id="debt-total"
                            value={totalAmount}
                            onChange={(event) =>
                                setTotalAmount(event.target.value)
                            }
                            placeholder="0,00"
                            inputMode="decimal"
                            required
                            disabled={
                                Boolean(editingDebt) &&
                                editingDebt.payments.length > 0
                            }
                            className="w-full rounded-xl border border-line bg-background px-3 py-2 text-sm outline-none focus:border-ink disabled:opacity-50 text-ink dark:bg-surface dark:text-ink"
                        />

                        {editingDebt &&
                            editingDebt.payments.length > 0 && (
                                <p className="mt-1 text-xs text-muted">
                                    O valor está bloqueado porque esta dívida possui
                                    pagamentos.
                                </p>
                            )}
                    </div>

                    {error && !paymentDebt && (
                        <p className="rounded-xl bg-negative/10 px-3 py-2 text-sm text-negative md:col-span-2">
                            {error}
                        </p>
                    )}

                    <div className="flex gap-2 md:col-span-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-50 bg-primary text-primary-foreground"
                        >
                            {loading
                                ? "Salvando..."
                                : editingDebt
                                    ? "Salvar alterações"
                                    : "Cadastrar dívida"}
                        </button>

                        {editingDebt && (
                            <button
                                type="button"
                                onClick={resetForm}
                                className="rounded-xl border border-line px-4 py-2 text-sm text-ink"
                            >
                                Cancelar
                            </button>
                        )}
                    </div>
                </form>
            </section>

            <section className="rounded-2xl border border-line bg-surface p-5">
                <div className="mb-5">
                    <h2 className="font-display text-lg text-ink">
                        Dívidas cadastradas
                    </h2>

                    <p className="mt-1 text-sm text-muted">
                        {debts.length} dívida(s)
                    </p>
                </div>

                {debts.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-line p-6 text-center">
                        <p className="text-sm text-muted">
                            Nenhuma dívida cadastrada.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {debts.map((debt) => (
                            <article
                                key={debt.id}
                                className="rounded-xl border border-line p-4"
                            >
                                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="truncate font-medium text-ink">
                                                {debt.title}
                                            </h3>

                                            <span
                                                className={`rounded-full px-2 py-1 text-xs ${debt.status === "QUITADA"
                                                        ? "bg-positive/10 text-positive"
                                                        : "bg-yellow-500/10 text-yellow-700"
                                                    }`}
                                            >
                                                {debt.status === "QUITADA"
                                                    ? "Quitada"
                                                    : "Aberta"}
                                            </span>
                                        </div>

                                        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3 sm:gap-4">
                                            <div>
                                                <p className="text-xs text-muted">
                                                    Valor total
                                                </p>

                                                <p className="font-medium text-ink">
                                                    {formatBRL(
                                                        debt.totalAmount,
                                                    )}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-xs text-muted">
                                                    Total pago
                                                </p>

                                                <p className="font-medium text-positive">
                                                    {formatBRL(debt.paid)}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-xs text-muted">
                                                    Restante
                                                </p>

                                                <p className="font-medium text-negative">
                                                    {formatBRL(
                                                        debt.remaining,
                                                    )}
                                                </p>
                                            </div>
                                        </div>

                                        {debt.lastPaymentAt && (
                                            <p className="mt-3 text-xs text-muted">
                                                Último pagamento em{" "}
                                                {formatDate(
                                                    debt.lastPaymentAt,
                                                )}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                startEditing(debt)
                                            }
                                            className="rounded-xl border border-line px-3 py-2 text-sm text-ink"
                                        >
                                            Editar
                                        </button>

                                        {debt.status === "ABERTA" && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    openPayment(debt)
                                                }
                                                className="rounded-xl px-3 py-2 text-sm font-medium bg-primary text-primary-foreground"
                                            >
                                                Registrar pagamento
                                            </button>
                                        )}

                                        {debt.payments.length === 0 && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleDelete(debt)
                                                }
                                                disabled={loading}
                                                className="rounded-xl border border-negative/30 px-3 py-2 text-sm text-negative disabled:opacity-50"
                                            >
                                                Excluir
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {debt.payments.length > 0 && (
                                    <details className="mt-4">
                                        <summary className="cursor-pointer text-sm text-muted">
                                            Ver pagamentos ({debt.payments.length})
                                        </summary>

                                        <div className="mt-3 space-y-2">
                                            {debt.payments.map((payment) => (
                                                <div
                                                    key={payment.id}
                                                    className="flex flex-col justify-between gap-1 rounded-lg bg-background px-3 py-2 text-sm sm:flex-row sm:items-center"
                                                >
                                                    <div>
                                                        <p className="text-ink">
                                                            {formatDate(
                                                                payment.date,
                                                            )}
                                                        </p>

                                                        <p className="text-xs text-muted">
                                                            {payment.accountName}
                                                            {payment.note
                                                                ? ` · ${payment.note}`
                                                                : ""}
                                                        </p>
                                                    </div>

                                                    <span className="font-medium text-negative">
                                                        {formatBRL(
                                                            payment.amount,
                                                        )}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </details>
                                )}
                            </article>
                        ))}
                    </div>
                )}
            </section>

            {paymentDebt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-surface p-5">
                        <h2 className="font-display text-lg text-ink">
                            Registrar pagamento
                        </h2>

                        <p className="mt-1 text-sm text-muted">
                            {paymentDebt.title}
                        </p>

                        <p className="mt-1 text-sm text-negative">
                            Restante:{" "}
                            {formatBRL(paymentDebt.remaining)}
                        </p>

                        <form
                            onSubmit={handlePayment}
                            className="mt-5 space-y-4"
                        >
                            <div>
                                <label
                                    htmlFor="payment-amount"
                                    className="mb-1 block text-sm font-medium text-ink"
                                >
                                    Valor pago
                                </label>

                                <input
                                    id="payment-amount"
                                    value={paymentAmount}
                                    onChange={(event) =>
                                        setPaymentAmount(
                                            event.target.value,
                                        )
                                    }
                                    placeholder="0,00"
                                    inputMode="decimal"
                                    required
                                    className="w-full rounded-xl border border-line bg-background px-3 py-2 text-sm outline-none focus:border-ink text-ink dark:bg-surface dark:text-ink"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="payment-account"
                                    className="mb-1 block text-sm font-medium text-ink"
                                >
                                    Conta utilizada
                                </label>

                                <select
                                    id="payment-account"
                                    value={paymentAccountId}
                                    onChange={(event) =>
                                        setPaymentAccountId(
                                            event.target.value,
                                        )
                                    }
                                    required
                                    className="w-full rounded-xl border border-line bg-background px-3 py-2 text-sm outline-none focus:border-ink text-ink dark:bg-surface dark:text-ink"
                                >
                                    <option value="">
                                        Selecione
                                    </option>

                                    {accounts.map((account) => (
                                        <option
                                            key={account.id}
                                            value={account.id}
                                        >
                                            {account.bank.name} —{" "}
                                            {account.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label
                                    htmlFor="payment-date"
                                    className="mb-1 block text-sm font-medium text-ink"
                                >
                                    Data do pagamento
                                </label>

                                <input
                                    id="payment-date"
                                    type="date"
                                    value={paymentDate}
                                    onChange={(event) =>
                                        setPaymentDate(
                                            event.target.value,
                                        )
                                    }
                                    required
                                    className="w-full rounded-xl border border-line bg-background px-3 py-2 text-sm outline-none focus:border-ink text-ink dark:bg-surface dark:text-ink dark:[color-scheme:dark]"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="payment-note"
                                    className="mb-1 block text-sm font-medium text-ink"
                                >
                                    Observação
                                </label>

                                <textarea
                                    id="payment-note"
                                    value={paymentNote}
                                    onChange={(event) =>
                                        setPaymentNote(
                                            event.target.value,
                                        )
                                    }
                                    maxLength={300}
                                    placeholder="Opcional"
                                    className="min-h-20 w-full rounded-xl border border-line bg-background px-3 py-2 text-sm outline-none focus:border-ink text-ink dark:bg-surface dark:text-ink"
                                />
                            </div>

                            {error && (
                                <p className="rounded-xl bg-negative/10 px-3 py-2 text-sm text-negative">
                                    {error}
                                </p>
                            )}

                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setPaymentDebt(null)
                                    }
                                    className="rounded-xl border border-line px-4 py-2 text-sm text-ink"
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="rounded-xl px-4 py-2 text-sm font-medium bg-primary text-primary-foreground disabled:opacity-50"
                                >
                                    {loading
                                        ? "Registrando..."
                                        : "Confirmar pagamento"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}