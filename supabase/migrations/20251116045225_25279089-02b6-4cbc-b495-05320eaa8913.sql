-- Add timezone field to runners table
ALTER TABLE public.runners 
ADD COLUMN timezone text;

-- Add comment explaining the field
COMMENT ON COLUMN public.runners.timezone IS 'IANA timezone identifier (e.g., America/New_York) derived from runner location';
