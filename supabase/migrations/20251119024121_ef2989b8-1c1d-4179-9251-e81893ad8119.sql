-- Add is_estimated field to best_efforts table to track whether effort is estimated from daily data or from actual Strava best_efforts
ALTER TABLE public.best_efforts 
ADD COLUMN is_estimated boolean NOT NULL DEFAULT true;