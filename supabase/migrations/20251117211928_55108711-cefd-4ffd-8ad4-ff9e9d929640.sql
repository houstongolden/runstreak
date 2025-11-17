-- Create app_settings table for global configuration
CREATE TABLE IF NOT EXISTS public.app_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Allow admins to read and write settings
CREATE POLICY "Admins can manage app settings"
ON public.app_settings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Insert default setting for ads disabled
INSERT INTO public.app_settings (setting_key, setting_value)
VALUES ('ads_enabled', 'false'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;