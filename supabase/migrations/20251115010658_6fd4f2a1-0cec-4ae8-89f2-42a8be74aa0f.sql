-- Create activity_kudos table for likes/reactions
CREATE TABLE IF NOT EXISTS public.activity_kudos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_date date NOT NULL,
  runner_id uuid NOT NULL REFERENCES public.runners(id),
  given_by_runner_id uuid NOT NULL REFERENCES public.runners(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(activity_date, runner_id, given_by_runner_id)
);

-- Create activity_status table for AI-generated updates
CREATE TABLE IF NOT EXISTS public.activity_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_date date NOT NULL,
  runner_id uuid NOT NULL REFERENCES public.runners(id),
  status_text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(activity_date, runner_id)
);

-- Enable RLS
ALTER TABLE public.activity_kudos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_status ENABLE ROW LEVEL SECURITY;

-- RLS policies for activity_kudos
CREATE POLICY "Anyone can view kudos"
  ON public.activity_kudos
  FOR SELECT
  USING (true);

CREATE POLICY "Users can give kudos"
  ON public.activity_kudos
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can remove their own kudos"
  ON public.activity_kudos
  FOR DELETE
  USING (true);

-- RLS policies for activity_status
CREATE POLICY "Anyone can view status"
  ON public.activity_status
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to activity_status"
  ON public.activity_status
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to activity_status"
  ON public.activity_status
  FOR UPDATE
  USING (true);

-- Trigger for activity_status updated_at
CREATE TRIGGER update_activity_status_updated_at
  BEFORE UPDATE ON public.activity_status
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();