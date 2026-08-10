"use client";

import { FormEvent, useState } from "react";

type Bank = {
  id: string;
  name: string;
  logoUrl: string | null;
  active: boolean;
  accountCount: number;
};

type BankManagerProps = {
  initialBanks: Bank[];
};

export function BankManager({ initialBanks }: BankManagerProps) {
  const [banks, setBanks] = useState(initialBanks);
  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const activeBanks = banks.filter((bank) => bank.active);
  const inactiveBanks = banks.filter((bank) => !bank.active);

  function resetForm() {
    setName("");
    setLogoUrl("");
    setEditingId(null);
    setError("");
  }

  function startEditing(bank: Bank) {
    setEditingId(bank.id);
    setName(bank.name);
    setLogoUrl(bank.logoUrl ?? "");
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");

    const isEditing = Boolean(editingId);

    try {
      const response = await fetch(
        isEditing ? `/api/banks/${editingId}` : "/api/banks",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            logoUrl,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Não foi possível salvar o banco");
      }

      if (isEditing) {
        setBanks((current) =>
          current.map((bank) =>
            bank.id === data.id
              ? {
                  ...bank,
                  name: data.name,
                  logoUrl: data.logoUrl,
                }
              : bank,
          ),
        );
      } else {
        setBanks((current) => [
          ...current,
          {
            id: data.id,
            name: data.name,
            logoUrl: data.logoUrl,
            active: data.active,
            accountCount: data._count.bankAccounts,
          },
        ]);
      }

      resetForm();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Não foi possível salvar o banco",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleDeactivate(bank: Bank) {
    const confirmed = window.confirm(
      `Deseja desativar o banco "${bank.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/banks/${bank.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Não foi possível desativar o banco");
      }

      setBanks((current) =>
        current.map((item) =>
          item.id === bank.id
            ? {
                ...item,
                active: false,
              }
            : item,
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível desativar o banco",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <section className="rounded-2xl border border-line bg-surface p-5">
        <div className="mb-5">
          <h2 className="font-display text-lg text-ink">
            {editingId ? "Editar banco" : "Novo banco"}
          </h2>

          <p className="mt-1 text-sm text-muted">
            Use um nome fácil de reconhecer.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="bank-name"
              className="mb-1 block text-sm font-medium text-ink"
            >
              Nome
            </label>

            <input
              id="bank-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ex.: Nubank"
              required
              maxLength={80}
              className="w-full rounded-xl border border-line bg-background px-3 py-2 text-sm outline-none focus:border-ink"
            />
          </div>

          <div>
            <label
              htmlFor="bank-logo"
              className="mb-1 block text-sm font-medium text-ink"
            >
              URL do logo
            </label>

            <input
              id="bank-logo"
              type="url"
              value={logoUrl}
              onChange={(event) => setLogoUrl(event.target.value)}
              placeholder="Opcional"
              className="w-full rounded-xl border border-line bg-background px-3 py-2 text-sm outline-none focus:border-ink"
            />
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
                  : "Cadastrar banco"}
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
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg text-ink">
              Bancos cadastrados
            </h2>

            <p className="mt-1 text-sm text-muted">
              {activeBanks.length} banco(s) ativo(s)
            </p>
          </div>
        </div>

        {banks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line p-6 text-center">
            <p className="text-sm text-muted">Nenhum banco cadastrado ainda.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeBanks.map((bank) => (
              <div
                key={bank.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-line p-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  {bank.logoUrl ? (
                    <img
                      src={bank.logoUrl}
                      alt=""
                      className="h-10 w-10 rounded-full object-contain"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white">
                      {bank.name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{bank.name}</p>

                    <p className="text-xs text-muted">
                      {bank.accountCount} conta(s)
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => startEditing(bank)}
                    className="rounded-lg border border-line px-3 py-2 text-xs text-ink"
                  >
                    Editar
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeactivate(bank)}
                    disabled={loading}
                    className="rounded-lg border border-negative/30 px-3 py-2 text-xs text-negative disabled:opacity-50"
                  >
                    Desativar
                  </button>
                </div>
              </div>
            ))}

            {inactiveBanks.length > 0 && (
              <details className="pt-3">
                <summary className="cursor-pointer text-sm text-muted">
                  Mostrar bancos desativados ({inactiveBanks.length})
                </summary>

                <div className="mt-3 space-y-2">
                  {inactiveBanks.map((bank) => (
                    <div
                      key={bank.id}
                      className="rounded-xl bg-background px-4 py-3 text-sm text-muted"
                    >
                      {bank.name} — desativado
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
