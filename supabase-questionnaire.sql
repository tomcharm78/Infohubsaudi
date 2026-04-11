-- ============================================
-- Questionnaire Module - Supabase Setup
-- Run this in SQL Editor AFTER the auth setup
-- ============================================

-- 1. Questionnaires table
CREATE TABLE IF NOT EXISTS public.questionnaires (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  questions JSONB NOT NULL DEFAULT '[]',
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed')),
  notify_email TEXT DEFAULT '',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Responses table
CREATE TABLE IF NOT EXISTS public.responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  questionnaire_id UUID REFERENCES public.questionnaires(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  answers JSONB DEFAULT '{}',
  skipped BOOLEAN DEFAULT FALSE,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_responses_questionnaire ON public.responses(questionnaire_id);
CREATE INDEX IF NOT EXISTS idx_responses_user ON public.responses(user_id);
CREATE INDEX IF NOT EXISTS idx_questionnaires_status ON public.questionnaires(status);

-- 4. Enable RLS
ALTER TABLE public.questionnaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;

-- 5. Policies for questionnaires
-- Everyone can view active questionnaires
CREATE POLICY "Anyone can view active questionnaires" ON public.questionnaires
  FOR SELECT USING (true);

-- Only admins can insert
CREATE POLICY "Admins can create questionnaires" ON public.questionnaires
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Only admins can update
CREATE POLICY "Admins can update questionnaires" ON public.questionnaires
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Only admins can delete
CREATE POLICY "Admins can delete questionnaires" ON public.questionnaires
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 6. Policies for responses
-- Users can view their own responses
CREATE POLICY "Users can view own responses" ON public.responses
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all responses
CREATE POLICY "Admins can view all responses" ON public.responses
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Any authenticated user can submit a response
CREATE POLICY "Users can submit responses" ON public.responses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can delete responses
CREATE POLICY "Admins can delete responses" ON public.responses
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- DONE! Now the questionnaire module is ready.
-- ============================================
