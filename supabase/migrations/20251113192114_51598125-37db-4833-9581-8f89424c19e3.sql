-- Drop the old companies table and create new runners table
DROP TABLE IF EXISTS public.companies CASCADE;

-- Create runners table for RunStreak
CREATE TABLE public.runners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Strava integration fields
  strava_user_id BIGINT UNIQUE,
  strava_username TEXT NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  strava_access_token TEXT,
  strava_refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Streak data
  current_streak_days INTEGER DEFAULT 0,
  current_streak_miles DECIMAL(10, 2) DEFAULT 0.0,
  streak_start_date DATE,
  last_activity_date DATE,
  longest_streak_ever INTEGER DEFAULT 0,
  average_miles_per_day DECIMAL(10, 2) DEFAULT 0.0,
  streak_status TEXT DEFAULT 'active' CHECK (streak_status IN ('active', 'broken')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.runners ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access to runners"
  ON public.runners
  FOR SELECT
  USING (true);

-- Create policy for public insert (for when users connect Strava)
CREATE POLICY "Allow public insert to runners"
  ON public.runners
  FOR INSERT
  WITH CHECK (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_runners_updated_at
  BEFORE UPDATE ON public.runners
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for better query performance
CREATE INDEX idx_runners_strava_user_id ON public.runners(strava_user_id);
CREATE INDEX idx_runners_current_streak_days ON public.runners(current_streak_days DESC);
CREATE INDEX idx_runners_streak_status ON public.runners(streak_status);