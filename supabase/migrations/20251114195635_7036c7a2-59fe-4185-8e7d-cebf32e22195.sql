-- Add email column to runners table
ALTER TABLE public.runners 
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS sex text,
ADD COLUMN IF NOT EXISTS weight numeric,
ADD COLUMN IF NOT EXISTS created_at_strava timestamp with time zone,
ADD COLUMN IF NOT EXISTS updated_at_strava timestamp with time zone,
ADD COLUMN IF NOT EXISTS follower_count integer,
ADD COLUMN IF NOT EXISTS friend_count integer,
ADD COLUMN IF NOT EXISTS athlete_type text,
ADD COLUMN IF NOT EXISTS date_preference text,
ADD COLUMN IF NOT EXISTS measurement_preference text,
ADD COLUMN IF NOT EXISTS ftp integer,
ADD COLUMN IF NOT EXISTS clubs jsonb,
ADD COLUMN IF NOT EXISTS bikes jsonb,
ADD COLUMN IF NOT EXISTS shoes jsonb;