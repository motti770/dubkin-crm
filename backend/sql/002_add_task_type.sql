-- Migration: Add 'task' to activities type CHECK + add completed field
-- Run this once on the production DB

-- 1. Drop old constraint
ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_type_check;

-- 2. Add new constraint with 'task'
ALTER TABLE activities
  ADD CONSTRAINT activities_type_check
  CHECK (type IN ('call','email','whatsapp','meeting','note','task','other'));

-- 3. Add completed field for task tracking
ALTER TABLE activities
  ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT FALSE;
