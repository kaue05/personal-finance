export function AboutSettings() {
    return (
        <div className="space-y-8">
            <section>
                <h2 className="font-display text-lg text-ink">
                    Versão
                </h2>

                <p className="mt-1 text-sm text-muted">
                    Você está usando a versão{" "}
                    <span className="font-medium text-ink">1.0.0</span> do
                    sistema.
                </p>
            </section>

            <section>
                <h2 className="font-display text-lg text-ink">
                    Tecnologias
                </h2>

                <p className="mt-1 text-sm text-muted">
                    Este sistema foi construído com:
                </p>

                <ul className="mt-4 space-y-1 text-sm text-muted">
                    <li>• Next.js 15</li>
                    <li>• React 19</li>
                    <li>• TypeScript</li>
                    <li>• Prisma ORM</li>
                    <li>• PostgreSQL</li>
                    <li>• Tailwind CSS</li>
                    <li>• Better Auth</li>
                </ul>
            </section>

            <section>
                <h2 className="font-display text-lg text-ink">
                    Repositório
                </h2>

                <p className="mt-1 text-sm text-muted">
                    Este é um projeto open source. Você pode acessar o
                    código-fonte e contribuir no GitHub.
                </p>

                <a
                    href="https://github.com/seu-usuario/seu-repo"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-block text-sm font-medium text-ink underline underline-offset-4 hover:text-ink/80"
                >
                    Acessar repositório
                </a>
            </section>
        </div>
    );
}