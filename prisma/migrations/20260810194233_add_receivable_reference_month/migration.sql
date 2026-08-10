-- AlterTable
ALTER TABLE "receivable" ADD COLUMN     "referenceMonth" DATE;

-- CreateIndex
CREATE INDEX "receivable_referenceMonth_idx" ON "receivable"("referenceMonth");
