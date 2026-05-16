CREATE POLICY "Staff can update documentos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'documentos' AND auth.uid() IS NOT NULL)
WITH CHECK (bucket_id = 'documentos' AND auth.uid() IS NOT NULL);