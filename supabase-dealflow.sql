-- ============================================
-- Deal Flow + Document Vault + Regulatory Alerts
-- Run AFTER supabase-promos-testimonials.sql
-- ============================================

-- 1. Deal Flow Pipeline
CREATE TABLE IF NOT EXISTS public.deals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  user_name TEXT DEFAULT '',
  user_org TEXT DEFAULT '',
  user_type TEXT DEFAULT 'seeker',
  
  title TEXT NOT NULL,
  deal_type TEXT DEFAULT 'equity' CHECK (deal_type IN ('equity','debt','partnership','acquisition','lease','ppp','other')),
  sector TEXT DEFAULT '',
  city TEXT DEFAULT '',
  region TEXT DEFAULT '',
  
  funding_amount TEXT DEFAULT '',
  currency TEXT DEFAULT 'SAR',
  equity_offered TEXT DEFAULT '',
  
  description TEXT DEFAULT '',
  highlights JSONB DEFAULT '[]',
  requirements TEXT DEFAULT '',
  timeline TEXT DEFAULT '',
  
  status TEXT DEFAULT 'active' CHECK (status IN ('active','under_review','closed','withdrawn')),
  is_featured BOOLEAN DEFAULT FALSE,
  views_count INTEGER DEFAULT 0,
  interest_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deal interest/expressions
CREATE TABLE IF NOT EXISTS public.deal_interests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  user_name TEXT DEFAULT '',
  message TEXT DEFAULT '',
  status TEXT DEFAULT 'new' CHECK (status IN ('new','viewed','responded')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Due Diligence Document Vault
CREATE TABLE IF NOT EXISTS public.vault_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id),
  owner_email TEXT,
  shared_with UUID REFERENCES auth.users(id),
  shared_with_email TEXT,
  
  deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  
  file_name TEXT NOT NULL,
  file_type TEXT DEFAULT '',
  file_size INTEGER DEFAULT 0,
  file_path TEXT DEFAULT '',
  
  doc_category TEXT DEFAULT 'other' CHECK (doc_category IN ('financials','feasibility','license','business_plan','legal','valuation','other')),
  notes TEXT DEFAULT '',
  
  is_confidential BOOLEAN DEFAULT TRUE,
  access_expires_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Regulatory Alerts
CREATE TABLE IF NOT EXISTS public.regulatory_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  entity TEXT NOT NULL,
  category TEXT DEFAULT 'update' CHECK (category IN ('new_regulation','amendment','deadline','announcement','opportunity','warning')),
  summary TEXT DEFAULT '',
  impact TEXT DEFAULT '',
  source_url TEXT DEFAULT '',
  effective_date DATE,
  
  is_active BOOLEAN DEFAULT TRUE,
  is_urgent BOOLEAN DEFAULT FALSE,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_deals_status ON public.deals(status);
CREATE INDEX IF NOT EXISTS idx_deals_user ON public.deals(user_id);
CREATE INDEX IF NOT EXISTS idx_deals_sector ON public.deals(sector);
CREATE INDEX IF NOT EXISTS idx_deal_interests_deal ON public.deal_interests(deal_id);
CREATE INDEX IF NOT EXISTS idx_vault_owner ON public.vault_documents(owner_id);
CREATE INDEX IF NOT EXISTS idx_vault_shared ON public.vault_documents(shared_with);
CREATE INDEX IF NOT EXISTS idx_alerts_active ON public.regulatory_alerts(is_active);

-- 5. RLS
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vault_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regulatory_alerts ENABLE ROW LEVEL SECURITY;

-- Deals: active visible to all authenticated, users manage own
CREATE POLICY "Read active deals" ON public.deals FOR SELECT USING (status = 'active' OR user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Users create deals" ON public.deals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own deals" ON public.deals FOR UPDATE USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins delete deals" ON public.deals FOR DELETE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Deal interests
CREATE POLICY "Deal owners read interests" ON public.deal_interests FOR SELECT USING (EXISTS (SELECT 1 FROM public.deals WHERE id = deal_id AND user_id = auth.uid()) OR user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Users express interest" ON public.deal_interests FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Vault: owner and shared user only
CREATE POLICY "Vault access" ON public.vault_documents FOR SELECT USING (owner_id = auth.uid() OR shared_with = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Users upload vault docs" ON public.vault_documents FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owner manages vault" ON public.vault_documents FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "Owner deletes vault docs" ON public.vault_documents FOR DELETE USING (owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Alerts: all authenticated read, admins manage
CREATE POLICY "Read active alerts" ON public.regulatory_alerts FOR SELECT USING (is_active = true OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins create alerts" ON public.regulatory_alerts FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins update alerts" ON public.regulatory_alerts FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins delete alerts" ON public.regulatory_alerts FOR DELETE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
