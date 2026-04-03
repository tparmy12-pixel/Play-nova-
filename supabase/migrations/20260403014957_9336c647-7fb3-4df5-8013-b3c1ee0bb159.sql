-- Developer accounts for game upload verification
CREATE TABLE public.developer_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  phone_number TEXT NOT NULL,
  aadhar_number TEXT NOT NULL,
  pan_number TEXT NOT NULL,
  selfie_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  rejected_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.developer_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own developer account"
  ON public.developer_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own developer account"
  ON public.developer_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all developer accounts"
  ON public.developer_accounts FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update developer accounts"
  ON public.developer_accounts FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- App ratings by real users
CREATE TABLE public.app_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  app_id UUID NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(app_id, user_id)
);

ALTER TABLE public.app_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view ratings"
  ON public.app_ratings FOR SELECT
  USING (true);

CREATE POLICY "Users can create own ratings"
  ON public.app_ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ratings"
  ON public.app_ratings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ratings"
  ON public.app_ratings FOR DELETE
  USING (auth.uid() = user_id);

-- Storage bucket for developer documents
INSERT INTO storage.buckets (id, name, public) VALUES ('developer-docs', 'developer-docs', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload own developer docs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'developer-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own developer docs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'developer-docs' AND (auth.uid()::text = (storage.foldername(name))[1] OR has_role(auth.uid(), 'admin'::app_role)));

-- Reset all fake ratings to null
UPDATE public.apps SET rating = NULL;

-- Create function to calculate average rating
CREATE OR REPLACE FUNCTION public.update_app_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.apps 
  SET rating = (SELECT AVG(rating)::numeric(3,1) FROM public.app_ratings WHERE app_id = COALESCE(NEW.app_id, OLD.app_id))
  WHERE id = COALESCE(NEW.app_id, OLD.app_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER update_app_rating_on_change
  AFTER INSERT OR UPDATE OR DELETE ON public.app_ratings
  FOR EACH ROW EXECUTE FUNCTION public.update_app_rating();