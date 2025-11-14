-- Add custom username field to runners table
ALTER TABLE public.runners 
ADD COLUMN username text UNIQUE;

-- Create index for username lookups
CREATE INDEX idx_runners_username ON public.runners(username);

-- Add comment
COMMENT ON COLUMN public.runners.username IS 'Custom username for shareable profile URLs';
