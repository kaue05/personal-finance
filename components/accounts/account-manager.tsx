"use client";

import { FormEvent, useState } from "react";

type Bank = {
  id: string;
  name: string;
  logoUrl: string | null;
};

type AccountType = "CORRENTE" | "POUPANCA" | "RESERVA";

type Account = {
  id: string;
  bankId: string;
  bankName: string;
  bankLogoUrl: string | null;
  name: string;
  type: AccountType;
  active: boolean;
  movementCount: number;
};

type AccountManagerProps = {
  initialBanks: Bank[];
  initialAccounts: Account[];
};

const accountTypeLabels: Record<AccountType, string> = {
  CORRENTE: "Conta corrente",
  POUPANCA: "Poupança",
  RESERVA: "Reserva",
};

export function AccountManager({
  initialBanks,
  initialAccounts,
}: AccountManagerProps) {
  const [banks] = useState(initialBanks);
  const [accounts, setAccounts] = useState(initialAccounts);

  const [bankId, setBankId] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("CORRENTE");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const activeAccounts = accounts.filter((account) => account.active);
  const inactiveAccounts = accounts.filter((account) => !account.active);

  function resetForm() {
    setBankId("");
    setName("");
    setType("CORRENTE");
    setEditingId(null);
    setError("");
  }

  function startEditing(account: Account) {
    setEditingId(account.id);
    setBankId(account.bankId);
    setName(account.name);
    setType(account.type);
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!bankId) {
      setError("Selecione um banco");
      return;
    }

    setLoading(true);
    setError("");

    const isEditing = Boolean(editingId);

    try {
      const response = await fetch(
        isEditing ? `/api/accounts/${editingId}` : "/api/accounts",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            bankId,
            name,
            type,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Não foi possível salvar a conta");
      }

      const updatedAccount: Account = {
        id: data.id,
        bankId: data.bank.id,
        bankName: data.bank.name,
        bankLogoUrl: data.bank.logoUrl,
        name: data.name,
        type: data.type,
        active: data.active,
        movementCount: data._count.movementsAsSource,
      };

      if (isEditing) {
        setAccounts((current) =>
          current.map((account) =>
            account.id === updatedAccount.id ? updatedAccount : account,
          ),
        );
      } else {
        setAccounts((current) => [...current, updatedAccount]);
      }

      resetForm();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Não foi possível salvar a conta",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleDeactivate(account: Account) {
    const confirmed = window.confirm(
      `Deseja desativar a conta "${account.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/accounts/${account.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Não foi possível desativar a conta");
      }

      setAccounts((current) =>
        current.map((item) =>
          item.id === account.id
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
          : "Não foi possível desativar a conta",
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
            {editingId ? "Editar conta" : "Nova conta"}
          </h2>

          <p className="mt-1 text-sm text-muted">
            O cadastro da conta não cria nenhuma movimentação.
          </p>
        </div>

        {banks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line p-4">
            <p className="text-sm text-muted">
              Cadastre um banco antes de criar uma conta.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="account-bank"
                className="mb-1 block text-sm font-medium text-ink"
              >
                Banco
              </label>

              <select
                id="account-bank"
                value={bankId}
                onChange={(event) => setBankId(event.target.value)}
                required
                className="w-full rounded-xl border border-line bg-background px-3 py-2 text-sm outline-none focus:border-ink"
              >
                <option value="">Selecione</option>

                {banks.map((bank) => (
                  <option key={bank.id} value={bank.id}>
                    {bank.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="account-name"
                className="mb-1 block text-sm font-medium text-ink"
              >
                Nome ou apelido
              </label>

              <input
                id="account-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ex.: Conta principal"
                required
                maxLength={80}
                className="w-full rounded-xl border border-line bg-background px-3 py-2 text-sm outline-none focus:border-ink"
              />
            </div>

            <div>
              <label
                htmlFor="account-type"
                className="mb-1 block text-sm font-medium text-ink"
              >
                Tipo
              </label>

              <select
                id="account-type"
                value={type}
                onChange={(event) => setType(event.target.value as AccountType)}
                className="w-full rounded-xl border border-line bg-background px-3 py-2 text-sm outline-none focus:border-ink"
              >
                <option value="CORRENTE">Conta corrente</option>
                <option value="POUPANCA">Poupança</option>
                <option value="RESERVA">Reserva</option>
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
                    : "Cadastrar conta"}
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
        <div className="mb-5">
          <h2 className="font-display text-lg text-ink">Contas cadastradas</h2>

          <p className="mt-1 text-sm text-muted">
            {activeAccounts.length} conta(s) ativa(s)
          </p>
        </div>

        {accounts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line p-6 text-center">
            <p className="text-sm text-muted">
              Nenhuma conta cadastrada ainda.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeAccounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-line p-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  {account.bankLogoUrl ? (
                    <img
                      src={account.bankLogoUrl}
                      alt=""
                      className="h-10 w-10 rounded-full object-contain"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white">
                      {account.bankName.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">
                      {account.name}
                    </p>

                    <p className="text-xs text-muted">
                      {account.bankName} · {accountTypeLabels[account.type]}
                    </p>

                    <p className="text-xs text-muted">
                      {account.movementCount} movimentação(ões)
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => startEditing(account)}
                    className="rounded-lg border border-line px-3 py-2 text-xs text-ink"
                  >
                    Editar
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeactivate(account)}
                    disabled={loading}
                    className="rounded-lg border border-negative/30 px-3 py-2 text-xs text-negative disabled:opacity-50"
                  >
                    Desativar
                  </button>
                </div>
              </div>
            ))}

            {inactiveAccounts.length > 0 && (
              <details className="pt-3">
                <summary className="cursor-pointer text-sm text-muted">
                  Mostrar contas desativadas ({inactiveAccounts.length})
                </summary>

                <div className="mt-3 space-y-2">
                  {inactiveAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="rounded-xl bg-background px-4 py-3 text-sm text-muted"
                    >
                      {account.name} — {account.bankName} — desativada
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
