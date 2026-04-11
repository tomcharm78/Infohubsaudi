-- ============================================
-- Studies & Documents Module - Run AFTER subscription SQL
-- ============================================

-- 1. Documents table (studies, presentations uploaded by admin)
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  doc_type TEXT NOT NULL CHECK (doc_type IN ('demand_supply_study', 'presentation', 'opportunity_info', 'report', 'other')),
  region TEXT,
  city TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER DEFAULT 0,
  mime_type TEXT DEFAULT 'application/pdf',
  access_tier TEXT DEFAULT 'gold' CHECK (access_tier IN ('basic', 'silver', 'gold')),
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Download log (track who downloads what)
CREATE TABLE IF NOT EXISTS public.download_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  downloaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_documents_type ON public.documents(doc_type);
CREATE INDEX IF NOT EXISTS idx_documents_region ON public.documents(region);
CREATE INDEX IF NOT EXISTS idx_download_log_doc ON public.download_log(document_id);

-- 4. RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.download_log ENABLE ROW LEVEL SECURITY;

-- Everyone can view document metadata
CREATE POLICY "Anyone reads documents" ON public.documents FOR SELECT USING (true);
-- Only admins can insert/update/delete
CREATE POLICY "Admins manage documents" ON public.documents FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins update documents" ON public.documents FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins delete documents" ON public.documents FOR DELETE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Download log
CREATE POLICY "Users log downloads" ON public.download_log FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view download log" ON public.download_log FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================
-- 5. Create Storage Bucket (run separately if needed)
-- Go to Supabase Dashboard → Storage → New Bucket
-- Name: "documents"
-- Public: OFF (private)
-- File size limit: 50MB
-- Allowed MIME types: application/pdf, application/vnd.ms-powerpoint,
--   application/vnd.openxmlformats-officedocument.presentationml.presentation,
--   application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document
--
-- Then run these storage policies in SQL Editor:
-- ============================================

-- Storage policies (uncomment and run if bucket 'documents' exists)
-- CREATE POLICY "Admins upload documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
-- CREATE POLICY "Authenticated users read documents" ON storage.objects FOR SELECT USING (bucket_id = 'documents' AND auth.role() = 'authenticated');
-- CREATE POLICY "Admins delete documents" ON storage.objects FOR DELETE USING (bucket_id = 'documents' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
