
-- Add uploaded_by, status, trust_score to apps
ALTER TABLE public.apps ADD COLUMN IF NOT EXISTS uploaded_by uuid;
ALTER TABLE public.apps ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';
ALTER TABLE public.apps ADD COLUMN IF NOT EXISTS trust_score integer DEFAULT 0;

-- User installs tracking table
CREATE TABLE public.user_installs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  app_id uuid NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  installed_version text NOT NULL DEFAULT '1.0.0',
  installed_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, app_id)
);

ALTER TABLE public.user_installs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own installs" ON public.user_installs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own installs" ON public.user_installs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own installs" ON public.user_installs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own installs" ON public.user_installs FOR DELETE USING (auth.uid() = user_id);

-- App reviews / verification logs table
CREATE TABLE public.app_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id uuid NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  scan_result text DEFAULT 'pending',
  flagged_permissions text[] DEFAULT '{}',
  suspicious_keywords text[] DEFAULT '{}',
  trust_score integer DEFAULT 0,
  notes text,
  reviewed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage reviews" ON public.app_reviews FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Uploaders can view own app reviews" ON public.app_reviews FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.apps WHERE apps.id = app_reviews.app_id AND apps.uploaded_by = auth.uid())
);

-- Update apps RLS: any authenticated user can upload, users manage their own, admin manages all
DROP POLICY IF EXISTS "Admins can insert apps" ON public.apps;
DROP POLICY IF EXISTS "Admins can update apps" ON public.apps;
DROP POLICY IF EXISTS "Admins can delete apps" ON public.apps;
DROP POLICY IF EXISTS "Anyone can view apps" ON public.apps;

CREATE POLICY "Anyone can view approved apps" ON public.apps FOR SELECT USING (status = 'approved' OR uploaded_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated users can upload apps" ON public.apps FOR INSERT TO authenticated WITH CHECK (auth.uid() = uploaded_by);
CREATE POLICY "Users can update own apps" ON public.apps FOR UPDATE USING (uploaded_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can delete own apps" ON public.apps FOR DELETE USING (uploaded_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- Update existing apps to set status as approved (they were already there)
UPDATE public.apps SET status = 'approved' WHERE status = 'pending';

-- Storage policies for apks bucket - allow authenticated users to upload
CREATE POLICY "Authenticated users can upload apks" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'apks');
CREATE POLICY "Authenticated users can upload app-assets" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'app-assets');
