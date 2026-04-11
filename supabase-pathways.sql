-- ============================================
-- 3-Pathway System + PPP + Private Assets
-- Run AFTER supabase-data-migration.sql
-- ============================================

-- 1. Add user_type to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'investor' CHECK (user_type IN ('investor', 'seeker', 'partner'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS organization TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS organization_type TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS website TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS interests JSONB DEFAULT '[]';

-- Email preferences + auto-renewal
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT TRUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_promos BOOLEAN DEFAULT TRUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_alerts BOOLEAN DEFAULT TRUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_deals BOOLEAN DEFAULT TRUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_digest BOOLEAN DEFAULT TRUE;

-- 2. PPP Government Projects table
CREATE TABLE IF NOT EXISTS public.map_ppp (
  id BIGINT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'ppp',
  category TEXT DEFAULT '',
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  city TEXT DEFAULT '',
  region TEXT DEFAULT '',
  government_entity TEXT DEFAULT '',
  budget TEXT DEFAULT '',
  project_scope TEXT DEFAULT '',
  timeline TEXT DEFAULT '',
  status TEXT DEFAULT 'Open for Bidding',
  contact_info TEXT DEFAULT '',
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 3. Private Assets for Sale table
CREATE TABLE IF NOT EXISTS public.map_private_assets (
  id BIGINT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'private_asset',
  asset_type TEXT DEFAULT 'Hospital',
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  city TEXT DEFAULT '',
  region TEXT DEFAULT '',
  asking_price TEXT DEFAULT '',
  annual_revenue TEXT DEFAULT '',
  beds INTEGER DEFAULT 0,
  staff_count INTEGER DEFAULT 0,
  license_status TEXT DEFAULT '',
  year_established INTEGER DEFAULT 0,
  reason_for_sale TEXT DEFAULT '',
  contact_info TEXT DEFAULT '',
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_map_ppp_region ON public.map_ppp(region);
CREATE INDEX IF NOT EXISTS idx_map_private_assets_region ON public.map_private_assets(region);

-- 5. RLS
ALTER TABLE public.map_ppp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.map_private_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read ppp" ON public.map_ppp FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Editors insert ppp" ON public.map_ppp FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','editor')));
CREATE POLICY "Editors update ppp" ON public.map_ppp FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','editor')));
CREATE POLICY "Admins delete ppp" ON public.map_ppp FOR DELETE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Authenticated read assets" ON public.map_private_assets FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Editors insert assets" ON public.map_private_assets FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','editor')));
CREATE POLICY "Editors update assets" ON public.map_private_assets FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','editor')));
CREATE POLICY "Admins delete assets" ON public.map_private_assets FOR DELETE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
