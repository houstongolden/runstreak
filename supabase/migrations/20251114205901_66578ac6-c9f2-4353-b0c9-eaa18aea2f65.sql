-- Create streak_history table to track all streaks
CREATE TABLE public.streak_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  runner_id UUID NOT NULL REFERENCES public.runners(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_count INTEGER NOT NULL,
  total_miles NUMERIC NOT NULL,
  average_miles_per_day NUMERIC NOT NULL,
  total_runs INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT streak_history_valid_dates CHECK (end_date >= start_date),
  CONSTRAINT streak_history_min_days CHECK (days_count >= 5)
);

-- Enable RLS
ALTER TABLE public.streak_history ENABLE ROW LEVEL SECURITY;

-- RLS Policy - anyone can view streaks
CREATE POLICY "Anyone can view streak history"
  ON public.streak_history FOR SELECT
  USING (true);

-- RLS Policy - system can insert/update streaks
CREATE POLICY "Allow public insert to streak_history"
  ON public.streak_history FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to streak_history"
  ON public.streak_history FOR UPDATE
  USING (true);

-- Create indexes for performance
CREATE INDEX idx_streak_history_runner ON public.streak_history(runner_id);
CREATE INDEX idx_streak_history_dates ON public.streak_history(runner_id, start_date, end_date);
CREATE INDEX idx_streak_history_days ON public.streak_history(runner_id, days_count DESC);

-- Create trigger for updating updated_at
CREATE TRIGGER update_streak_history_updated_at
  BEFORE UPDATE ON public.streak_history
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();