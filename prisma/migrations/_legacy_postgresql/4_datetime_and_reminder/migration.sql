-- Migration: Convert date fields to DateTime and add Reminder table
-- This migration automatically converts existing date strings to DateTime with time set to 00:00:00

-- ============================================
-- Step 1: Convert Todo date fields to DateTime
-- ============================================

-- Add temporary DateTime columns
ALTER TABLE "todos" ADD COLUMN "startDate_new" TIMESTAMP(3);
ALTER TABLE "todos" ADD COLUMN "dueDate_new" TIMESTAMP(3);
ALTER TABLE "todos" ADD COLUMN "completedAt_new" TIMESTAMP(3);

-- Convert existing string dates to DateTime (append T00:00:00.000Z)
UPDATE "todos"
SET "startDate_new" = ("startDate" || 'T00:00:00.000Z')::timestamp(3),
    "dueDate_new" = ("dueDate" || 'T00:00:00.000Z')::timestamp(3),
    "completedAt_new" = CASE
      WHEN "completedAt" IS NOT NULL THEN ("completedAt" || 'T00:00:00.000Z')::timestamp(3)
      ELSE NULL
    END;

-- Drop old columns
ALTER TABLE "todos" DROP COLUMN "startDate";
ALTER TABLE "todos" DROP COLUMN "dueDate";
ALTER TABLE "todos" DROP COLUMN "completedAt";

-- Rename new columns
ALTER TABLE "todos" RENAME COLUMN "startDate_new" TO "startDate";
ALTER TABLE "todos" RENAME COLUMN "dueDate_new" TO "dueDate";
ALTER TABLE "todos" RENAME COLUMN "completedAt_new" TO "completedAt";

-- Set NOT NULL constraints
ALTER TABLE "todos" ALTER COLUMN "startDate" SET NOT NULL;
ALTER TABLE "todos" ALTER COLUMN "dueDate" SET NOT NULL;

-- ============================================
-- Step 2: Convert RecurrenceRule date fields to DateTime
-- ============================================

-- Add temporary DateTime columns
ALTER TABLE "recurrence_rules" ADD COLUMN "startDate_new" TIMESTAMP(3);
ALTER TABLE "recurrence_rules" ADD COLUMN "endDate_new" TIMESTAMP(3);

-- Convert existing string dates to DateTime
UPDATE "recurrence_rules"
SET "startDate_new" = ("startDate" || 'T00:00:00.000Z')::timestamp(3),
    "endDate_new" = CASE
      WHEN "endDate" IS NOT NULL THEN ("endDate" || 'T00:00:00.000Z')::timestamp(3)
      ELSE NULL
    END;

-- Drop old columns
ALTER TABLE "recurrence_rules" DROP COLUMN "startDate";
ALTER TABLE "recurrence_rules" DROP COLUMN "endDate";

-- Rename new columns
ALTER TABLE "recurrence_rules" RENAME COLUMN "startDate_new" TO "startDate";
ALTER TABLE "recurrence_rules" RENAME COLUMN "endDate_new" TO "endDate";

-- Set NOT NULL constraint
ALTER TABLE "recurrence_rules" ALTER COLUMN "startDate" SET NOT NULL;

-- ============================================
-- Step 3: Create Reminder table
-- ============================================

CREATE TABLE "reminders" (
    "id" TEXT NOT NULL,
    "todoId" TEXT NOT NULL,
    "remindAt" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "offset" INTEGER,
    "sent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reminders_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_todoId_fkey"
    FOREIGN KEY ("todoId") REFERENCES "todos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create indexes
CREATE INDEX "reminders_remindAt_sent_idx" ON "reminders"("remindAt", "sent");
CREATE INDEX "reminders_todoId_idx" ON "reminders"("todoId");
