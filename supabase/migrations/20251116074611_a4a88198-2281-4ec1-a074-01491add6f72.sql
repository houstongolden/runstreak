-- Add average_temp column to daily_activities to store weather data from Strava
ALTER TABLE public.daily_activities 
ADD COLUMN IF NOT EXISTS average_temp numeric;