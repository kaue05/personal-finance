"use client";

import { FormEvent, useMemo, useState } from "react";

type Category = {
  id: string;
  name: string;
};

type Account = {
  id: string;
  name: string;
  bank: {
    name: string;
  };
};

type ExpenseStatus = "PENDENTE" | "PAGO" | "CANCELADO";

type Expense = {
  id: string;
  categoryId: string;
  categoryName: string;
  title: string;
  amount: string;
  dueDate: string;
  status: ExpenseStatus;
  paidAt: string | null;
  paidAccountName: string | null;

  installmentGroupId: string | null;
  installmentNumber: number | null;
  installmentTotal: number | null;
};

type ExpenseManagerProps = {
  initialCategories: Category[];
  initialAccounts: Account[];
  initialExpenses: Expense[];
};

const MONTHS = [
  { value: "01", label: "Janeiro" },
  { value: "02", label: "Fevereiro" },
  { value: "03", label: "Março" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Maio" },
  { value: "06", label: "Junho" },
  { value: "07", label: "Julho" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Setembro" },
  { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" },
  { value: "12", label: "Dezembro" },
];

function generateYears() {
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - 2;
  const endYear = currentYear + 5;

  const years = [];

  for (let year = startYear; year <= endYear; year++) {
    years.push({
      value: String(year),
      label: String(year),
    });
  }

  return years;
}

const YEARS = generateYears();

const statusLabels: Record<ExpenseStatus, string> = {
  PENDENTE: "Pendente",
  PAGO: "Pago",
  CANCELADO: "Cancelado",
};

const statusClasses: Record<ExpenseStatus, string> = {
  PENDENTE: "bg-yellow-500/10 text-yellow-700",
  PAGO: "bg-positive/10 text-positive",
  CANCELADO: "bg-muted/10 text-muted",
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

export function ExpenseManager({
  initialCategories,
  initialAccounts,
  initialExpenses,
}: ExpenseManagerProps) {
  const [categories] = useState(initialCategories);
  const [accounts] = useState(initialAccounts);
  const [expenses, setExpenses] = useState(initialExpenses);

  const [categoryId, setCategoryId] = useState("");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");

  const [selectedStatus, setSelectedStatus] =
    useState<ExpenseStatus | "TODOS">("TODOS");

  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);

  const [payingExpense, setPayingExpense] =
    useState<Expense | null>(null);
  const [paymentAccountId, setPaymentAccountId] = useState("");
  const [paymentDate, setPaymentDate] = useState("");

  const [installmentTotal, setInstallmentTotal] =
    useState("1");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const matchesStatus =
        selectedStatus === "TODOS" ||
        expense.status === selectedStatus;

      let matchesMonth = true;

      if (selectedMonth && selectedYear) {
        const dateToCheck =
          expense.status === "PAGO" && expense.paidAt
            ? expense.paidAt
            : expense.dueDate;

        const [year, month] = dateToCheck.split("-");

        matchesMonth =
          month === selectedMonth && year === selectedYear;
      }

      return matchesStatus && matchesMonth;
    });
  }, [expenses, selectedStatus, selectedMonth, selectedYear]);

  function resetForm() {
    setCategoryId("");
    setTitle("");
    setAmount("");
    setDueDate("");
    setInstallmentTotal("1");
    setEditingId(null);
    setError("");
  }

  function startEditing(expense: Expense) {
    if (expense.status !== "PENDENTE") {
      return;
    }

    if (expense.installmentTotal) {
      setError(
        "Parcelas não podem ser editadas individualmente nesta versão.",
      );
      return;
    }

    setEditingId(expense.id);
    setCategoryId(expense.categoryId);
    setTitle(expense.title);
    setAmount(expense.amount);
    setDueDate(expense.dueDate);
    setInstallmentTotal("1");
    setError("");
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");

    const isEditing = Boolean(editingId);

    try {
      const response = await fetch(
        isEditing
          ? `/api/expenses/${editingId}`
          : "/api/expenses",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            categoryId,
            title,
            amount,
            dueDate,
            installmentTotal: Number(installmentTotal),
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ?? "Não foi possível salvar o gasto",
        );
      }

      const createdExpenses = data.expenses ?? [data];

      const normalizedExpenses: Expense[] =
        createdExpenses.map((item: any) => ({
          id: item.id,
          categoryId: item.categoryId,
          categoryName:
            categories.find(
              (category) => category.id === item.categoryId,
            )?.name ?? item.category.name,
          title: item.title,
          amount: item.amount.toString(),
          dueDate: item.dueDate.slice(0, 10),
          status: item.status,
          paidAt: null,
          paidAccountName: null,
          installmentGroupId: item.installmentGroupId,
          installmentNumber: item.installmentNumber,
          installmentTotal: item.installmentTotal,
        }));

      const firstExpense = normalizedExpenses[0];

      if (!firstExpense) {
        throw new Error(
          "A API não retornou nenhum gasto criado ou atualizado",
        );
      }

      if (isEditing) {
        setExpenses((current) =>
          current.map((expense) =>
            expense.id === firstExpense.id
              ? {
                ...expense,
                ...firstExpense,
              }
              : expense,
          ),
        );
      } else {
        setExpenses((current) => [
          ...normalizedExpenses,
          ...current,
        ]);
      }

      resetForm();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível salvar o gasto",
      );
    } finally {
      setLoading(false);
    }
  }

  function openPayment(expense: Expense) {
    setPayingExpense(expense);
    setPaymentAccountId("");
    setPaymentDate(
      new Date().toISOString().slice(0, 10),
    );
    setError("");
  }

  async function handlePayment(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!payingExpense) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/expenses/${payingExpense.id}/pay`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            accountId: paymentAccountId,
            paidAt: paymentDate,
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

      const paidAccount = accounts.find(
        (account) => account.id === paymentAccountId,
      );

      setExpenses((current) =>
        current.map((expense) =>
          expense.id === payingExpense.id
            ? {
              ...expense,
              status: "PAGO",
              paidAt: paymentDate,
              paidAccountName: paidAccount
                ? `${paidAccount.bank.name} — ${paidAccount.name}`
                : null,
            }
            : expense,
        ),
      );

      setPayingExpense(null);
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

  async function handleCancel(expense: Expense) {
    const confirmed = window.confirm(
      `Deseja cancelar o gasto "${expense.title}"?`,
    );

    if (!confirmed) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/expenses/${expense.id}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ?? "Não foi possível cancelar o gasto",
        );
      }

      setExpenses((current) =>
        current.map((item) =>
          item.id === expense.id
            ? {
              ...item,
              status: "CANCELADO",
            }
            : item,
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível cancelar o gasto",
      );
    } finally {
      setLoading(false);
    }
  }

  function clearMonthFilter() {
    setSelectedMonth("");
    setSelectedYear("");
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-line bg-surface p-5">
        <div className="mb-5">
          <h2 className="font-display text-lg text-ink">
            {editingId ? "Editar gasto" : "Novo gasto"}
          </h2>

          <p className="mt-1 text-sm text-muted">
            Criar o gasto não altera o saldo da conta.
          </p>
        </div>

        {categories.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line p-4 text-sm text-muted">
            Cadastre uma categoria de gasto antes de continuar.
          </p>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="grid gap-4 md:grid-cols-2"
          >
            <div>
              <label
                htmlFor="expense-title"
                className="mb-1 block text-sm font-medium text-ink"
              >
                Título
              </label>

              <input
                id="expense-title"
                value={title}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
                placeholder="Ex.: Compra do mercado"
                required
                maxLength={150}
                  className="w-full rounded-xl border border-line bg-background px-3 py-2 text-sm outline-none focus:border-ink text-ink dark:bg-surface dark:text-ink"
              />
            </div>

            <div>
              <label
                htmlFor="expense-category"
                className="mb-1 block text-sm font-medium text-ink"
              >
                Categoria
              </label>

              <select
                id="expense-category"
                value={categoryId}
                onChange={(event) =>
                  setCategoryId(event.target.value)
                }
                required
                  className="w-full rounded-xl border border-line bg-background px-3 py-2 text-sm outline-none focus:border-ink text-ink dark:bg-surface dark:text-ink"
              >
                <option value="">Selecione</option>

                {categories.map((category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="expense-amount"
                className="mb-1 block text-sm font-medium text-ink"
              >
                Valor
              </label>

              <input
                id="expense-amount"
                value={amount}
                onChange={(event) =>
                  setAmount(event.target.value)
                }
                placeholder="0,00"
                inputMode="decimal"
                required
                  className="w-full rounded-xl border border-line bg-background px-3 py-2 text-sm outline-none focus:border-ink text-ink dark:bg-surface dark:text-ink"
              />
            </div>

            <div>
              <label
                htmlFor="expense-installments"
                className="mb-1 block text-sm font-medium text-ink"
              >
                Quantidade de parcelas
              </label>

              <input
                id="expense-installments"
                type="number"
                min="1"
                max="120"
                value={installmentTotal}
                onChange={(event) =>
                  setInstallmentTotal(event.target.value)
                }
                disabled={Boolean(editingId)}
                required
                  className="w-full rounded-xl border border-line bg-background px-3 py-2 text-sm outline-none focus:border-ink disabled:opacity-50 text-ink dark:bg-surface dark:text-ink"
              />

              <p className="mt-1 text-xs text-muted">
                Use 1 para um gasto à vista.
              </p>
            </div>

            <div>
              <label
                htmlFor="expense-due-date"
                className="mb-1 block text-sm font-medium text-ink"
              >
                Vencimento
              </label>

              <input
                id="expense-due-date"
                type="date"
                value={dueDate}
                onChange={(event) =>
                  setDueDate(event.target.value)
                }
                required
                  className="w-full rounded-xl border border-line bg-background px-3 py-2 text-sm outline-none focus:border-ink text-ink dark:bg-surface dark:text-ink dark:[color-scheme:dark]"
              />
            </div>

            {error && (
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
                  : editingId
                    ? "Salvar alterações"
                    : "Cadastrar gasto"}
              </button>

              {editingId && (
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
        )}
      </section>

      <section className="rounded-2xl border border-line bg-surface p-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg text-ink">
              Gastos registrados
            </h2>

            <p className="mt-1 text-sm text-muted">
              {filteredExpenses.length} registro(s)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="rounded-xl border border-line bg-background px-3 py-2 text-sm text-ink dark:bg-surface dark:text-ink"
            >
              <option value="">Todos os meses</option>

              {MONTHS.map((month) => (
                <option
                  key={month.value}
                  value={month.value}
                >
                  {month.label}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="rounded-xl border border-line bg-background px-3 py-2 text-sm text-ink dark:bg-surface dark:text-ink"
            >
              <option value="">Todos os anos</option>

              {YEARS.map((year) => (
                <option
                  key={year.value}
                  value={year.value}
                >
                  {year.label}
                </option>
              ))}
            </select>

            {(selectedMonth || selectedYear) && (
              <button
                type="button"
                onClick={clearMonthFilter}
                className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                Limpar
              </button>
            )}

            <select
              value={selectedStatus}
              onChange={(event) =>
                setSelectedStatus(
                  event.target.value as ExpenseStatus | "TODOS",
                )
              }
              className="rounded-xl border border-line bg-background px-3 py-2 text-sm text-ink dark:bg-surface dark:text-ink"
            >
              <option value="TODOS">Todos</option>
              <option value="PENDENTE">Pendentes</option>
              <option value="PAGO">Pagos</option>
              <option value="CANCELADO">Cancelados</option>
            </select>
          </div>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line p-6 text-center">
            <p className="text-sm text-muted">
              Nenhum gasto encontrado.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredExpenses.map((expense) => (
              <div
                key={expense.id}
                className="rounded-xl border border-line p-4"
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-ink">
                        {expense.title}
                      </p>

                      {expense.installmentNumber &&
                        expense.installmentTotal && (
                          <span className="rounded-full bg-ink/10 px-2 py-1 text-xs text-ink">
                            Parcela {expense.installmentNumber}/
                            {expense.installmentTotal}
                          </span>
                        )}

                      <span
                        className={`rounded-full px-2 py-1 text-xs ${statusClasses[expense.status]}`}
                      >
                        {statusLabels[expense.status]}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-muted">
                      {expense.categoryName} · vencimento{" "}
                      {formatDate(expense.dueDate)}
                    </p>

                    {expense.paidAccountName && (
                      <p className="text-xs text-muted">
                        Pago em {formatDate(expense.paidAt!)} pela conta{" "}
                        {expense.paidAccountName}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <p className="tabular text-lg font-medium text-negative">
                      {formatBRL(expense.amount)}
                    </p>

                    {expense.status === "PENDENTE" && (
                      <>
                        {!expense.installmentTotal && (
                          <button
                            type="button"
                            onClick={() => startEditing(expense)}
                            className="rounded-lg border border-line px-3 py-2 text-xs text-ink"
                          >
                            Editar
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => openPayment(expense)}
                          className="rounded-lg bg-primary text-primary-foreground px-3 py-2 text-xs font-medium"
                        >
                          Marcar como pago
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCancel(expense)}
                          disabled={loading}
                          className="rounded-lg border border-negative/30 px-3 py-2 text-xs text-negative disabled:opacity-50"
                        >
                          Cancelar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {payingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-surface p-5">
            <h2 className="font-display text-lg text-ink">
              Registrar pagamento
            </h2>

            <p className="mt-1 text-sm text-muted">
              {payingExpense.title} —{" "}
              {formatBRL(payingExpense.amount)}
            </p>

            <form
              onSubmit={handlePayment}
              className="mt-5 space-y-4"
            >
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
                    setPaymentAccountId(event.target.value)
                  }
                  required
                  className="w-full rounded-xl border border-line bg-background px-3 py-2 text-sm text-ink dark:bg-surface dark:text-ink"
                >
                  <option value="">Selecione</option>

                  {accounts.map((account) => (
                    <option
                      key={account.id}
                      value={account.id}
                    >
                      {account.bank.name} — {account.name}
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
                    setPaymentDate(event.target.value)
                  }
                  required
                  className="w-full rounded-xl border border-line bg-background px-3 py-2 text-sm text-ink dark:bg-surface dark:text-ink dark:[color-scheme:dark]"
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
                  onClick={() => setPayingExpense(null)}
                  className="rounded-xl border border-line px-4 py-2 text-sm text-ink"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
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