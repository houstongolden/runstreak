-- Create user_settings table for account and AI coach preferences
CREATE TABLE public.user_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  runner_id UUID NOT NULL UNIQUE,
  email TEXT,
  phone_number TEXT,
  phone_verified BOOLEAN DEFAULT false,
  email_verified BOOLEAN DEFAULT false,
  ai_coach_enabled BOOLEAN DEFAULT false,
  ai_coach_frequency TEXT DEFAULT 'daily',
  ai_coach_time TEXT DEFAULT '09:00',
  ai_coach_style TEXT DEFAULT 'motivational',
  free_month_claimed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read user settings (for now - can be restricted later)
CREATE POLICY "Allow public read access to user_settings"
  ON public.user_settings
  FOR SELECT
  USING (true);

-- Allow anyone to insert their settings
CREATE POLICY "Allow public insert to user_settings"
  ON public.user_settings
  FOR INSERT
  WITH CHECK (true);

-- Allow anyone to update their settings
CREATE POLICY "Allow public update to user_settings"
  ON public.user_settings
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();