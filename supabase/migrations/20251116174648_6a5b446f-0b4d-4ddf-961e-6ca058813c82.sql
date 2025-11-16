-- Add heart rate and additional Strava fields to daily_activities
ALTER TABLE daily_activities
ADD COLUMN IF NOT EXISTS average_heartrate numeric,
ADD COLUMN IF NOT EXISTS max_heartrate numeric,
ADD COLUMN IF NOT EXISTS average_cadence numeric,
ADD COLUMN IF NOT EXISTS average_speed numeric,
ADD COLUMN IF NOT EXISTS max_speed numeric,
ADD COLUMN IF NOT EXISTS calories numeric,
ADD COLUMN IF NOT EXISTS suffer_score integer,
ADD COLUMN IF NOT EXISTS achievement_count integer,
ADD COLUMN IF NOT EXISTS kudos_count integer,
ADD COLUMN IF NOT EXISTS comment_count integer,
ADD COLUMN IF NOT EXISTS photo_count integer,
ADD COLUMN IF NOT EXISTS trainer boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS commute boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS device_names jsonb,
ADD COLUMN IF NOT EXISTS workout_types jsonb,
ADD COLUMN IF NOT EXISTS gear_ids jsonb;