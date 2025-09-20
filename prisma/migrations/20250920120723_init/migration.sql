-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('admin', 'manager', 'user');

-- CreateEnum
CREATE TYPE "public"."OrderStatus" AS ENUM ('draft', 'confirmed', 'in_progress', 'to_close', 'done', 'cancelled');

-- CreateEnum
CREATE TYPE "public"."WorkStatus" AS ENUM ('to_do', 'started', 'paused', 'completed');

-- CreateEnum
CREATE TYPE "public"."MovementType" AS ENUM ('in', 'out');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" SERIAL NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "loginId" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Session" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Product" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "unit" TEXT NOT NULL DEFAULT 'unit',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BillOfMaterial" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "operation" TEXT,
    "componentId" INTEGER NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillOfMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ManufacturingOrder" (
    "id" SERIAL NOT NULL,
    "quantity" INTEGER,
    "scheduleStartDate" TIMESTAMP(3),
    "deadline" TIMESTAMP(3),
    "status" "public"."OrderStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "productId" INTEGER,
    "createdById" INTEGER NOT NULL,
    "assignedToId" INTEGER,

    CONSTRAINT "ManufacturingOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorkOrder" (
    "id" SERIAL NOT NULL,
    "operation" TEXT NOT NULL,
    "status" "public"."WorkStatus" NOT NULL,
    "comments" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "durationMins" INTEGER NOT NULL,
    "durationDoneMins" INTEGER NOT NULL DEFAULT 0,
    "moId" INTEGER NOT NULL,
    "workCenterId" INTEGER,
    "assignedToId" INTEGER,

    CONSTRAINT "WorkOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorkCenter" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "capacityPerHour" DOUBLE PRECISION,
    "costPerHour" DOUBLE PRECISION,
    "downtimeMins" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" INTEGER NOT NULL,

    CONSTRAINT "WorkCenter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductLedger" (
    "id" SERIAL NOT NULL,
    "movementType" "public"."MovementType" NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "referenceType" TEXT,
    "referenceId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "productId" INTEGER NOT NULL,

    CONSTRAINT "ProductLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductStock" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Report" (
    "id" SERIAL NOT NULL,
    "reportType" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_loginId_key" ON "public"."User"("loginId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductStock_productId_key" ON "public"."ProductStock"("productId");

-- AddForeignKey
ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BillOfMaterial" ADD CONSTRAINT "BillOfMaterial_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BillOfMaterial" ADD CONSTRAINT "BillOfMaterial_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ManufacturingOrder" ADD CONSTRAINT "ManufacturingOrder_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ManufacturingOrder" ADD CONSTRAINT "ManufacturingOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ManufacturingOrder" ADD CONSTRAINT "ManufacturingOrder_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkOrder" ADD CONSTRAINT "WorkOrder_moId_fkey" FOREIGN KEY ("moId") REFERENCES "public"."ManufacturingOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkOrder" ADD CONSTRAINT "WorkOrder_workCenterId_fkey" FOREIGN KEY ("workCenterId") REFERENCES "public"."WorkCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkOrder" ADD CONSTRAINT "WorkOrder_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkCenter" ADD CONSTRAINT "WorkCenter_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductLedger" ADD CONSTRAINT "ProductLedger_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductStock" ADD CONSTRAINT "ProductStock_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Report" ADD CONSTRAINT "Report_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
