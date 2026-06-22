-- Create assignments table
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  due_date DATE,
  points INTEGER DEFAULT 100,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'overdue')),
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_assignments_class_id ON assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_assignments_created_by ON assignments(created_by);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Teachers can see their own assignments
CREATE POLICY "Teachers can view own assignments"
  ON assignments FOR SELECT
  TO authenticated
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- Teachers can create assignments
CREATE POLICY "Teachers can create assignments"
  ON assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- Teachers can update their own assignments
CREATE POLICY "Teachers can update own assignments"
  ON assignments FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- Teachers can delete their own assignments
CREATE POLICY "Teachers can delete own assignments"
  ON assignments FOR DELETE
  TO authenticated
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- Students and parents can view assignments for their class
CREATE POLICY "Students and parents can view class assignments"
  ON assignments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students 
      WHERE user_id = auth.uid() AND class_id = assignments.class_id
    ) OR
    EXISTS (
      SELECT 1 FROM students s
      JOIN profiles p ON p.id = s.parent_id
      WHERE p.id = auth.uid() AND s.class_id = assignments.class_id
    )
  );
