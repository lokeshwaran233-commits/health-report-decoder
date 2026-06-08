
CREATE TABLE public.subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  price_inr_paise INTEGER NOT NULL DEFAULT 0,
  interval TEXT NOT NULL DEFAULT 'monthly' CHECK (interval IN ('monthly','yearly','none')),
  monthly_report_quota INTEGER NOT NULL DEFAULT 0,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.subscription_plans TO anon, authenticated;
GRANT ALL ON public.subscription_plans TO service_role;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active plans" ON public.subscription_plans FOR SELECT USING (is_active = true);

CREATE TABLE public.credit_packs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  credits INTEGER NOT NULL CHECK (credits > 0),
  price_inr_paise INTEGER NOT NULL CHECK (price_inr_paise >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.credit_packs TO anon, authenticated;
GRANT ALL ON public.credit_packs TO service_role;
ALTER TABLE public.credit_packs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active credit packs" ON public.credit_packs FOR SELECT USING (is_active = true);

-- Seed catalog BEFORE creating entitlements (FK target must exist)
INSERT INTO public.subscription_plans (code, name, description, price_inr_paise, interval, monthly_report_quota, features, sort_order) VALUES
  ('free',  'Free',  'Try ReportRx with one report a month.', 0, 'none', 1, '["1 report per month","Plain-English summaries","Email support"]'::jsonb, 0),
  ('plus',  'Plus',  'For individuals who track their health regularly.', 19900, 'monthly', 0, '["Unlimited reports","Full history & trends","Zeno health chat","Priority support"]'::jsonb, 1),
  ('pro',   'Pro',   'For families and power users.', 49900, 'monthly', 0, '["Everything in Plus","Family profiles (up to 5)","PDF & audio exports","Early access to new features"]'::jsonb, 2);

INSERT INTO public.credit_packs (code, name, description, credits, price_inr_paise, sort_order) VALUES
  ('pack_1',  'Single report',  'Decode one lab report.', 1, 4900, 0),
  ('pack_5',  '5-report pack',  'Best for occasional check-ups.', 5, 19900, 1),
  ('pack_20', '20-report pack', 'Best value for families.', 20, 49900, 2);

CREATE TABLE public.user_entitlements (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_code TEXT NOT NULL DEFAULT 'free' REFERENCES public.subscription_plans(code),
  plan_started_at TIMESTAMPTZ,
  plan_renews_at TIMESTAMPTZ,
  plan_status TEXT NOT NULL DEFAULT 'active' CHECK (plan_status IN ('active','cancelled','past_due','expired')),
  credit_balance INTEGER NOT NULL DEFAULT 0 CHECK (credit_balance >= 0),
  reports_used_this_period INTEGER NOT NULL DEFAULT 0 CHECK (reports_used_this_period >= 0),
  period_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.user_entitlements TO authenticated;
GRANT ALL ON public.user_entitlements TO service_role;
ALTER TABLE public.user_entitlements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view their own entitlements" ON public.user_entitlements FOR SELECT USING (auth.uid() = user_id);

CREATE TABLE public.payment_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  razorpay_order_id TEXT NOT NULL UNIQUE,
  razorpay_payment_id TEXT UNIQUE,
  kind TEXT NOT NULL CHECK (kind IN ('credit_pack','subscription')),
  item_code TEXT NOT NULL,
  amount_paise INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created','paid','failed','refunded')),
  fulfilled_at TIMESTAMPTZ,
  raw_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_payment_orders_user ON public.payment_orders(user_id, created_at DESC);
CREATE INDEX idx_payment_orders_status ON public.payment_orders(status);
GRANT SELECT ON public.payment_orders TO authenticated;
GRANT ALL ON public.payment_orders TO service_role;
ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view their own orders" ON public.payment_orders FOR SELECT USING (auth.uid() = user_id);

CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON public.subscription_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_credit_packs_updated_at BEFORE UPDATE ON public.credit_packs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_entitlements_updated_at BEFORE UPDATE ON public.user_entitlements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payment_orders_updated_at BEFORE UPDATE ON public.payment_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.ensure_user_entitlements()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_entitlements (user_id, plan_code) VALUES (NEW.id, 'free') ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_entitlements
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.ensure_user_entitlements();

INSERT INTO public.user_entitlements (user_id, plan_code)
SELECT id, 'free' FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
