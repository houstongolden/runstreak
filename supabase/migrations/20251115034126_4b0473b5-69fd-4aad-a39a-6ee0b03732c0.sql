-- Create activity_comments table
CREATE TABLE public.activity_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  runner_id uuid NOT NULL REFERENCES public.runners(id) ON DELETE CASCADE,
  activity_runner_id uuid NOT NULL REFERENCES public.runners(id) ON DELETE CASCADE,
  activity_date date NOT NULL,
  comment_text text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.activity_comments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view comments"
  ON public.activity_comments
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create comments"
  ON public.activity_comments
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own comments"
  ON public.activity_comments
  FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete their own comments"
  ON public.activity_comments
  FOR DELETE
  USING (true);

-- Create index for faster queries
CREATE INDEX idx_activity_comments_activity ON public.activity_comments(activity_runner_id, activity_date);
CREATE INDEX idx_activity_comments_created ON public.activity_comments(created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_activity_comments_updated_at
  BEFORE UPDATE ON public.activity_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();