-- Add days on streak tracking fields to runners table
ALTER TABLE public.runners
  ADD COLUMN joined_runstreak_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ADD COLUMN days_on_streak_since_joining INTEGER DEFAULT 0,
  ADD COLUMN total_days_since_joining INTEGER DEFAULT 0,
  ADD COLUMN days_on_streak_last_30 INTEGER DEFAULT 0,
  ADD COLUMN days_on_streak_last_60 INTEGER DEFAULT 0,
  ADD COLUMN days_on_streak_last_90 INTEGER DEFAULT 0,
  ADD COLUMN days_on_streak_before_joining INTEGER DEFAULT 0,
  ADD COLUMN total_days_before_joining INTEGER DEFAULT 0;

-- Add comment explaining the philosophy
COMMENT ON COLUMN public.runners.days_on_streak_since_joining IS 'Total days with at least one run since joining RunStreak, regardless of breaks';
COMMENT ON COLUMN public.runners.days_on_streak_before_joining IS 'Average days with activity in 90-day periods before joining, for comparison';

-- Create index for performance
CREATE INDEX idx_runners_joined_at ON public.runners(joined_runstreak_at);

-- Create aggregate stats table for homepage display
CREATE TABLE public.aggregate_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stat_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_users INTEGER NOT NULL DEFAULT 0,
  avg_days_on_streak_improvement NUMERIC NOT NULL DEFAULT 0,
  avg_days_on_streak_percentage NUMERIC NOT NULL DEFAULT 0,
  total_miles_logged NUMERIC NOT NULL DEFAULT 0,
  active_streaks_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(stat_date)
);

-- Enable RLS
ALTER TABLE public.aggregate_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policy - anyone can view aggregate stats
CREATE POLICY "Anyone can view aggregate stats"
  ON public.aggregate_stats FOR SELECT
  USING (true);

-- Create index
CREATE INDEX idx_aggregate_stats_date ON public.aggregate_stats(stat_date DESC);