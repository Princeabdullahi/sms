-- Add student_id column to profiles table
-- This will add the column without deleting any existing data
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS student_id TEXT UNIQUE;
