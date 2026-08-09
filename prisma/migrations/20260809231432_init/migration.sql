-- CreateEnum
CREATE TYPE "PlatformRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "BankAccountType" AS ENUM ('CORRENTE', 'POUPANCA', 'RESERVA');

-- CreateEnum
CREATE TYPE "CategoryType" AS ENUM ('EXPENSE', 'RECEIVABLE');

-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('ENTRADA', 'SAIDA');

-- CreateEnum
CREATE TYPE "MovementOrigin" AS ENUM ('MANUAL', 'TRANSFERENCIA', 'GASTO', 'RECEBIMENTO', 'PAGAMENTO_DIVIDA');

-- CreateEnum
CREATE TYPE "ExpenseStatus" AS ENUM ('PENDENTE', 'PAGO');

-- CreateEnum
CREATE TYPE "ReceivableStatus" AS ENUM ('PENDENTE', 'RECEBIDO');

-- CreateEnum
CREATE TYPE "DebtStatus" AS ENUM ('ABERTA', 'QUITADA');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "role" "PlatformRole" NOT NULL DEFAULT 'USER',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bankId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "BankAccountType" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CategoryType" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "type" "MovementType" NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "origin" "MovementOrigin" NOT NULL DEFAULT 'MANUAL',
    "transferId" TEXT,
    "expenseId" TEXT,
    "receivableId" TEXT,
    "debtPaymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "movement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transfer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fromAccountId" TEXT NOT NULL,
    "toAccountId" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "ExpenseStatus" NOT NULL DEFAULT 'PENDENTE',
    "paidAccountId" TEXT,
    "paidAt" TIMESTAMP(3),
    "installmentGroupId" TEXT,
    "installmentNumber" INTEGER,
    "installmentTotal" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receivable" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "expectedDate" TIMESTAMP(3) NOT NULL,
    "status" "ReceivableStatus" NOT NULL DEFAULT 'PENDENTE',
    "receivedAccountId" TEXT,
    "receivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "receivable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "debt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "totalAmount" DECIMAL(14,2) NOT NULL,
    "status" "DebtStatus" NOT NULL DEFAULT 'ABERTA',
    "lastPaymentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "debt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "debt_payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "debtId" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "accountId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "debt_payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "user_role_idx" ON "user"("role");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE INDEX "bank_userId_idx" ON "bank"("userId");

-- CreateIndex
CREATE INDEX "bank_account_userId_idx" ON "bank_account"("userId");

-- CreateIndex
CREATE INDEX "bank_account_bankId_idx" ON "bank_account"("bankId");

-- CreateIndex
CREATE INDEX "category_userId_idx" ON "category"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "category_userId_name_type_key" ON "category"("userId", "name", "type");

-- CreateIndex
CREATE UNIQUE INDEX "movement_expenseId_key" ON "movement"("expenseId");

-- CreateIndex
CREATE UNIQUE INDEX "movement_receivableId_key" ON "movement"("receivableId");

-- CreateIndex
CREATE UNIQUE INDEX "movement_debtPaymentId_key" ON "movement"("debtPaymentId");

-- CreateIndex
CREATE INDEX "movement_userId_idx" ON "movement"("userId");

-- CreateIndex
CREATE INDEX "movement_accountId_idx" ON "movement"("accountId");

-- CreateIndex
CREATE INDEX "movement_date_idx" ON "movement"("date");

-- CreateIndex
CREATE INDEX "movement_transferId_idx" ON "movement"("transferId");

-- CreateIndex
CREATE INDEX "transfer_userId_idx" ON "transfer"("userId");

-- CreateIndex
CREATE INDEX "transfer_fromAccountId_idx" ON "transfer"("fromAccountId");

-- CreateIndex
CREATE INDEX "transfer_toAccountId_idx" ON "transfer"("toAccountId");

-- CreateIndex
CREATE INDEX "expense_userId_idx" ON "expense"("userId");

-- CreateIndex
CREATE INDEX "expense_categoryId_idx" ON "expense"("categoryId");

-- CreateIndex
CREATE INDEX "expense_dueDate_idx" ON "expense"("dueDate");

-- CreateIndex
CREATE INDEX "expense_status_idx" ON "expense"("status");

-- CreateIndex
CREATE INDEX "expense_installmentGroupId_idx" ON "expense"("installmentGroupId");

-- CreateIndex
CREATE INDEX "receivable_userId_idx" ON "receivable"("userId");

-- CreateIndex
CREATE INDEX "receivable_categoryId_idx" ON "receivable"("categoryId");

-- CreateIndex
CREATE INDEX "receivable_expectedDate_idx" ON "receivable"("expectedDate");

-- CreateIndex
CREATE INDEX "receivable_status_idx" ON "receivable"("status");

-- CreateIndex
CREATE INDEX "debt_userId_idx" ON "debt"("userId");

-- CreateIndex
CREATE INDEX "debt_status_idx" ON "debt"("status");

-- CreateIndex
CREATE INDEX "debt_payment_userId_idx" ON "debt_payment"("userId");

-- CreateIndex
CREATE INDEX "debt_payment_debtId_idx" ON "debt_payment"("debtId");

-- CreateIndex
CREATE INDEX "debt_payment_date_idx" ON "debt_payment"("date");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank" ADD CONSTRAINT "bank_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_account" ADD CONSTRAINT "bank_account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_account" ADD CONSTRAINT "bank_account_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "bank"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category" ADD CONSTRAINT "category_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movement" ADD CONSTRAINT "movement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movement" ADD CONSTRAINT "movement_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "bank_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movement" ADD CONSTRAINT "movement_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "transfer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movement" ADD CONSTRAINT "movement_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "expense"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movement" ADD CONSTRAINT "movement_receivableId_fkey" FOREIGN KEY ("receivableId") REFERENCES "receivable"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movement" ADD CONSTRAINT "movement_debtPaymentId_fkey" FOREIGN KEY ("debtPaymentId") REFERENCES "debt_payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer" ADD CONSTRAINT "transfer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer" ADD CONSTRAINT "transfer_fromAccountId_fkey" FOREIGN KEY ("fromAccountId") REFERENCES "bank_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer" ADD CONSTRAINT "transfer_toAccountId_fkey" FOREIGN KEY ("toAccountId") REFERENCES "bank_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense" ADD CONSTRAINT "expense_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense" ADD CONSTRAINT "expense_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense" ADD CONSTRAINT "expense_paidAccountId_fkey" FOREIGN KEY ("paidAccountId") REFERENCES "bank_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receivable" ADD CONSTRAINT "receivable_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receivable" ADD CONSTRAINT "receivable_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receivable" ADD CONSTRAINT "receivable_receivedAccountId_fkey" FOREIGN KEY ("receivedAccountId") REFERENCES "bank_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debt" ADD CONSTRAINT "debt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debt_payment" ADD CONSTRAINT "debt_payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debt_payment" ADD CONSTRAINT "debt_payment_debtId_fkey" FOREIGN KEY ("debtId") REFERENCES "debt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debt_payment" ADD CONSTRAINT "debt_payment_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "bank_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
