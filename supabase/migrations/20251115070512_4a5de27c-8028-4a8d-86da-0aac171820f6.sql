-- Step 1: Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Step 2: Create user_roles table (CRITICAL: roles must be in separate table)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- Step 3: Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Step 4: Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Step 5: Create policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Only admins can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Step 6: Create function to get admin analytics (instead of view)
CREATE OR REPLACE FUNCTION public.get_admin_analytics()
RETURNS TABLE (
  total_users BIGINT,
  users_last_30_days BIGINT,
  users_last_7_days BIGINT,
  users_today BIGINT,
  total_activities BIGINT,
  activities_last_30_days BIGINT,
  avg_streak_days NUMERIC,
  active_streaks BIGINT,
  total_miles NUMERIC,
  total_coach_messages BIGINT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (SELECT COUNT(DISTINCT id) FROM public.runners),
    (SELECT COUNT(DISTINCT id) FROM public.runners WHERE created_at >= NOW() - INTERVAL '30 days'),
    (SELECT COUNT(DISTINCT id) FROM public.runners WHERE created_at >= NOW() - INTERVAL '7 days'),
    (SELECT COUNT(DISTINCT id) FROM public.runners WHERE created_at >= NOW() - INTERVAL '1 day'),
    (SELECT COUNT(*) FROM public.daily_activities),
    (SELECT COUNT(*) FROM public.daily_activities WHERE activity_date >= NOW() - INTERVAL '30 days'),
    (SELECT AVG(current_streak_days) FROM public.runners WHERE current_streak_days > 0),
    (SELECT COUNT(*) FROM public.runners WHERE streak_status = 'active'),
    (SELECT SUM(distance) FROM public.daily_activities),
    (SELECT COUNT(*) FROM public.coach_messages)
  WHERE public.has_role(auth.uid(), 'admin');
$$;