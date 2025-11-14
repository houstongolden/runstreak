-- Fix search_path for accountability function
DROP FUNCTION IF EXISTS public.update_accountability_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION public.update_accountability_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER update_accountability_partners_updated_at
  BEFORE UPDATE ON public.accountability_partners
  FOR EACH ROW
  EXECUTE FUNCTION public.update_accountability_updated_at();