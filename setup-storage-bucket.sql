-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Allow authenticated users to upload avatars
CREATE POLICY "Avatar upload policy" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Allow authenticated users to view avatars
CREATE POLICY "Avatar view policy" ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'avatars');

-- Allow users to update their own avatars
CREATE POLICY "Avatar update policy" ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

-- Allow users to delete their own avatars
CREATE POLICY "Avatar delete policy" ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');
