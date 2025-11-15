-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view all runners" ON public.runners;

-- Create new policy that allows everyone (authenticated and anonymous) to view runners
CREATE POLICY "Anyone can view runners"
ON public.runners
FOR SELECT
TO public
USING (true);