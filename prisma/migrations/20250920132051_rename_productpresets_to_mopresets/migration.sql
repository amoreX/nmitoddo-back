/*
  Warnings:

  - You are about to drop the `ProductPresets` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."ProductPresets" DROP CONSTRAINT "ProductPresets_createdById_fkey";

-- AlterTable
ALTER TABLE "public"."BillOfMaterial" ADD COLUMN     "opDurationMins" INTEGER;

-- DropTable
DROP TABLE "public"."ProductPresets";

-- CreateTable
CREATE TABLE "public"."MOPresets" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "productId" INTEGER NOT NULL,
    "createdById" INTEGER NOT NULL,

    CONSTRAINT "MOPresets_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."MOPresets" ADD CONSTRAINT "MOPresets_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MOPresets" ADD CONSTRAINT "MOPresets_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
