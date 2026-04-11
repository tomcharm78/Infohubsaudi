-- ============================================
-- Promo Codes + Testimonials - Run AFTER marketplace SQL
-- ============================================

-- 1. Promo codes table (multiple codes, trackable)
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_pct NUMERIC(5,2) DEFAULT 5,
  discount_type TEXT DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed_usd', 'free_trial_days')),
  discount_value NUMERIC(10,2) DEFAULT 5,
  max_uses INTEGER DEFAULT 0,
  current_uses INTEGER DEFAULT 0,
  target_tier TEXT DEFAULT 'all',
  target_user_type TEXT DEFAULT 'all',
  is_active BOOLEAN DEFAULT TRUE,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Promo code usage log
CREATE TABLE IF NOT EXISTS public.promo_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  promo_id UUID REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  code TEXT,
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  used_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. In-app notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'promo', 'system', 'testimonial')),
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Testimonials table
CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  user_name TEXT NOT NULL,
  user_title TEXT DEFAULT '',
  user_org TEXT DEFAULT '',
  user_type TEXT DEFAULT 'investor',
  content TEXT NOT NULL,
  rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  is_approved BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON public.promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_testimonials_approved ON public.testimonials(is_approved);

-- 6. RLS
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Promo codes: admins manage, users can validate
CREATE POLICY "Anyone reads active promos" ON public.promo_codes FOR SELECT USING (is_active = true OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins manage promos" ON public.promo_codes FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins update promos" ON public.promo_codes FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins delete promos" ON public.promo_codes FOR DELETE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Promo usage
CREATE POLICY "Log promo usage" ON public.promo_usage FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins view usage" ON public.promo_usage FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Notifications: users see own
CREATE POLICY "Users read own notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "System sends notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING (user_id = auth.uid());

-- Testimonials: approved ones public, users submit own
CREATE POLICY "Read approved testimonials" ON public.testimonials FOR SELECT USING (is_approved = true OR user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Users submit testimonials" ON public.testimonials FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage testimonials" ON public.testimonials FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins delete testimonials" ON public.testimonials FOR DELETE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 7. Seed some sample promo codes
INSERT INTO public.promo_codes (code, discount_pct, discount_type, discount_value, max_uses, target_tier, is_active, valid_until) VALUES
  ('LAUNCH5', 5, 'percentage', 5, 0, 'all', true, '2026-12-31'),
  ('GHE2025', 10, 'percentage', 10, 100, 'all', true, '2026-12-31'),
  ('FOUNDER30', 30, 'free_trial_days', 30, 50, 'all', true, '2026-12-31'),
  ('GOLD20', 20, 'percentage', 20, 25, 'gold', true, '2026-12-31')
ON CONFLICT (code) DO NOTHING;

-- 8. Connection Requests (admin-mediated introductions)
CREATE TABLE IF NOT EXISTS public.connection_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id UUID REFERENCES auth.users(id),
  from_email TEXT,
  from_name TEXT,
  from_org TEXT DEFAULT '',
  from_user_type TEXT DEFAULT '',
  to_user_id UUID REFERENCES auth.users(id),
  to_email TEXT,
  to_name TEXT,
  to_org TEXT DEFAULT '',
  to_user_type TEXT DEFAULT '',
  message TEXT DEFAULT '',
  admin_note TEXT DEFAULT '',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'introduced', 'rejected', 'completed')),
  handled_by UUID REFERENCES auth.users(id),
  handled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conn_req_from ON public.connection_requests(from_user_id);
CREATE INDEX IF NOT EXISTS idx_conn_req_to ON public.connection_requests(to_user_id);
CREATE INDEX IF NOT EXISTS idx_conn_req_status ON public.connection_requests(status);

ALTER TABLE public.connection_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own requests" ON public.connection_requests FOR SELECT USING (
  from_user_id = auth.uid() OR to_user_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Users create requests" ON public.connection_requests FOR INSERT WITH CHECK (auth.uid() = from_user_id);
CREATE POLICY "Admin updates requests" ON public.connection_requests FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin deletes requests" ON public.connection_requests FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
