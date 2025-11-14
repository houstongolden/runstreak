-- Update RLS policies to allow users to update their own runner profiles
CREATE POLICY "Allow public update to runners" ON public.runners
  FOR UPDATE
  USING (true)
  WITH CHECK (true);