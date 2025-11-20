-- Drop existing best_efforts table to recreate with better structure
DROP TABLE IF EXISTS public.best_efforts CASCADE;

-- Create comprehensive best_efforts table supporting current and historical PRs
CREATE TABLE public.best_efforts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  runner_id UUID NOT NULL REFERENCES public.runners(id) ON DELETE CASCADE,
  distance INTEGER NOT NULL, -- distance in meters
  elapsed_time INTEGER NOT NULL, -- time in seconds
  moving_time INTEGER NOT NULL, -- time in seconds
  start_date TIMESTAMP WITH TIME ZONE,
  strava_activity_id BIGINT,
  is_estimated BOOLEAN NOT NULL DEFAULT true,
  is_current_pr BOOLEAN NOT NULL DEFAULT false, -- marks if this is the current personal record
  achieved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), -- when this PR was achieved
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(runner_id, distance, start_date) -- prevent duplicate entries for same distance/date
);

-- Enable RLS
ALTER TABLE public.best_efforts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view best efforts based on privacy settings"
ON public.best_efforts
FOR SELECT
USING (
  -- Own data
  (EXISTS (
    SELECT 1 FROM runners 
    WHERE runners.id = best_efforts.runner_id 
    AND runners.user_id = auth.uid()
  ))
  OR
  -- Public profiles
  (EXISTS (
    SELECT 1 FROM user_settings 
    WHERE user_settings.runner_id = best_efforts.runner_id 
    AND user_settings.activity_sharing_mode = 'public'
  ))
  OR
  -- Followers (if activity_sharing_mode is 'followers')
  (
    (EXISTS (
      SELECT 1 FROM user_settings 
      WHERE user_settings.runner_id = best_efforts.runner_id 
      AND user_settings.activity_sharing_mode = 'followers'
    ))
    AND
    (EXISTS (
      SELECT 1 FROM user_follows 
      JOIN runners ON runners.id = user_follows.follower_id
      WHERE user_follows.following_id = best_efforts.runner_id 
      AND runners.user_id = auth.uid()
    ))
  )
  OR
  -- No privacy settings (default public)
  (NOT EXISTS (
    SELECT 1 FROM user_settings 
    WHERE user_settings.runner_id = best_efforts.runner_id
  ))
);

CREATE POLICY "Users can insert own best efforts"
ON public.best_efforts
FOR INSERT
WITH CHECK (
  (SELECT runners.user_id FROM runners WHERE runners.id = best_efforts.runner_id) = auth.uid()
);

CREATE POLICY "Users can update own best efforts"
ON public.best_efforts
FOR UPDATE
USING (
  (SELECT runners.user_id FROM runners WHERE runners.id = best_efforts.runner_id) = auth.uid()
);

-- Create function to initialize best efforts for all standard distances for a runner
CREATE OR REPLACE FUNCTION public.initialize_runner_best_efforts(p_runner_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_distance INTEGER;
  v_standard_distances INTEGER[] := ARRAY[400, 800, 1000, 1609, 5000, 10000, 21097, 42195]; -- 400m, 800m, 1km, 1mi, 5k, 10k, half, full
BEGIN
  -- For each standard distance, ensure at least one entry exists (even if estimated)
  FOREACH v_distance IN ARRAY v_standard_distances
  LOOP
    -- Only insert if no entry exists for this distance
    IF NOT EXISTS (
      SELECT 1 FROM best_efforts 
      WHERE runner_id = p_runner_id 
      AND distance = v_distance
    ) THEN
      -- Insert a placeholder estimated entry
      INSERT INTO best_efforts (
        runner_id,
        distance,
        elapsed_time,
        moving_time,
        is_estimated,
        is_current_pr
      ) VALUES (
        p_runner_id,
        v_distance,
        0, -- will be calculated/updated later
        0,
        true,
        true
      );
    END IF;
  END LOOP;
END;
$$;

-- Create trigger to initialize best efforts when a new runner is created
CREATE OR REPLACE FUNCTION public.handle_new_runner_best_efforts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.initialize_runner_best_efforts(NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_runner_created_initialize_best_efforts
  AFTER INSERT ON public.runners
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_runner_best_efforts();

-- Backfill: Initialize best efforts for all existing runners
DO $$
DECLARE
  v_runner RECORD;
BEGIN
  FOR v_runner IN SELECT id FROM runners
  LOOP
    PERFORM public.initialize_runner_best_efforts(v_runner.id);
  END LOOP;
END;
$$;