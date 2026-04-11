-- ============================================
-- Marketplace Cards - Run AFTER supabase-contracts.sql
-- ============================================

CREATE TABLE IF NOT EXISTS public.marketplace_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT,
  
  -- Card type (matches user pathway)
  card_type TEXT NOT NULL CHECK (card_type IN ('investor', 'seeker', 'partner')),
  
  -- Common fields
  company_name TEXT NOT NULL,
  logo_text TEXT DEFAULT '',
  tagline TEXT DEFAULT '',
  description TEXT DEFAULT '',
  website TEXT DEFAULT '',
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  city TEXT DEFAULT '',
  country TEXT DEFAULT 'Saudi Arabia',
  
  -- Investor-specific
  aum TEXT DEFAULT '',
  investment_focus JSONB DEFAULT '[]',
  deal_size_min TEXT DEFAULT '',
  deal_size_max TEXT DEFAULT '',
  preferred_stages JSONB DEFAULT '[]',
  portfolio_highlights JSONB DEFAULT '[]',
  investor_type TEXT DEFAULT '',
  
  -- Seeker-specific
  funding_needed TEXT DEFAULT '',
  sector TEXT DEFAULT '',
  project_stage TEXT DEFAULT '',
  revenue TEXT DEFAULT '',
  team_size INTEGER DEFAULT 0,
  pitch_summary TEXT DEFAULT '',
  
  -- Partner-specific
  impact_focus JSONB DEFAULT '[]',
  funding_capacity TEXT DEFAULT '',
  regions_active JSONB DEFAULT '[]',
  partnerships_seeking TEXT DEFAULT '',
  
  -- Display control
  is_featured BOOLEAN DEFAULT FALSE,
  is_priority BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  is_flagged BOOLEAN DEFAULT FALSE,
  flag_reason TEXT DEFAULT '',
  
  -- Metadata
  subscription_tier TEXT DEFAULT 'basic',
  views_count INTEGER DEFAULT 0,
  inquiries_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Card inquiries (when someone contacts a card owner)
CREATE TABLE IF NOT EXISTS public.card_inquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id UUID REFERENCES public.marketplace_cards(id) ON DELETE CASCADE,
  from_user_id UUID REFERENCES auth.users(id),
  from_email TEXT,
  from_name TEXT,
  message TEXT DEFAULT '',
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cards_type ON public.marketplace_cards(card_type);
CREATE INDEX IF NOT EXISTS idx_cards_user ON public.marketplace_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_tier ON public.marketplace_cards(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_cards_featured ON public.marketplace_cards(is_featured, is_priority);
CREATE INDEX IF NOT EXISTS idx_inquiries_card ON public.card_inquiries(card_id);

-- RLS
ALTER TABLE public.marketplace_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_inquiries ENABLE ROW LEVEL SECURITY;

-- Cards: everyone reads active cards, users manage own
CREATE POLICY "Read active cards" ON public.marketplace_cards FOR SELECT USING (is_active = true OR user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Users create cards" ON public.marketplace_cards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own cards" ON public.marketplace_cards FOR UPDATE USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins delete cards" ON public.marketplace_cards FOR DELETE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Inquiries
CREATE POLICY "Card owners read inquiries" ON public.card_inquiries FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.marketplace_cards WHERE id = card_id AND user_id = auth.uid()) OR
  from_user_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Users send inquiries" ON public.card_inquiries FOR INSERT WITH CHECK (auth.uid() = from_user_id);
CREATE POLICY "Card owners update inquiries" ON public.card_inquiries FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.marketplace_cards WHERE id = card_id AND user_id = auth.uid())
);
