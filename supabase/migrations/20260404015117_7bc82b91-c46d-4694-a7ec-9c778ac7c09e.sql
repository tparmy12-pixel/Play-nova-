
-- Developer Wallets
CREATE TABLE public.developer_wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_earned NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_withdrawn NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.developer_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallet" ON public.developer_wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert wallet" ON public.developer_wallets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all wallets" ON public.developer_wallets FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update wallets" ON public.developer_wallets FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Payment Transactions
CREATE TABLE public.payment_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  app_id UUID NOT NULL,
  buyer_id UUID NOT NULL,
  developer_id UUID NOT NULL,
  product_name TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  platform_commission NUMERIC(12,2) NOT NULL DEFAULT 0,
  developer_share NUMERIC(12,2) NOT NULL DEFAULT 0,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers can view own transactions" ON public.payment_transactions FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "Developers can view own transactions" ON public.payment_transactions FOR SELECT USING (auth.uid() = developer_id);
CREATE POLICY "Admins can view all transactions" ON public.payment_transactions FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update transactions" ON public.payment_transactions FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "System can insert transactions" ON public.payment_transactions FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- Withdrawal Requests
CREATE TABLE public.withdrawal_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  upi_id TEXT,
  bank_details TEXT,
  admin_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own withdrawals" ON public.withdrawal_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create withdrawal" ON public.withdrawal_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all withdrawals" ON public.withdrawal_requests FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update withdrawals" ON public.withdrawal_requests FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Auto-create wallet when developer account is approved (trigger)
CREATE OR REPLACE FUNCTION public.auto_create_developer_wallet()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    INSERT INTO public.developer_wallets (user_id)
    VALUES (NEW.user_id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_developer_approved
  AFTER UPDATE ON public.developer_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_developer_wallet();

-- Function to credit developer wallet after successful payment
CREATE OR REPLACE FUNCTION public.credit_developer_wallet(_transaction_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _dev_id UUID;
  _dev_share NUMERIC;
BEGIN
  SELECT developer_id, developer_share INTO _dev_id, _dev_share
  FROM public.payment_transactions WHERE id = _transaction_id AND status = 'completed';
  
  IF _dev_id IS NOT NULL THEN
    UPDATE public.developer_wallets
    SET balance = balance + _dev_share,
        total_earned = total_earned + _dev_share,
        updated_at = now()
    WHERE user_id = _dev_id;
  END IF;
END;
$$;

-- Updated_at triggers
CREATE TRIGGER update_developer_wallets_updated_at BEFORE UPDATE ON public.developer_wallets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payment_transactions_updated_at BEFORE UPDATE ON public.payment_transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_withdrawal_requests_updated_at BEFORE UPDATE ON public.withdrawal_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
