-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('admin', 'manager', 'inventory_manager', 'operator');

-- CreateEnum
CREATE TYPE "public"."OrderStatus" AS ENUM ('planned', 'in_progress', 'done', 'canceled');

-- CreateEnum
CREATE TYPE "public"."WorkStatus" AS ENUM ('planned', 'started', 'paused', 'completed');

-- CreateEnum
CREATE TYPE "public"."MovementType" AS ENUM ('in', 'out');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" SERIAL NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL,
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
    "quantity" DOUBLE PRECISION NOT NULL,
    "operation" TEXT,
    "estimatedTimeMins" INTEGER,
    "productId" INTEGER NOT NULL,
    "componentId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillOfMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ManufacturingOrder" (
    "id" SERIAL NOT NULL,
    "quantity" INTEGER NOT NULL,
    "scheduleStartDate" TIMESTAMP(3),
    "deadline" TIMESTAMP(3),
    "status" "public"."OrderStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "productId" INTEGER NOT NULL,
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

    CONSTRAINT "WorkCenter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StockLedger" (
    "id" SERIAL NOT NULL,
    "movementType" "public"."MovementType" NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "referenceType" TEXT,
    "referenceId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "productId" INTEGER NOT NULL,
    "createdById" INTEGER NOT NULL,

    CONSTRAINT "StockLedger_pkey" PRIMARY KEY ("id")
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

-- AddForeignKey
ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BillOfMaterial" ADD CONSTRAINT "BillOfMaterial_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BillOfMaterial" ADD CONSTRAINT "BillOfMaterial_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ManufacturingOrder" ADD CONSTRAINT "ManufacturingOrder_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
ALTER TABLE "public"."StockLedger" ADD CONSTRAINT "StockLedger_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StockLedger" ADD CONSTRAINT "StockLedger_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Report" ADD CONSTRAINT "Report_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ===============================
-- ENABLE ROW LEVEL SECURITY
-- ===============================

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ManufacturingOrder" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WorkOrder" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StockLedger" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Report" ENABLE ROW LEVEL SECURITY;

-- ===============================
-- USER TABLE POLICIES
-- ===============================

-- Users can see their own record
CREATE POLICY user_self_access ON "User"
    FOR SELECT USING (id::text = current_setting('app.current_user_id', true));

-- Admin can do anything
CREATE POLICY user_admin_access ON "User"
    FOR ALL USING (
        (SELECT role FROM "User" WHERE id::text = current_setting('app.current_user_id', true)) = 'admin'
    );

-- ===============================
-- MANUFACTURING ORDER POLICIES
-- ===============================

-- Admin & Manager full access
CREATE POLICY mo_manager_access ON "ManufacturingOrder"
    FOR ALL USING (
        (SELECT role FROM "User" WHERE id::text = current_setting('app.current_user_id', true)) 
        IN ('admin','manager')
    );

-- Operator can only see assigned orders
CREATE POLICY mo_operator_access ON "ManufacturingOrder"
    FOR SELECT USING (
        assignedToId::text = current_setting('app.current_user_id', true)
    );

-- ===============================
-- WORK ORDER POLICIES
-- ===============================

-- Admin & Manager full access
CREATE POLICY wo_manager_access ON "WorkOrder"
    FOR ALL USING (
        (SELECT role FROM "User" WHERE id::text = current_setting('app.current_user_id', true))
        IN ('admin','manager')
    );

-- Operator can only see & update their own WOs
CREATE POLICY wo_operator_access ON "WorkOrder"
    FOR SELECT USING (assignedToId::text = current_setting('app.current_user_id', true))
    WITH CHECK (assignedToId::text = current_setting('app.current_user_id', true));

-- ===============================
-- STOCK LEDGER POLICIES
-- ===============================

-- Admin & Inventory manager full access
CREATE POLICY stock_inventory_access ON "StockLedger"
    FOR ALL USING (
        (SELECT role FROM "User" WHERE id::text = current_setting('app.current_user_id', true))
        IN ('admin','inventory_manager')
    );

-- Manager can read only
CREATE POLICY stock_manager_read ON "StockLedger"
    FOR SELECT USING (
        (SELECT role FROM "User" WHERE id::text = current_setting('app.current_user_id', true)) = 'manager'
    );

-- ===============================
-- REPORT POLICIES
-- ===============================

-- Users can see their own reports
CREATE POLICY report_self_access ON "Report"
    FOR SELECT USING (
        userId::text = current_setting('app.current_user_id', true)
    );

-- Admin & Manager can access all reports
CREATE POLICY report_manager_access ON "Report"
    FOR ALL USING (
        (SELECT role FROM "User" WHERE id::text = current_setting('app.current_user_id', true)) 
        IN ('admin','manager')
    );

-- ===============================
-- Notes
-- Your app must set app.current_user_id on each DB session:
-- SELECT set_config('app.current_user_id', '<user_id>', true);
-- RLS enforces row-level access in Postgres, independent of Prisma client queries.
-- This gives full RLS coverage for all main tables in your schema.