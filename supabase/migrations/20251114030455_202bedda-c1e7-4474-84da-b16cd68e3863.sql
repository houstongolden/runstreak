-- Add year-to-date and all-time stats columns to runners table
ALTER TABLE public.runners
ADD COLUMN ytd_run_count integer DEFAULT 0,
ADD COLUMN ytd_distance numeric DEFAULT 0.0,
ADD COLUMN ytd_moving_time integer DEFAULT 0,
ADD COLUMN ytd_elevation_gain numeric DEFAULT 0.0,
ADD COLUMN all_time_run_count integer DEFAULT 0,
ADD COLUMN all_time_distance numeric DEFAULT 0.0;

-- Create a table for daily activities (for the heatmap)
CREATE TABLE public.daily_activities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  runner_id uuid NOT NULL REFERENCES public.runners(id) ON DELETE CASCADE,
  activity_date date NOT NULL,
  distance numeric NOT NULL DEFAULT 0.0,
  moving_time integer NOT NULL DEFAULT 0,
  elevation_gain numeric NOT NULL DEFAULT 0.0,
  run_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(runner_id, activity_date)
);

-- Enable RLS on daily_activities
ALTER TABLE public.daily_activities ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Allow public read access to daily_activities"
ON public.daily_activities
FOR SELECT
USING (true);

-- Create policy for public insert
CREATE POLICY "Allow public insert to daily_activities"
ON public.daily_activities
FOR INSERT
WITH CHECK (true);

-- Create policy for public update
CREATE POLICY "Allow public update to daily_activities"
ON public.daily_activities
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_daily_activities_updated_at
BEFORE UPDATE ON public.daily_activities
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create index for faster queries
CREATE INDEX idx_daily_activities_runner_date ON public.daily_activities(runner_id, activity_date DESC);