-- Create coaching_sessions table to track chat sessions
CREATE TABLE public.coaching_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  runner_id UUID NOT NULL REFERENCES public.runners(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Coaching Session',
  last_message_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coaching_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own coaching sessions"
  ON public.coaching_sessions FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own coaching sessions"
  ON public.coaching_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own coaching sessions"
  ON public.coaching_sessions FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete their own coaching sessions"
  ON public.coaching_sessions FOR DELETE
  USING (true);

-- Add session_id to coach_messages
ALTER TABLE public.coach_messages
  ADD COLUMN session_id UUID REFERENCES public.coaching_sessions(id) ON DELETE CASCADE;

-- Create indexes
CREATE INDEX idx_coaching_sessions_runner ON public.coaching_sessions(runner_id, last_message_at DESC);
CREATE INDEX idx_coach_messages_session ON public.coach_messages(session_id);

-- Create trigger for updating coaching_sessions updated_at
CREATE TRIGGER update_coaching_sessions_updated_at
  BEFORE UPDATE ON public.coaching_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();