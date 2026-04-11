-- ============================================
-- Data Migration: localStorage → Supabase
-- Run AFTER all previous SQL files
-- ============================================

-- 1. Investors table (replaces localStorage)
CREATE TABLE IF NOT EXISTS public.investors (
  id BIGINT PRIMARY KEY,
  company TEXT NOT NULL,
  country TEXT DEFAULT '',
  city TEXT DEFAULT '',
  website TEXT DEFAULT '',
  type TEXT DEFAULT '',
  aum TEXT DEFAULT '',
  region TEXT DEFAULT 'GCC',
  domains JSONB DEFAULT '[]',
  stages JSONB DEFAULT '[]',
  description TEXT DEFAULT '',
  c_suite JSONB DEFAULT '[]',
  portfolio JSONB DEFAULT '[]',
  total_investments INTEGER DEFAULT 0,
  active_deals INTEGER DEFAULT 0,
  status TEXT DEFAULT 'Active',
  source TEXT DEFAULT 'Manual',
  logo TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 2. Map providers table (replaces localStorage)
CREATE TABLE IF NOT EXISTS public.map_providers (
  id BIGINT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'provider',
  category TEXT DEFAULT '',
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  city TEXT DEFAULT '',
  region TEXT DEFAULT '',
  beds INTEGER DEFAULT 0,
  operator TEXT DEFAULT '',
  description TEXT DEFAULT '',
  cr TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  established INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 3. Map opportunities table
CREATE TABLE IF NOT EXISTS public.map_opportunities (
  id BIGINT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'opportunity',
  category TEXT DEFAULT '',
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  city TEXT DEFAULT '',
  region TEXT DEFAULT '',
  area TEXT DEFAULT '',
  investment TEXT DEFAULT '',
  description TEXT DEFAULT '',
  status TEXT DEFAULT '',
  deadline TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 4. Visitor tracking table
CREATE TABLE IF NOT EXISTS public.visitor_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  subscription_tier TEXT DEFAULT 'basic',
  page TEXT NOT NULL,
  action TEXT DEFAULT 'view',
  metadata JSONB DEFAULT '{}',
  ip_country TEXT DEFAULT '',
  session_id TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_investors_region ON public.investors(region);
CREATE INDEX IF NOT EXISTS idx_investors_country ON public.investors(country);
CREATE INDEX IF NOT EXISTS idx_map_providers_region ON public.map_providers(region);
CREATE INDEX IF NOT EXISTS idx_map_opportunities_region ON public.map_opportunities(region);
CREATE INDEX IF NOT EXISTS idx_visitor_log_user ON public.visitor_log(user_id);
CREATE INDEX IF NOT EXISTS idx_visitor_log_page ON public.visitor_log(page);
CREATE INDEX IF NOT EXISTS idx_visitor_log_date ON public.visitor_log(created_at);
CREATE INDEX IF NOT EXISTS idx_visitor_log_tier ON public.visitor_log(subscription_tier);

-- 6. RLS
ALTER TABLE public.investors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.map_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.map_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitor_log ENABLE ROW LEVEL SECURITY;

-- Investors: all authenticated users can read, editors+ can write
CREATE POLICY "Authenticated read investors" ON public.investors FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Editors insert investors" ON public.investors FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','editor'))
);
CREATE POLICY "Editors update investors" ON public.investors FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','editor'))
);
CREATE POLICY "Admins delete investors" ON public.investors FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Map providers: same pattern
CREATE POLICY "Authenticated read providers" ON public.map_providers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Editors insert providers" ON public.map_providers FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','editor'))
);
CREATE POLICY "Editors update providers" ON public.map_providers FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','editor'))
);
CREATE POLICY "Admins delete providers" ON public.map_providers FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Map opportunities: same
CREATE POLICY "Authenticated read opportunities" ON public.map_opportunities FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Editors insert opportunities" ON public.map_opportunities FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','editor'))
);
CREATE POLICY "Editors update opportunities" ON public.map_opportunities FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','editor'))
);
CREATE POLICY "Admins delete opportunities" ON public.map_opportunities FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Visitor log: users can insert own, admins can read all
CREATE POLICY "Users log visits" ON public.visitor_log FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins read visitor log" ON public.visitor_log FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================
-- 7. Create a VIEW for server-side tier gating
-- Basic users get limited columns
-- ============================================
CREATE OR REPLACE VIEW public.investors_basic AS
  SELECT id, company, country, city, region, type, logo, status,
         '***' AS aum,
         '[]'::jsonb AS c_suite,
         domains,
         '[]'::jsonb AS portfolio,
         0 AS total_investments,
         0 AS active_deals,
         '' AS website,
         LEFT(description, 50) || '...' AS description,
         '' AS source,
         created_at,
         last_updated
  FROM public.investors;

-- ============================================
-- DONE! After running this:
-- 1. Seed data will be auto-migrated from localStorage on first load
-- 2. All users share the same data
-- 3. Basic users get limited fields via API
-- ============================================
