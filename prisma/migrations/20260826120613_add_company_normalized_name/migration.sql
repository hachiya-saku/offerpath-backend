/*
  Warnings:

  - A unique constraint covering the columns `[userId,normalizedName]` on the table `Company` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `normalizedName` to the `Company` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Job" DROP CONSTRAINT "Job_companyId_fkey";

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "normalizedName" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Company_userId_normalizedName_key" ON "Company"("userId", "normalizedName");

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
