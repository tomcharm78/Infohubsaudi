-- ============================================
-- Contract System - Run AFTER supabase-pathways.sql
-- ============================================

-- 1. Contracts table
CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_number TEXT NOT NULL,
  contract_type TEXT NOT NULL CHECK (contract_type IN ('investment_agreement', 'service_agreement', 'partnership_mou', 'funding_agreement')),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  terms TEXT DEFAULT '',
  
  -- Parties
  party_a_id UUID REFERENCES auth.users(id),
  party_a_email TEXT,
  party_a_name TEXT,
  party_a_org TEXT DEFAULT '',
  party_a_role TEXT DEFAULT '',
  
  party_b_id UUID REFERENCES auth.users(id),
  party_b_email TEXT,
  party_b_name TEXT,
  party_b_org TEXT DEFAULT '',
  party_b_role TEXT DEFAULT '',
  
  -- Financial
  amount TEXT DEFAULT '',
  currency TEXT DEFAULT 'USD',
  payment_terms TEXT DEFAULT '',
  
  -- Dates
  start_date DATE,
  end_date DATE,
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'party_a_signed', 'party_b_signed', 'active', 'completed', 'terminated', 'expired', 'rejected')),
  
  -- Signatures
  party_a_signature JSONB DEFAULT NULL,
  party_a_signed_at TIMESTAMPTZ,
  party_b_signature JSONB DEFAULT NULL,
  party_b_signed_at TIMESTAMPTZ,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Contract audit log
CREATE TABLE IF NOT EXISTS public.contract_audit (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  performed_by UUID REFERENCES auth.users(id),
  performed_by_email TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Generate contract numbers
CREATE OR REPLACE FUNCTION generate_contract_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.contract_number := 'HIP-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(CAST(FLOOR(RANDOM() * 99999) AS TEXT), 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_contract_number ON public.contracts;
CREATE TRIGGER set_contract_number
  BEFORE INSERT ON public.contracts
  FOR EACH ROW
  WHEN (NEW.contract_number IS NULL OR NEW.contract_number = '')
  EXECUTE FUNCTION generate_contract_number();

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_contracts_party_a ON public.contracts(party_a_id);
CREATE INDEX IF NOT EXISTS idx_contracts_party_b ON public.contracts(party_b_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON public.contracts(status);
CREATE INDEX IF NOT EXISTS idx_contract_audit_contract ON public.contract_audit(contract_id);

-- 5. RLS
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_audit ENABLE ROW LEVEL SECURITY;

-- Contracts: parties can view their own, admins see all
CREATE POLICY "Parties view own contracts" ON public.contracts FOR SELECT USING (
  auth.uid() = party_a_id OR auth.uid() = party_b_id OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Authorized users create contracts" ON public.contracts FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (
    role = 'admin' OR
    subscription_tier = 'gold' OR
    user_type IN ('investor', 'partner') OR
    subscription_tier = 'silver'
  ))
);

CREATE POLICY "Parties update own contracts" ON public.contracts FOR UPDATE USING (
  auth.uid() = party_a_id OR auth.uid() = party_b_id OR
  auth.uid() = created_by OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins delete contracts" ON public.contracts FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Audit: parties can view their contract's audit, admins see all
CREATE POLICY "View contract audit" ON public.contract_audit FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.contracts WHERE id = contract_id AND (party_a_id = auth.uid() OR party_b_id = auth.uid())) OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Insert audit log" ON public.contract_audit FOR INSERT WITH CHECK (true);
