-- Add estimatedDuration field to todos table
-- This field helps distinguish "cross-day work" from "long deadline but short effort"
-- Values in minutes: null=unset, presets: 15/30/60/120/240/480/960/1440

ALTER TABLE "todos" ADD COLUMN "estimatedDuration" INTEGER;