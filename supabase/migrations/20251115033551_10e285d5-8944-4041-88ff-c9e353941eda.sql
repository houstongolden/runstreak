-- Add privacy settings to user_settings table
CREATE TYPE public.activity_sharing_mode AS ENUM ('public', 'followers', 'private');

ALTER TABLE public.user_settings
ADD COLUMN activity_sharing_mode activity_sharing_mode DEFAULT 'public',
ADD COLUMN allow_follow_requests boolean DEFAULT true,
ADD COLUMN auto_approve_followers boolean DEFAULT true;