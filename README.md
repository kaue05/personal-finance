# Finance App — Fundação

Base de um sistema web de gerenciamento financeiro pessoal.

**Stack:** Next.js (App Router + TypeScript) · Tailwind CSS · Better Auth · Prisma ORM · PostgreSQL

Este pacote contém apenas a **fundação** do sistema (etapas 1–16 do escopo):
projeto configurado, schema de banco, autenticação, roles USER/ADMIN, proteção
de rotas, layout responsivo e um dashboard estrutural conectado a dados reais
(porém vazios). CRUDs de gastos, recebimentos, transferências, dívidas e
relatórios ficam para a próxima fase, sobre esta base.

## 1. Instalar dependências

```bash
npm install
```

## 2. Banco de dados

Suba um PostgreSQL (local, Docker, ou serviço gerenciado) e copie o arquivo
de exemplo de variáveis de ambiente:

```bash
cp .env.example .env
```

Edite `.env` com sua `DATABASE_URL`, um `BETTER_AUTH_SECRET` aleatório (ex:
`openssl rand -base64 32`), e as credenciais do usuário ADMIN inicial
(`ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD`) — **nunca** deixe uma senha
administrativa hardcoded no código.

## 3. Migration inicial

```bash
npx prisma migrate dev --name init
```

Isso cria todas as tabelas descritas em `prisma/schema.prisma`.

## 4. Seed do usuário ADMIN

```bash
npm run prisma:seed
```

Cria (ou promove) o usuário ADMIN a partir das variáveis de ambiente. As
categorias padrão de gastos e recebimentos são criadas automaticamente para
qualquer novo usuário (hook em `lib/auth.ts`), incluindo o ADMIN.

## 5. Rodar em desenvolvimento

```bash
npm run dev
```

Acesse `http://localhost:3000` — você será redirecionado para `/login`.

## Decisões de arquitetura importantes

- **Saldo é sempre derivado, nunca armazenado.** `BankAccount` não tem campo
  de saldo. Todo cálculo passa por `lib/finance/balance.ts`, que soma
  `Movement` (ENTRADA − SAIDA). O mesmo vale para dívidas
  (`lib/finance/debt.ts`): `valorPago` e `valorRestante` são sempre
  derivados de `DebtPayment`.
- **Cadastrar ≠ movimentar.** Um `Expense` (gasto) ou `Receivable`
  (recebimento) só gera uma `Movement` — e só então afeta o saldo — quando
  seu status muda para `PAGO`/`RECEBIDO`. Essa transição deve sempre criar a
  movimentação e a entidade dentro de uma mesma `prisma.$transaction`,
  seguindo o padrão de `lib/finance/transfer.ts`.
- **Transferências não são receita nem gasto.** Geram duas `Movement`
  (`SAIDA` na origem, `ENTRADA` no destino) amarradas por um registro
  `Transfer`, atomicamente.
- **Isolamento entre usuários.** Toda tabela financeira tem `userId`. Nenhum
  dado é lido/escrito sem passar por `requireUser()`
  (`lib/auth/guards.ts`), que resolve o usuário a partir da sessão — nunca
  de um `userId` enviado pelo client.
- **ADMIN não acessa dados financeiros.** A área `/admin` (guardada por
  `requireAdmin()`) só consulta campos de plataforma do `User` (contagens,
  status). Não importa nenhum model financeiro. Essa é uma fronteira de
  código, não apenas de UI — reforce-a ao adicionar novas telas
  administrativas.
- **Nada é excluído fisicamente** quando tem histórico financeiro (Bank,
  BankAccount, Category): usam campo `active` e `onDelete: Restrict` nas
  relações para impedir remoção enquanto referenciados.
- **Middleware vs. guards:** o `middleware.ts` faz uma checagem rápida via
  cookie (roda no edge, protege contra renderizar telas privadas sem
  sessão). A validação real de sessão e de role acontece sempre no servidor,
  em `lib/auth/guards.ts` — é essa camada que não deve ser removida.

## Próxima fase (fora do escopo deste pacote)

- CRUDs de Bancos, Contas, Categorias.
- Fluxo de Gastos (com parcelamento) e Recebimentos, incluindo as Server
  Actions que marcam PAGO/RECEBIDO e criam a `Movement` correspondente.
- Tela de Transferências usando `lib/finance/transfer.ts` como base.
- Dívidas voláteis e seus pagamentos parciais/totais.
- Relatórios com gráficos (recharts já está nas dependências).
- Ação de ativar/desativar usuário na área administrativa.
