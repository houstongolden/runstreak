-- Create enum for accountability partner status
CREATE TYPE public.accountability_status AS ENUM ('pending', 'accepted', 'declined');

-- Create user_follows table for RunStreak following
CREATE TABLE public.user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES public.runners(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.runners(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Create accountability_partners table
CREATE TABLE public.accountability_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES public.runners(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES public.runners(id) ON DELETE CASCADE,
  status accountability_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(requester_id, partner_id),
  CHECK (requester_id != partner_id)
);

-- Enable RLS
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accountability_partners ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_follows
CREATE POLICY "Anyone can view follows"
  ON public.user_follows FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own follows"
  ON public.user_follows FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can delete their own follows"
  ON public.user_follows FOR DELETE
  USING (true);

-- RLS Policies for accountability_partners
CREATE POLICY "Users can view their own partnership requests"
  ON public.accountability_partners FOR SELECT
  USING (true);

CREATE POLICY "Users can create partnership requests"
  ON public.accountability_partners FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update partnership requests they're involved in"
  ON public.accountability_partners FOR UPDATE
  USING (true);

-- Add accountability settings to user_settings
ALTER TABLE public.user_settings
  ADD COLUMN accountability_notifications_enabled BOOLEAN DEFAULT true,
  ADD COLUMN show_strava_follow_prompt BOOLEAN DEFAULT true;

-- Create indexes for performance
CREATE INDEX idx_user_follows_follower ON public.user_follows(follower_id);
CREATE INDEX idx_user_follows_following ON public.user_follows(following_id);
CREATE INDEX idx_accountability_requester ON public.accountability_partners(requester_id);
CREATE INDEX idx_accountability_partner ON public.accountability_partners(partner_id);
CREATE INDEX idx_accountability_status ON public.accountability_partners(status);

-- Create trigger for updating accountability_partners updated_at
CREATE OR REPLACE FUNCTION public.update_accountability_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_accountability_partners_updated_at
  BEFORE UPDATE ON public.accountability_partners
  FOR EACH ROW
  EXECUTE FUNCTION public.update_accountability_updated_at();