-- Migration: Add InboxItem table for capture box feature

CREATE TABLE "inbox_items" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "convertedToTodoId" TEXT,
    "convertedAt" TIMESTAMP(3),

    CONSTRAINT "inbox_items_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraint
ALTER TABLE "inbox_items" ADD CONSTRAINT "inbox_items_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create indexes for efficient queries
CREATE INDEX "inbox_items_userId_createdAt_idx" ON "inbox_items"("userId", "createdAt");
CREATE INDEX "inbox_items_userId_convertedToTodoId_idx" ON "inbox_items"("userId", "convertedToTodoId");
