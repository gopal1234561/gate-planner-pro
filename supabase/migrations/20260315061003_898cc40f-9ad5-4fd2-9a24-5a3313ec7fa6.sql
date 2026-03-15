
-- Create storage bucket for note images
INSERT INTO storage.buckets (id, name, public) VALUES ('note-images', 'note-images', true);

-- Allow authenticated users to upload images
CREATE POLICY "Users can upload note images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'note-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow anyone to view note images (public bucket)
CREATE POLICY "Anyone can view note images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'note-images');

-- Allow users to delete their own images
CREATE POLICY "Users can delete their own note images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'note-images' AND (storage.foldername(name))[1] = auth.uid()::text);
