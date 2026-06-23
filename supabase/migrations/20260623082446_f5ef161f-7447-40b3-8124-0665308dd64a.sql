
CREATE POLICY "grain read" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'grain-photos');
CREATE POLICY "grain upload" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'grain-photos');
