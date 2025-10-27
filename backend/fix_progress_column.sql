-- Fix module_sessions.progress column to accept 0.0 to 1.0 range instead of 0 to 100
-- This aligns the database schema with the backend code which uses 0.0-1.0

-- Drop the old constraint
ALTER TABLE module_sessions DROP CONSTRAINT IF EXISTS module_sessions_progress_check;

-- Update the column constraint to accept 0.0 to 1.0
ALTER TABLE module_sessions ADD CONSTRAINT module_sessions_progress_check 
  CHECK (progress >= 0 AND progress <= 1.0);

-- Optional: Update any existing data that might be in 0-100 range to 0.0-1.0
-- Uncomment only if you have existing data in 0-100 format:
-- UPDATE module_sessions SET progress = progress / 100.0 WHERE progress > 1.0;
