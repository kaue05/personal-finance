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

type ReceivableStatus =
  | "PENDENTE"
  | "RECEBIDO"
  | "CANCELADO";

type Receivable = {
  id: string;
  categoryId: string;
  categoryName: string;
  title: string;
  amount: string;
  expectedDate: string;
  referenceMonth: string;
  status: ReceivableStatus;
  receivedAt: string | null;
  receivedAccountName: string | null;
};

type ReceivableManagerProps = {
  initialCategories: Category[];
  initialAccounts: Account[];
  initialReceivables: Receivable[];
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

const statusLabels: Record<
  ReceivableStatus,
  string
> = {
  PENDENTE: "Pendente",
  RECEBIDO: "Recebido",
  CANCELADO: "Cancelado",
};

const statusClasses: Record<
  ReceivableStatus,
  string
> = {
  PENDENTE: "bg-yellow-500/10 text-yellow-700",
  RECEBIDO: "bg-positive/10 text-positive",
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

export function ReceivableManager({
  initialCategories,
  initialAccounts,
  initialReceivables,
}: ReceivableManagerProps) {
  const [categories] = useState(initialCategories);
  const [accounts] = useState(initialAccounts);
  const [receivables, setReceivables] = useState(
    initialReceivables,
  );

  const [categoryId, setCategoryId] = useState("");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [expectedDate, setExpectedDate] = useState("");

  const [selectedStatus, setSelectedStatus] =
    useState<ReceivableStatus | "TODOS">("TODOS");

  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  const [editingId, setEditingId] = useState<string | null>(
    null,
  );

  const [receivingItem, setReceivingItem] =
    useState<Receivable | null>(null);
  const [accountId, setAccountId] = useState("");
  const [receivedAt, setReceivedAt] = useState("");

  const [referenceMonth, setReferenceMonth] =
    useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const filteredReceivables = useMemo(() => {
    return receivables.filter((receivable) => {
      const matchesStatus =
        selectedStatus === "TODOS" ||
        receivable.status === selectedStatus;

      let matchesMonth = true;

      if (selectedMonth && selectedYear) {
        const dateToCheck =
          receivable.status === "RECEBIDO" &&
            receivable.receivedAt
            ? receivable.receivedAt
            : receivable.expectedDate;

        const [year, month] = dateToCheck.split("-");

        matchesMonth =
          month === selectedMonth && year === selectedYear;
      }

      return matchesStatus && matchesMonth;
    });
  }, [
    receivables,
    selectedStatus,
    selectedMonth,
    selectedYear,
  ]);

  function resetForm() {
    setCategoryId("");
    setTitle("");
    setAmount("");
    setExpectedDate("");
    setReferenceMonth("");
    setEditingId(null);
    setError("");
  }

  function startEditing(receivable: Receivable) {
    if (receivable.status !== "PENDENTE") {
      return;
    }

    setEditingId(receivable.id);
    setCategoryId(receivable.categoryId);
    setTitle(receivable.title);
    setAmount(receivable.amount);
    setExpectedDate(receivable.expectedDate);
    setReferenceMonth(receivable.referenceMonth);
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
          ? `/api/receivables/${editingId}`
          : "/api/receivables",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            categoryId,
            title,
            amount,
            expectedDate,
            referenceMonth,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ??
          "Não foi possível salvar o recebimento",
        );
      }

      const category = categories.find(
        (item) => item.id === data.categoryId,
      );

      const updatedReceivable: Receivable = {
        id: data.id,
        categoryId: data.categoryId,
        categoryName:
          category?.name ?? data.category.name,
        title: data.title,
        amount: data.amount.toString(),
        expectedDate: data.expectedDate.slice(0, 10),
        referenceMonth: data.referenceMonth
          ? data.referenceMonth.slice(0, 7)
          : referenceMonth,
        status: data.status,
        receivedAt: null,
        receivedAccountName: null,
      };

      if (isEditing) {
        setReceivables((current) =>
          current.map((item) =>
            item.id === updatedReceivable.id
              ? {
                ...item,
                ...updatedReceivable,
              }
              : item,
          ),
        );
      } else {
        setReceivables((current) => [
          updatedReceivable,
          ...current,
        ]);
      }

      resetForm();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível salvar o recebimento",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(receivable: Receivable) {
    const confirmed = window.confirm(
      `Deseja cancelar o recebimento "${receivable.title}"?`,
    );

    if (!confirmed) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/receivables/${receivable.id}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ??
          "Não foi possível cancelar o recebimento",
        );
      }

      setReceivables((current) =>
        current.map((item) =>
          item.id === receivable.id
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
          : "Não foi possível cancelar o recebimento",
      );
    } finally {
      setLoading(false);
    }
  }

  function openReceive(receivable: Receivable) {
    setReceivingItem(receivable);
    setAccountId("");
    setReceivedAt(
      new Date().toISOString().slice(0, 10),
    );
    setError("");
  }

  async function handleReceive(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!receivingItem) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/receivables/${receivingItem.id}/receive`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            accountId,
            receivedAt,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ??
          "Não foi possível registrar o recebimento",
        );
      }

      const account = accounts.find(
        (item) => item.id === accountId,
      );

      setReceivables((current) =>
        current.map((item) =>
          item.id === receivingItem.id
            ? {
              ...item,
              status: "RECEBIDO",
              receivedAt,
              receivedAccountName: account
                ? `${account.bank.name} — ${account.name}`
                : null,
            }
            : item,
        ),
      );

      setReceivingItem(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível registrar o recebimento",
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
            {editingId
              ? "Editar recebimento"
              : "Novo recebimento"}
          </h2>

          <p className="mt-1 text-sm text-muted">
            Criar o recebimento não altera o saldo da conta.
          </p>
        </div>

        {categories.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line p-4 text-sm text-muted">
            Cadastre uma categoria de recebimento antes de continuar.
          </p>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="grid gap-4 md:grid-cols-2"
          >
            <div>
              <label
                htmlFor="receivable-title"
                className="mb-1 block text-sm font-medium text-ink"
              >
                Título
              </label>

              <input
                id="receivable-title"
                value={title}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
                placeholder="Ex.: Pagamento do salário"
                required
                maxLength={150}
                className="w-full rounded-xl border border-line bg-background px-3 py-2 text-sm outline-none focus:border-ink"
              />
            </div>

            <div>
              <label
                htmlFor="receivable-category"
                className="mb-1 block text-sm font-medium text-ink"
              >
                Categoria
              </label>

              <select
                id="receivable-category"
                value={categoryId}
                onChange={(event) =>
                  setCategoryId(event.target.value)
                }
                required
                className="w-full rounded-xl border border-line bg-background px-3 py-2 text-sm outline-none focus:border-ink"
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
                htmlFor="receivable-amount"
                className="mb-1 block text-sm font-medium text-ink"
              >
                Valor
              </label>

              <input
                id="receivable-amount"
                value={amount}
                onChange={(event) =>
                  setAmount(event.target.value)
                }
                placeholder="0,00"
                inputMode="decimal"
                required
                className="w-full rounded-xl border border-line bg-background px-3 py-2 text-sm outline-none focus:border-ink"
              />
            </div>

            <div>
              <label
                htmlFor="receivable-date"
                className="mb-1 block text-sm font-medium text-ink"
              >
                Data prevista
              </label>

              <input
                id="receivable-date"
                type="date"
                value={expectedDate}
                onChange={(event) =>
                  setExpectedDate(event.target.value)
                }
                required
                className="w-full rounded-xl border border-line bg-background px-3 py-2 text-sm outline-none focus:border-ink"
              />
            </div>

            <div>
              <label
                htmlFor="receivable-reference-month"
                className="mb-1 block text-sm font-medium text-ink"
              >
                Referente ao mês
              </label>

              <input
                id="receivable-reference-month"
                type="month"
                value={referenceMonth}
                onChange={(event) =>
                  setReferenceMonth(event.target.value)
                }
                required
                className="w-full rounded-xl border border-line bg-background px-3 py-2 text-sm outline-none focus:border-ink"
              />

              <p className="mt-1 text-xs text-muted">
                Ex.: um adiantamento recebido em julho pode ser referente a
                agosto.
              </p>
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
                className="rounded-xl bg-ink px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {loading
                  ? "Salvando..."
                  : editingId
                    ? "Salvar alterações"
                    : "Cadastrar recebimento"}
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
              Recebimentos registrados
            </h2>

            <p className="mt-1 text-sm text-muted">
              {filteredReceivables.length} registro(s)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedMonth}
              onChange={(e) =>
                setSelectedMonth(e.target.value)
              }
              className="rounded-xl border border-line bg-background px-3 py-2 text-sm"
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
              onChange={(e) =>
                setSelectedYear(e.target.value)
              }
              className="rounded-xl border border-line bg-background px-3 py-2 text-sm"
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
                  event.target.value as
                  | ReceivableStatus
                  | "TODOS",
                )
              }
              className="rounded-xl border border-line bg-background px-3 py-2 text-sm"
            >
              <option value="TODOS">Todos</option>
              <option value="PENDENTE">Pendentes</option>
              <option value="RECEBIDO">Recebidos</option>
              <option value="CANCELADO">Cancelados</option>
            </select>
          </div>
        </div>

        {filteredReceivables.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line p-6 text-center">
            <p className="text-sm text-muted">
              Nenhum recebimento encontrado.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReceivables.map((receivable) => (
              <div
                key={receivable.id}
                className="rounded-xl border border-line p-4"
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-ink">
                        {receivable.title}
                      </p>

                      <span
                        className={`rounded-full px-2 py-1 text-xs ${statusClasses[receivable.status]}`}
                      >
                        {statusLabels[receivable.status]}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-muted">
                      {receivable.categoryName} · previsto para{" "}
                      {formatDate(receivable.expectedDate)}
                    </p>

                    {receivable.referenceMonth && (
                      <p className="text-xs text-muted">
                        Referente a{" "}
                        {new Intl.DateTimeFormat("pt-BR", {
                          month: "long",
                          year: "numeric",
                          timeZone: "UTC",
                        }).format(
                          new Date(
                            `${receivable.referenceMonth}-01T12:00:00Z`,
                          ),
                        )}
                      </p>
                    )}

                    {receivable.receivedAccountName && (
                      <p className="text-xs text-muted">
                        Recebido em{" "}
                        {formatDate(receivable.receivedAt!)}{" "}
                        pela conta {receivable.receivedAccountName}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <p className="tabular text-lg font-medium text-positive">
                      {formatBRL(receivable.amount)}
                    </p>

                    {receivable.status === "PENDENTE" && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            startEditing(receivable)
                          }
                          className="rounded-lg border border-line px-3 py-2 text-xs text-ink"
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            openReceive(receivable)
                          }
                          className="rounded-lg bg-positive px-3 py-2 text-xs font-medium text-white"
                        >
                          Marcar como recebido
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleCancel(receivable)
                          }
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

      {receivingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-surface p-5">
            <h2 className="font-display text-lg text-ink">
              Registrar recebimento
            </h2>

            <p className="mt-1 text-sm text-muted">
              {receivingItem.title} —{" "}
              {formatBRL(receivingItem.amount)}
            </p>

            <form
              onSubmit={handleReceive}
              className="mt-5 space-y-4"
            >
              <div>
                <label
                  htmlFor="received-account"
                  className="mb-1 block text-sm font-medium text-ink"
                >
                  Conta onde foi recebido
                </label>

                <select
                  id="received-account"
                  value={accountId}
                  onChange={(event) =>
                    setAccountId(event.target.value)
                  }
                  required
                  className="w-full rounded-xl border border-line bg-background px-3 py-2 text-sm"
                >
                  <option value="">Selecione</option>

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
                  htmlFor="received-date"
                  className="mb-1 block text-sm font-medium text-ink"
                >
                  Data do recebimento
                </label>

                <input
                  id="received-date"
                  type="date"
                  value={receivedAt}
                  onChange={(event) =>
                    setReceivedAt(event.target.value)
                  }
                  required
                  className="w-full rounded-xl border border-line bg-background px-3 py-2 text-sm"
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
                  onClick={() => setReceivingItem(null)}
                  className="rounded-xl border border-line px-4 py-2 text-sm text-ink"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-positive px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {loading
                    ? "Registrando..."
                    : "Confirmar recebimento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}