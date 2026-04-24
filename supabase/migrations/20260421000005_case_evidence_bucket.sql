INSERT INTO storage.buckets (id, name, public) 
VALUES ('case-evidence', 'case-evidence', false) 
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow public insert to case-evidence" ON storage.objects
  FOR INSERT TO public
  WITH CHECK (bucket_id = 'case-evidence');

CREATE POLICY "Allow public select from case-evidence" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'case-evidence');
