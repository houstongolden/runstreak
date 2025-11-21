-- Create referrals table to track invite relationships
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES public.runners(id) ON DELETE CASCADE,
  referred_runner_id UUID REFERENCES public.runners(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  signup_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index on referral_code for fast lookups
CREATE INDEX idx_referrals_referral_code ON public.referrals(referral_code);
CREATE INDEX idx_referrals_referrer_id ON public.referrals(referrer_id);

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own referrals
CREATE POLICY "Users can view own referrals"
ON public.referrals
FOR SELECT
USING (
  (SELECT runners.user_id FROM runners WHERE runners.id = referrals.referrer_id) = auth.uid()
);

-- Policy: Anyone can view referral stats (for leaderboard)
CREATE POLICY "Anyone can view referral counts"
ON public.referrals
FOR SELECT
USING (true);

-- Create referral_prizes table for weekly giveaway campaigns
CREATE TABLE public.referral_prizes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_name TEXT NOT NULL,
  prize_description TEXT NOT NULL,
  prize_value TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  winner_runner_id UUID REFERENCES public.runners(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.referral_prizes ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active prizes
CREATE POLICY "Anyone can view prizes"
ON public.referral_prizes
FOR SELECT
USING (true);

-- Policy: Admins can manage prizes
CREATE POLICY "Admins can manage prizes"
ON public.referral_prizes
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Create function to generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code(p_runner_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code TEXT;
  v_username TEXT;
BEGIN
  -- Get runner's username or strava_username
  SELECT COALESCE(username, strava_username) INTO v_username
  FROM runners
  WHERE id = p_runner_id;
  
  -- Generate code: first 6 chars of username (uppercase) + last 4 chars of UUID
  v_code := UPPER(LEFT(REGEXP_REPLACE(v_username, '[^a-zA-Z0-9]', '', 'g'), 6)) || 
            UPPER(RIGHT(REPLACE(p_runner_id::text, '-', ''), 4));
  
  RETURN v_code;
END;
$$;

-- Add trigger to update updated_at on referrals
CREATE TRIGGER update_referrals_updated_at
BEFORE UPDATE ON public.referrals
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();