-- Create a table for storing Strava best efforts
CREATE TABLE public.best_efforts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  runner_id UUID NOT NULL,
  distance INTEGER NOT NULL, -- Distance in meters (400, 1000, 1609, 5000, 10000, 21097, 42195)
  elapsed_time INTEGER NOT NULL, -- Time in seconds
  moving_time INTEGER NOT NULL, -- Time in seconds
  start_date TIMESTAMP WITH TIME ZONE,
  activity_id BIGINT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(runner_id, distance)
);

-- Enable Row Level Security
ALTER TABLE public.best_efforts ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow public read access to best_efforts" 
ON public.best_efforts 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert to best_efforts" 
ON public.best_efforts 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update to best_efforts" 
ON public.best_efforts 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_best_efforts_updated_at
BEFORE UPDATE ON public.best_efforts
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();