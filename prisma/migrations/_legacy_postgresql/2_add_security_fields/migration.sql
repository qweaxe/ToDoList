-- Migration: Add security question fields to users table

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "securityQuestion" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "securityAnswer" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "securityAnswerAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "securityAnswerLockedAt" TIMESTAMP(3);
