-- Create messages table for AI coach conversations
CREATE TABLE public.coach_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  runner_id UUID NOT NULL,
  content TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  source TEXT NOT NULL CHECK (source IN ('sms', 'app')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.coach_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow public read access to coach_messages" 
ON public.coach_messages 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert to coach_messages" 
ON public.coach_messages 
FOR INSERT 
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_coach_messages_runner_created ON public.coach_messages(runner_id, created_at DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_coach_messages_updated_at
BEFORE UPDATE ON public.coach_messages
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.coach_messages;