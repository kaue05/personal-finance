/*
  Warnings:

  - A unique constraint covering the columns `[userId,bankId,name]` on the table `bank_account` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "bank_account_userId_bankId_name_key" ON "bank_account"("userId", "bankId", "name");
