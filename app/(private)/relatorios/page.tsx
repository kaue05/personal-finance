import { Card } from "@/components/ui/card";

export default function RelatoriosPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6">
        <h1 className="font-display text-2xl text-ink sm:text-3xl">Relatórios</h1>
      </header>

      <Card className="border-dashed">
        <p className="font-display text-lg text-ink">Em construção</p>
        <p className="mt-1 text-sm text-muted">
          Evolução e distribuição de gastos, recebimentos, contas e dívidas ao longo do tempo.
        </p>
        <p className="mt-3 text-xs text-muted">
          Esta tela será implementada na próxima fase, sobre a fundação (schema, autenticação
          e layout) já construída.
        </p>
      </Card>
    </div>
  );
}
