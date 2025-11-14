-- Create phone verification codes table
CREATE TABLE public.phone_verification_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT NOT NULL,
  code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '10 minutes'),
  verified BOOLEAN NOT NULL DEFAULT false
);

-- Add index for faster lookups
CREATE INDEX idx_phone_verification_codes_phone ON public.phone_verification_codes(phone_number);
CREATE INDEX idx_phone_verification_codes_expires ON public.phone_verification_codes(expires_at);

-- Enable RLS
ALTER TABLE public.phone_verification_codes ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Allow public insert to phone_verification_codes" 
ON public.phone_verification_codes 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public read access to phone_verification_codes" 
ON public.phone_verification_codes 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public update to phone_verification_codes" 
ON public.phone_verification_codes 
FOR UPDATE 
USING (true);