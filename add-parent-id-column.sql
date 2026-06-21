-- Add parent_id column to students table if it doesn't exist
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Create index for parent_id if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_students_parent_id ON students(parent_id);
