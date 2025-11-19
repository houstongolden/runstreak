-- Create table for individual strava activities
CREATE TABLE IF NOT EXISTS public.strava_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  runner_id UUID NOT NULL,
  activity_date DATE NOT NULL,
  strava_activity_id BIGINT NOT NULL UNIQUE,
  name TEXT,
  distance NUMERIC NOT NULL DEFAULT 0.0,
  moving_time INTEGER NOT NULL DEFAULT 0,
  elapsed_time INTEGER NOT NULL DEFAULT 0,
  elevation_gain NUMERIC NOT NULL DEFAULT 0.0,
  average_speed NUMERIC,
  max_speed NUMERIC,
  average_cadence NUMERIC,
  average_heartrate NUMERIC,
  max_heartrate NUMERIC,
  average_temp NUMERIC,
  calories NUMERIC,
  suffer_score INTEGER,
  commute BOOLEAN DEFAULT false,
  trainer BOOLEAN DEFAULT false,
  photo_count INTEGER,
  achievement_count INTEGER,
  kudos_count INTEGER,
  comment_count INTEGER,
  device_name TEXT,
  workout_type TEXT,
  gear_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_runner FOREIGN KEY (runner_id) REFERENCES public.runners(id) ON DELETE CASCADE
);

-- Create index on runner_id and activity_date for efficient queries
CREATE INDEX IF NOT EXISTS idx_strava_activities_runner_date ON public.strava_activities(runner_id, activity_date DESC);

-- Create index on strava_activity_id for lookups
CREATE INDEX IF NOT EXISTS idx_strava_activities_strava_id ON public.strava_activities(strava_activity_id);

-- Enable RLS
ALTER TABLE public.strava_activities ENABLE ROW LEVEL SECURITY;

-- RLS policies matching daily_activities
CREATE POLICY "Users can view activities based on privacy settings"
  ON public.strava_activities
  FOR SELECT
  USING (
    -- Own activities
    (EXISTS (
      SELECT 1 FROM runners
      WHERE runners.id = strava_activities.runner_id
      AND runners.user_id = auth.uid()
    ))
    OR
    -- Public activities
    (EXISTS (
      SELECT 1 FROM user_settings
      WHERE user_settings.runner_id = strava_activities.runner_id
      AND user_settings.activity_sharing_mode = 'public'
    ))
    OR
    -- Followers activities (if activity_sharing_mode is 'followers')
    (
      (EXISTS (
        SELECT 1 FROM user_settings
        WHERE user_settings.runner_id = strava_activities.runner_id
        AND user_settings.activity_sharing_mode = 'followers'
      ))
      AND
      (EXISTS (
        SELECT 1 FROM user_follows
        JOIN runners ON runners.id = user_follows.follower_id
        WHERE user_follows.following_id = strava_activities.runner_id
        AND runners.user_id = auth.uid()
      ))
    )
    OR
    -- No privacy settings (default to public)
    (NOT EXISTS (
      SELECT 1 FROM user_settings
      WHERE user_settings.runner_id = strava_activities.runner_id
    ))
  );

CREATE POLICY "Users can insert own activities"
  ON public.strava_activities
  FOR INSERT
  WITH CHECK (
    (SELECT runners.user_id FROM runners WHERE runners.id = strava_activities.runner_id) = auth.uid()
  );

CREATE POLICY "Users can update own activities"
  ON public.strava_activities
  FOR UPDATE
  USING (
    (SELECT runners.user_id FROM runners WHERE runners.id = strava_activities.runner_id) = auth.uid()
  );