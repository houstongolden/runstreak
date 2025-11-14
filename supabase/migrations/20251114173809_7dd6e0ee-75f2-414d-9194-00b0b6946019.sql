-- Add AI analysis caching to runners table
ALTER TABLE public.runners 
ADD COLUMN ai_analysis jsonb,
ADD COLUMN ai_analysis_updated_at timestamp with time zone;

-- Add index for faster lookups
CREATE INDEX idx_runners_ai_analysis_updated_at ON public.runners(ai_analysis_updated_at);

-- Add comment
COMMENT ON COLUMN public.runners.ai_analysis IS 'Cached AI-generated performance insights';
COMMENT ON COLUMN public.runners.ai_analysis_updated_at IS 'Timestamp when AI analysis was last generated';