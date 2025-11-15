-- Step 1: Add user_id column to runners table
ALTER TABLE public.runners 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 2: Create index for performance
CREATE INDEX IF NOT EXISTS idx_runners_user_id ON public.runners(user_id);

-- Step 3: Drop overly permissive public policies on runners
DROP POLICY IF EXISTS "Allow public insert to runners" ON public.runners;
DROP POLICY IF EXISTS "Allow public update to runners" ON public.runners;
DROP POLICY IF EXISTS "Allow public read access to runners" ON public.runners;

-- Step 4: Create proper authenticated policies for runners table
CREATE POLICY "Users can view all runners"
ON public.runners FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update own runner profile"
ON public.runners FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Step 5: Drop overly permissive policies on other tables
DROP POLICY IF EXISTS "Allow public insert to daily_activities" ON public.daily_activities;
DROP POLICY IF EXISTS "Allow public update to daily_activities" ON public.daily_activities;
DROP POLICY IF EXISTS "Allow public read access to daily_activities" ON public.daily_activities;

DROP POLICY IF EXISTS "Allow public insert to best_efforts" ON public.best_efforts;
DROP POLICY IF EXISTS "Allow public update to best_efforts" ON public.best_efforts;
DROP POLICY IF EXISTS "Allow public read access to best_efforts" ON public.best_efforts;

DROP POLICY IF EXISTS "Allow public insert to user_settings" ON public.user_settings;
DROP POLICY IF EXISTS "Allow public update to user_settings" ON public.user_settings;
DROP POLICY IF EXISTS "Allow public read access to user_settings" ON public.user_settings;

DROP POLICY IF EXISTS "Allow public insert to coach_messages" ON public.coach_messages;
DROP POLICY IF EXISTS "Allow public read access to coach_messages" ON public.coach_messages;

DROP POLICY IF EXISTS "Allow public insert to activity_status" ON public.activity_status;
DROP POLICY IF EXISTS "Allow public update to activity_status" ON public.activity_status;

DROP POLICY IF EXISTS "Allow public read access to phone_verification_codes" ON public.phone_verification_codes;

-- Step 6: Create proper policies for daily_activities
CREATE POLICY "Users can view all activities"
ON public.daily_activities FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert own activities"
ON public.daily_activities FOR INSERT
TO authenticated
WITH CHECK ((SELECT user_id FROM public.runners WHERE id = runner_id) = auth.uid());

CREATE POLICY "Users can update own activities"
ON public.daily_activities FOR UPDATE
TO authenticated
USING ((SELECT user_id FROM public.runners WHERE id = runner_id) = auth.uid());

-- Step 7: Create proper policies for best_efforts
CREATE POLICY "Users can view all best efforts"
ON public.best_efforts FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert own best efforts"
ON public.best_efforts FOR INSERT
TO authenticated
WITH CHECK ((SELECT user_id FROM public.runners WHERE id = runner_id) = auth.uid());

CREATE POLICY "Users can update own best efforts"
ON public.best_efforts FOR UPDATE
TO authenticated
USING ((SELECT user_id FROM public.runners WHERE id = runner_id) = auth.uid());

-- Step 8: Create proper policies for user_settings
CREATE POLICY "Users can view own settings"
ON public.user_settings FOR SELECT
TO authenticated
USING ((SELECT user_id FROM public.runners WHERE id = runner_id) = auth.uid());

CREATE POLICY "Users can insert own settings"
ON public.user_settings FOR INSERT
TO authenticated
WITH CHECK ((SELECT user_id FROM public.runners WHERE id = runner_id) = auth.uid());

CREATE POLICY "Users can update own settings"
ON public.user_settings FOR UPDATE
TO authenticated
USING ((SELECT user_id FROM public.runners WHERE id = runner_id) = auth.uid());

-- Step 9: Create proper policies for coach_messages
CREATE POLICY "Users can view own coach messages"
ON public.coach_messages FOR SELECT
TO authenticated
USING ((SELECT user_id FROM public.runners WHERE id = runner_id) = auth.uid());

CREATE POLICY "Users can insert own coach messages"
ON public.coach_messages FOR INSERT
TO authenticated
WITH CHECK ((SELECT user_id FROM public.runners WHERE id = runner_id) = auth.uid());

-- Step 10: Create proper policies for activity_status
CREATE POLICY "Users can view all activity statuses"
ON public.activity_status FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert own activity status"
ON public.activity_status FOR INSERT
TO authenticated
WITH CHECK ((SELECT user_id FROM public.runners WHERE id = runner_id) = auth.uid());

CREATE POLICY "Users can update own activity status"
ON public.activity_status FOR UPDATE
TO authenticated
USING ((SELECT user_id FROM public.runners WHERE id = runner_id) = auth.uid());