-- ============================================
-- Subscription Module - Run AFTER auth setup
-- ============================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'basic' CHECK (subscription_tier IN ('basic', 'silver', 'gold'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_period TEXT DEFAULT 'monthly';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS moyasar_customer_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_usd NUMERIC(10,2) NOT NULL,
  amount_sar NUMERIC(10,2) NOT NULL,
  tier TEXT NOT NULL,
  period TEXT NOT NULL,
  promo_code TEXT,
  discount_pct NUMERIC(5,2) DEFAULT 0,
  payment_id TEXT,
  moyasar_payment_id TEXT,
  status TEXT DEFAULT 'pending',
  refund_reason TEXT,
  refunded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.admin_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.admin_settings (key, value) VALUES
  ('launch_promo_active', 'true'::jsonb),
  ('promo_code_active', 'false'::jsonb),
  ('promo_code_text', '"HEALTH5"'::jsonb),
  ('promo_code_discount_pct', '5'::jsonb),
  ('launch_promo_end_date', '"2026-10-01"'::jsonb)
ON CONFLICT (key) DO NOTHING;

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own payments" ON public.payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all payments" ON public.payments FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Insert payments" ON public.payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Read settings" ON public.admin_settings FOR SELECT USING (true);
CREATE POLICY "Admin update settings" ON public.admin_settings FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin insert settings" ON public.admin_settings FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
