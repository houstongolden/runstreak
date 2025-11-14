-- Add profile fields to runners table
ALTER TABLE public.runners
ADD COLUMN IF NOT EXISTS x_profile TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT;