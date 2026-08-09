import { Card } from "@/components/ui/card";

export default function AdminConfiguracoesPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6">
        <h1 className="font-display text-2xl text-ink sm:text-3xl">Configurações da plataforma</h1>
      </header>

      <Card className="border-dashed">
        <p className="font-display text-lg text-ink">Em construção</p>
        <p className="mt-1 text-sm text-muted">
          Configurações globais da plataforma (não financeiras) serão adicionadas aqui em uma
          próxima fase.
        </p>
      </Card>
    </div>
  );
}
