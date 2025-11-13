-- Add comment to trigger types regeneration
COMMENT ON TABLE public.runners IS 'Stores runner profiles and streak data from Strava';

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_runners_streak_status ON public.runners(streak_status);
CREATE INDEX IF NOT EXISTS idx_runners_current_streak_days ON public.runners(current_streak_days DESC);
CREATE INDEX IF NOT EXISTS idx_runners_strava_user_id ON public.runners(strava_user_id);