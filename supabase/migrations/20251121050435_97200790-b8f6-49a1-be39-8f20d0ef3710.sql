-- Add missing fields to strava_activities table (25+ new fields)
ALTER TABLE strava_activities
  -- Activity Classification
  ADD COLUMN IF NOT EXISTS type TEXT,
  ADD COLUMN IF NOT EXISTS sport_type TEXT,
  
  -- Timing
  ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS start_date_local TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS timezone TEXT,
  
  -- Location
  ADD COLUMN IF NOT EXISTS location_city TEXT,
  ADD COLUMN IF NOT EXISTS location_state TEXT,
  ADD COLUMN IF NOT EXISTS location_country TEXT,
  ADD COLUMN IF NOT EXISTS start_latlng TEXT,
  ADD COLUMN IF NOT EXISTS end_latlng TEXT,
  
  -- Elevation Details
  ADD COLUMN IF NOT EXISTS elev_high NUMERIC,
  ADD COLUMN IF NOT EXISTS elev_low NUMERIC,
  
  -- Activity Properties
  ADD COLUMN IF NOT EXISTS has_heartrate BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS manual BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS private BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS visibility TEXT,
  ADD COLUMN IF NOT EXISTS flagged BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS hide_from_home BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS from_accepted_tag BOOLEAN DEFAULT false,
  
  -- IDs & References
  ADD COLUMN IF NOT EXISTS upload_id BIGINT,
  ADD COLUMN IF NOT EXISTS external_id TEXT,
  ADD COLUMN IF NOT EXISTS map_id TEXT,
  ADD COLUMN IF NOT EXISTS summary_polyline TEXT,
  
  -- Stats
  ADD COLUMN IF NOT EXISTS pr_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_photo_count INTEGER,
  
  -- Description (from detail endpoint)
  ADD COLUMN IF NOT EXISTS description TEXT,
  
  -- Power Data (from detail endpoint)
  ADD COLUMN IF NOT EXISTS device_watts BOOLEAN,
  ADD COLUMN IF NOT EXISTS average_watts NUMERIC,
  ADD COLUMN IF NOT EXISTS weighted_average_watts NUMERIC,
  ADD COLUMN IF NOT EXISTS kilojoules NUMERIC,
  ADD COLUMN IF NOT EXISTS max_watts NUMERIC,
  ADD COLUMN IF NOT EXISTS perceived_exertion NUMERIC;

-- Add aggregated location/timing fields to daily_activities
ALTER TABLE daily_activities
  ADD COLUMN IF NOT EXISTS location_cities JSONB,
  ADD COLUMN IF NOT EXISTS location_states JSONB,
  ADD COLUMN IF NOT EXISTS location_countries JSONB,
  ADD COLUMN IF NOT EXISTS timezones JSONB,
  ADD COLUMN IF NOT EXISTS types JSONB,
  ADD COLUMN IF NOT EXISTS sport_types JSONB,
  ADD COLUMN IF NOT EXISTS has_manual BOOLEAN,
  ADD COLUMN IF NOT EXISTS has_private BOOLEAN,
  ADD COLUMN IF NOT EXISTS has_flagged BOOLEAN;

-- Create segment_efforts table for Strava segment data
CREATE TABLE IF NOT EXISTS segment_efforts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  runner_id UUID NOT NULL REFERENCES runners(id) ON DELETE CASCADE,
  strava_activity_id BIGINT NOT NULL,
  segment_id BIGINT NOT NULL,
  segment_name TEXT NOT NULL,
  elapsed_time INTEGER NOT NULL,
  moving_time INTEGER NOT NULL,
  distance NUMERIC NOT NULL,
  pr_rank INTEGER,
  kom_rank INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_segment_efforts_runner ON segment_efforts(runner_id);
CREATE INDEX IF NOT EXISTS idx_segment_efforts_activity ON segment_efforts(strava_activity_id);
CREATE INDEX IF NOT EXISTS idx_segment_efforts_segment ON segment_efforts(segment_id);

-- Create splits table for kilometer/mile splits
CREATE TABLE IF NOT EXISTS splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  runner_id UUID NOT NULL REFERENCES runners(id) ON DELETE CASCADE,
  strava_activity_id BIGINT NOT NULL,
  split_number INTEGER NOT NULL,
  unit TEXT NOT NULL CHECK (unit IN ('metric', 'imperial')),
  distance NUMERIC NOT NULL,
  elapsed_time INTEGER NOT NULL,
  moving_time INTEGER NOT NULL,
  elevation_difference NUMERIC,
  average_speed NUMERIC,
  pace_zone INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_splits_runner ON splits(runner_id);
CREATE INDEX IF NOT EXISTS idx_splits_activity ON splits(strava_activity_id);

-- Enable RLS on new tables
ALTER TABLE segment_efforts ENABLE ROW LEVEL SECURITY;
ALTER TABLE splits ENABLE ROW LEVEL SECURITY;

-- RLS policies for segment_efforts
CREATE POLICY "Users can view segment efforts based on privacy settings"
  ON segment_efforts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM runners WHERE runners.id = segment_efforts.runner_id AND runners.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM user_settings 
      WHERE user_settings.runner_id = segment_efforts.runner_id 
      AND user_settings.activity_sharing_mode = 'public'
    )
    OR (
      EXISTS (
        SELECT 1 FROM user_settings 
        WHERE user_settings.runner_id = segment_efforts.runner_id 
        AND user_settings.activity_sharing_mode = 'followers'
      )
      AND EXISTS (
        SELECT 1 FROM user_follows 
        JOIN runners ON runners.id = user_follows.follower_id
        WHERE user_follows.following_id = segment_efforts.runner_id 
        AND runners.user_id = auth.uid()
      )
    )
    OR NOT EXISTS (
      SELECT 1 FROM user_settings WHERE user_settings.runner_id = segment_efforts.runner_id
    )
  );

CREATE POLICY "Users can insert own segment efforts"
  ON segment_efforts FOR INSERT
  WITH CHECK (
    (SELECT runners.user_id FROM runners WHERE runners.id = segment_efforts.runner_id) = auth.uid()
  );

-- RLS policies for splits
CREATE POLICY "Users can view splits based on privacy settings"
  ON splits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM runners WHERE runners.id = splits.runner_id AND runners.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM user_settings 
      WHERE user_settings.runner_id = splits.runner_id 
      AND user_settings.activity_sharing_mode = 'public'
    )
    OR (
      EXISTS (
        SELECT 1 FROM user_settings 
        WHERE user_settings.runner_id = splits.runner_id 
        AND user_settings.activity_sharing_mode = 'followers'
      )
      AND EXISTS (
        SELECT 1 FROM user_follows 
        JOIN runners ON runners.id = user_follows.follower_id
        WHERE user_follows.following_id = splits.runner_id 
        AND runners.user_id = auth.uid()
      )
    )
    OR NOT EXISTS (
      SELECT 1 FROM user_settings WHERE user_settings.runner_id = splits.runner_id
    )
  );

CREATE POLICY "Users can insert own splits"
  ON splits FOR INSERT
  WITH CHECK (
    (SELECT runners.user_id FROM runners WHERE runners.id = splits.runner_id) = auth.uid()
  );