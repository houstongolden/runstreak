-- Drop the existing policy that allows all access
DROP POLICY IF EXISTS "Users can view all activities" ON public.daily_activities;

-- Create a new policy that respects privacy settings
CREATE POLICY "Users can view activities based on privacy settings"
ON public.daily_activities
FOR SELECT
USING (
  -- Users can always view their own activities
  EXISTS (
    SELECT 1 FROM public.runners
    WHERE runners.id = daily_activities.runner_id
    AND runners.user_id = auth.uid()
  )
  OR
  -- Activities are visible if sharing mode is public
  EXISTS (
    SELECT 1 FROM public.user_settings
    WHERE user_settings.runner_id = daily_activities.runner_id
    AND user_settings.activity_sharing_mode = 'public'
  )
  OR
  -- Activities are visible if sharing mode is followers and viewer is a follower
  (
    EXISTS (
      SELECT 1 FROM public.user_settings
      WHERE user_settings.runner_id = daily_activities.runner_id
      AND user_settings.activity_sharing_mode = 'followers'
    )
    AND EXISTS (
      SELECT 1 FROM public.user_follows
      JOIN public.runners ON runners.id = user_follows.follower_id
      WHERE user_follows.following_id = daily_activities.runner_id
      AND runners.user_id = auth.uid()
    )
  )
  OR
  -- Default to public if no settings exist (backwards compatibility)
  NOT EXISTS (
    SELECT 1 FROM public.user_settings
    WHERE user_settings.runner_id = daily_activities.runner_id
  )
);

-- Apply the same privacy logic to best_efforts table
DROP POLICY IF EXISTS "Users can view all best efforts" ON public.best_efforts;

CREATE POLICY "Users can view best efforts based on privacy settings"
ON public.best_efforts
FOR SELECT
USING (
  -- Users can always view their own best efforts
  EXISTS (
    SELECT 1 FROM public.runners
    WHERE runners.id = best_efforts.runner_id
    AND runners.user_id = auth.uid()
  )
  OR
  -- Best efforts are visible if sharing mode is public
  EXISTS (
    SELECT 1 FROM public.user_settings
    WHERE user_settings.runner_id = best_efforts.runner_id
    AND user_settings.activity_sharing_mode = 'public'
  )
  OR
  -- Best efforts are visible if sharing mode is followers and viewer is a follower
  (
    EXISTS (
      SELECT 1 FROM public.user_settings
      WHERE user_settings.runner_id = best_efforts.runner_id
      AND user_settings.activity_sharing_mode = 'followers'
    )
    AND EXISTS (
      SELECT 1 FROM public.user_follows
      JOIN public.runners ON runners.id = user_follows.follower_id
      WHERE user_follows.following_id = best_efforts.runner_id
      AND runners.user_id = auth.uid()
    )
  )
  OR
  -- Default to public if no settings exist (backwards compatibility)
  NOT EXISTS (
    SELECT 1 FROM public.user_settings
    WHERE user_settings.runner_id = best_efforts.runner_id
  )
);