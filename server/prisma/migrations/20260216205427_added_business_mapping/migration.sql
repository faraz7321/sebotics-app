/*
  Warnings:

  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the `Robot` table. If the table is not empty, all the data it contains will be lost.
  - Changed the type of `id` on the `User` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "Robot" DROP CONSTRAINT "Robot_assignedUserId_fkey";

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");

-- DropTable
DROP TABLE "Robot";

-- CreateTable
CREATE TABLE "Business" (
    "id" UUID NOT NULL,

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessUserMapping" (
    "id" UUID NOT NULL,
    "businessId" UUID NOT NULL,
    "userId" UUID NOT NULL,

    CONSTRAINT "BusinessUserMapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BusinessUserMapping_businessId_idx" ON "BusinessUserMapping"("businessId");

-- CreateIndex
CREATE INDEX "BusinessUserMapping_userId_idx" ON "BusinessUserMapping"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessUserMapping_userId_businessId_key" ON "BusinessUserMapping"("userId", "businessId");

-- AddForeignKey
ALTER TABLE "BusinessUserMapping" ADD CONSTRAINT "BusinessUserMapping_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessUserMapping" ADD CONSTRAINT "BusinessUserMapping_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
