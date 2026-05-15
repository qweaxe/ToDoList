-- Migration: Add users table and userId fields for multi-user auth

-- 1. Create users table
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- 2. Add userId columns as nullable first (to handle existing data)
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "userId" TEXT;
ALTER TABLE "todos" ADD COLUMN IF NOT EXISTS "userId" TEXT;
ALTER TABLE "recurrence_rules" ADD COLUMN IF NOT EXISTS "userId" TEXT;

-- 3. Create a legacy user to own any pre-existing data
INSERT INTO "users" ("id", "username", "password", "name", "updatedAt")
VALUES (
    'cllegacyuser000000000000',
    'admin',
    '$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FHe/9iFRZHftnHJe4bK9KGhU2/uqvGG',
    '管理员',
    NOW()
) ON CONFLICT DO NOTHING;

-- 4. Assign all existing orphaned rows to the legacy user
UPDATE "categories" SET "userId" = 'cllegacyuser000000000000' WHERE "userId" IS NULL;
UPDATE "todos" SET "userId" = 'cllegacyuser000000000000' WHERE "userId" IS NULL;
UPDATE "recurrence_rules" SET "userId" = 'cllegacyuser000000000000' WHERE "userId" IS NULL;

-- 5. Make userId NOT NULL
ALTER TABLE "categories" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "todos" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "recurrence_rules" ALTER COLUMN "userId" SET NOT NULL;

-- 6. Add foreign key constraints
ALTER TABLE "categories" ADD CONSTRAINT "categories_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "todos" ADD CONSTRAINT "todos_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "recurrence_rules" ADD CONSTRAINT "recurrence_rules_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 7. Drop old global unique constraint on categories.name (if exists)
DROP INDEX IF EXISTS "categories_name_key";

-- 8. Add user-scoped unique constraint on categories
CREATE UNIQUE INDEX IF NOT EXISTS "categories_userId_name_key" ON "categories"("userId", "name");

-- 9. Drop old unique constraint on todos (if exists)
DROP INDEX IF EXISTS "todos_parentRuleId_dueDate_title_key";

-- 10. Add indexes
CREATE INDEX IF NOT EXISTS "todos_userId_idx" ON "todos"("userId");
CREATE INDEX IF NOT EXISTS "recurrence_rules_userId_idx" ON "recurrence_rules"("userId");
