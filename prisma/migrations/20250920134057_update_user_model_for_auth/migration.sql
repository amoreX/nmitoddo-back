/*
  Warnings:

  - You are about to drop the column `fullName` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `passwordHash` on the `User` table. All the data in the column will be lost.
  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- First, add the new columns as nullable
ALTER TABLE "public"."User" ADD COLUMN "name" TEXT;
ALTER TABLE "public"."User" ADD COLUMN "password" TEXT;

-- Copy data from old columns to new columns
UPDATE "public"."User" SET "name" = "fullName";
UPDATE "public"."User" SET "password" = "passwordHash";

-- Make password NOT NULL now that it has data
ALTER TABLE "public"."User" ALTER COLUMN "password" SET NOT NULL;

-- Drop the old columns
ALTER TABLE "public"."User" DROP COLUMN "fullName";
ALTER TABLE "public"."User" DROP COLUMN "passwordHash";

-- Make loginId nullable
ALTER TABLE "public"."User" ALTER COLUMN "loginId" DROP NOT NULL;
