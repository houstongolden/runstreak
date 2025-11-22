-- Add unique constraint for strava_activities upsert
ALTER TABLE strava_activities 
ADD CONSTRAINT strava_activities_runner_activity_unique 
UNIQUE (runner_id, strava_activity_id);