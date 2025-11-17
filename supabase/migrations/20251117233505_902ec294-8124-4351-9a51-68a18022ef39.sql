-- Add user_email column to user_settings for user-provided email separate from Strava email
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS user_email text;

-- Add comment to clarify the distinction
COMMENT ON COLUMN user_settings.email IS 'Strava email or placeholder email from OAuth';
COMMENT ON COLUMN user_settings.user_email IS 'User-provided email for authentication and notifications';