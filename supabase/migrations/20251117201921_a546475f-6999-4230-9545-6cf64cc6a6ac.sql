-- Create table for managing ad spots
CREATE TABLE public.ad_spots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  domain TEXT NOT NULL,
  description TEXT NOT NULL,
  logo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.ad_spots ENABLE ROW LEVEL SECURITY;

-- Anyone can view active ad spots
CREATE POLICY "Anyone can view active ad spots"
ON public.ad_spots
FOR SELECT
USING (is_active = true);

-- Only admins can manage ad spots
CREATE POLICY "Admins can manage ad spots"
ON public.ad_spots
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert initial sponsor data
INSERT INTO public.ad_spots (company_name, domain, description, display_order, is_active) VALUES
('Strava', 'strava.com', 'Track every mile with the #1 app for runners', 1, true),
('On Running', 'on-running.com', 'Swiss engineered running shoes for peak performance', 2, true),
('Nike', 'nike.com', 'Just do it. Performance gear trusted worldwide', 3, true),
('Whoop', 'whoop.com', 'Optimize your training with recovery insights', 4, true),
('Garmin', 'garmin.com', 'Advanced GPS watches for serious athletes', 5, true),
('Hoka', 'hoka.com', 'Maximalist cushioning for comfort and speed', 6, true),
('Brooks', 'brooksrunning.com', 'Run happy with shoes built for runners', 7, true),
('Maurten', 'maurten.com', 'Hydrogel sports fuel used by elite athletes', 8, true),
('Oura Ring', 'ouraring.com', 'Smart ring for sleep and recovery tracking', 9, true),
('Tracksmith', 'tracksmith.com', 'Premium running apparel and community', 10, true);