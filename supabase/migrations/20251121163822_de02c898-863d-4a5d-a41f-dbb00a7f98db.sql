-- Create table for custom referral codes
CREATE TABLE IF NOT EXISTS public.referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  runner_id UUID NOT NULL REFERENCES public.runners(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(code),
  UNIQUE(runner_id, code)
);

-- Enable RLS
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

-- Users can view their own codes
CREATE POLICY "Users can view own referral codes"
  ON public.referral_codes
  FOR SELECT
  USING (
    (SELECT user_id FROM runners WHERE id = runner_id) = auth.uid()
  );

-- Users can insert their own codes
CREATE POLICY "Users can create own referral codes"
  ON public.referral_codes
  FOR INSERT
  WITH CHECK (
    (SELECT user_id FROM runners WHERE id = runner_id) = auth.uid()
  );

-- Users can delete their own codes
CREATE POLICY "Users can delete own referral codes"
  ON public.referral_codes
  FOR DELETE
  USING (
    (SELECT user_id FROM runners WHERE id = runner_id) = auth.uid()
  );