"use client";

import { FormEvent, useMemo, useState } from "react";

type CategoryType = "EXPENSE" | "RECEIVABLE";

type Category = {
  id: string;
  name: string;
  type: CategoryType;
  active: boolean;
  expenseCount: number;
  receivableCount: number;
};

type CategoryManagerProps = {
  initialCategories: Category[];
};

const categoryTypeLabels: Record<CategoryType, string> = {
  EXPENSE: "Gastos",
  RECEIVABLE: "Recebimentos",
};

export function CategoryManager({ initialCategories }: CategoryManagerProps) {
  const [categories, setCategories] = useState(initialCategories);

  const [type, setType] = useState<CategoryType>("EXPENSE");
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const visibleCategories = useMemo(() => {
    return categories.filter((category) => {
      const matchesType = category.type === type;
      const matchesStatus = showInactive || category.active;

      return matchesType && matchesStatus;
    });
  }, [categories, showInactive, type]);

  const activeCount = categories.filter(
    (category) => category.type === type && category.active,
  ).length;

  function resetForm() {
    setName("");
    setType("EXPENSE");
    setEditingId(null);
    setError("");
  }

  function startEditing(category: Category) {
    setEditingId(category.id);
    setName(category.name);
    setType(category.type);
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");

    const isEditing = Boolean(editingId);

    try {
      const response = await fetch(
        isEditing ? `/api/categories/${editingId}` : "/api/categories",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            type,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Não foi possível salvar a categoria");
      }

      const updatedCategory: Category = {
        id: data.id,
        name: data.name,
        type: data.type,
        active: data.active,
        expenseCount: data._count.expenses,
        receivableCount: data._count.receivables,
      };

      if (isEditing) {
        setCategories((current) =>
          current.map((category) =>
            category.id === updatedCategory.id ? updatedCategory : category,
          ),
        );
      } else {
        setCategories((current) => [...current, updatedCategory]);
      }

      resetForm();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível salvar a categoria",
      );
    } finally {
      setLoading(false);
    }
  }

  async function updateCategoryStatus(category: Category, active: boolean) {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/categories/${category.id}`, {
        method: active ? "PATCH" : "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        ...(active
          ? {
              body: JSON.stringify({
                name: category.name,
                type: category.type,
                active: true,
              }),
            }
          : {}),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ?? "Não foi possível alterar o status da categoria",
        );
      }

      setCategories((current) =>
        current.map((item) =>
          item.id === category.id
            ? {
                ...item,
                active,
              }
            : item,
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível alterar o status da categoria",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleDeactivate(category: Category) {
    const confirmed = window.confirm(
      `Deseja desativar a categoria "${category.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    await updateCategoryStatus(category, false);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <section className="rounded-2xl border border-line bg-surface p-5">
        <div className="mb-5">
          <h2 className="font-display text-lg text-ink">
            {editingId ? "Editar categoria" : "Nova categoria"}
          </h2>

          <p className="mt-1 text-sm text-muted">
            Escolha se ela será usada em gastos ou recebimentos.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="category-name"
              className="mb-1 block text-sm font-medium text-ink"
            >
              Nome
            </label>

            <input
              id="category-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ex.: Mercado"
              required
              maxLength={60}
              className="w-full rounded-xl border border-line bg-background px-3 py-2 text-sm outline-none focus:border-ink"
            />
          </div>

          <div>
            <label
              htmlFor="category-type"
              className="mb-1 block text-sm font-medium text-ink"
            >
              Tipo
            </label>

            <select
              id="category-type"
              value={type}
              onChange={(event) => setType(event.target.value as CategoryType)}
              className="w-full rounded-xl border border-line bg-background px-3 py-2 text-sm outline-none focus:border-ink"
            >
              <option value="EXPENSE">Gasto</option>
              <option value="RECEIVABLE">Recebimento</option>
            </select>
          </div>

          {error && (
            <p className="rounded-xl bg-negative/10 px-3 py-2 text-sm text-negative">
              {error}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-ink px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {loading
                ? "Salvando..."
                : editingId
                  ? "Salvar alterações"
                  : "Cadastrar categoria"}
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
      </section>

      <section className="rounded-2xl border border-line bg-surface p-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg text-ink">
              Categorias cadastradas
            </h2>

            <p className="mt-1 text-sm text-muted">
              {activeCount} categoria(s) ativa(s)
            </p>
          </div>

          <label className="flex items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(event) => setShowInactive(event.target.checked)}
            />
            Mostrar inativas
          </label>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl bg-background p-1">
          <button
            type="button"
            onClick={() => setType("EXPENSE")}
            className={`rounded-lg px-3 py-2 text-sm ${
              type === "EXPENSE"
                ? "bg-surface font-medium text-ink shadow-sm"
                : "text-muted"
            }`}
          >
            Gastos
          </button>

          <button
            type="button"
            onClick={() => setType("RECEIVABLE")}
            className={`rounded-lg px-3 py-2 text-sm ${
              type === "RECEIVABLE"
                ? "bg-surface font-medium text-ink shadow-sm"
                : "text-muted"
            }`}
          >
            Recebimentos
          </button>
        </div>

        {visibleCategories.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line p-6 text-center">
            <p className="text-sm text-muted">Nenhuma categoria encontrada.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleCategories.map((category) => {
              const usageCount =
                category.type === "EXPENSE"
                  ? category.expenseCount
                  : category.receivableCount;

              return (
                <div
                  key={category.id}
                  className={`flex items-center justify-between gap-4 rounded-xl border p-4 ${
                    category.active
                      ? "border-line"
                      : "border-dashed border-line opacity-60"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">
                      {category.name}
                    </p>

                    <p className="text-xs text-muted">
                      {categoryTypeLabels[category.type]} · {usageCount}{" "}
                      registro(s)
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => startEditing(category)}
                      className="rounded-lg border border-line px-3 py-2 text-xs text-ink"
                    >
                      Editar
                    </button>

                    {category.active ? (
                      <button
                        type="button"
                        onClick={() => handleDeactivate(category)}
                        disabled={loading}
                        className="rounded-lg border border-negative/30 px-3 py-2 text-xs text-negative disabled:opacity-50"
                      >
                        Desativar
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => updateCategoryStatus(category, true)}
                        disabled={loading}
                        className="rounded-lg border border-positive/30 px-3 py-2 text-xs text-positive disabled:opacity-50"
                      >
                        Reativar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
