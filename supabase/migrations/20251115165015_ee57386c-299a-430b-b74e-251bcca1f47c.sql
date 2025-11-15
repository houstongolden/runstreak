-- =====================================================
-- SECURITY FIX: Social Features RLS Policies
-- =====================================================
-- Add explicit authentication requirements to social features
-- This prevents unauthenticated users from performing actions

-- Drop existing policies to recreate with explicit authentication
DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.activity_comments;
DROP POLICY IF EXISTS "Authenticated users can give kudos" ON public.activity_kudos;
DROP POLICY IF EXISTS "Authenticated users can create partnership requests" ON public.accountability_partners;
DROP POLICY IF EXISTS "Authenticated users can follow" ON public.user_follows;

-- Activity Comments: Require authentication and ownership
CREATE POLICY "Authenticated users can create comments"
ON public.activity_comments
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.runners
    WHERE runners.id = activity_comments.runner_id
    AND runners.user_id = auth.uid()
  )
);

-- Activity Kudos: Require authentication and ownership
CREATE POLICY "Authenticated users can give kudos"
ON public.activity_kudos
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.runners
    WHERE runners.id = activity_kudos.given_by_runner_id
    AND runners.user_id = auth.uid()
  )
);

-- Accountability Partners: Require authentication and ownership
CREATE POLICY "Authenticated users can create partnership requests"
ON public.accountability_partners
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.runners
    WHERE runners.id = accountability_partners.requester_id
    AND runners.user_id = auth.uid()
  )
);

-- User Follows: Require authentication and ownership
CREATE POLICY "Authenticated users can follow"
ON public.user_follows
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.runners
    WHERE runners.id = user_follows.follower_id
    AND runners.user_id = auth.uid()
  )
);

-- =====================================================
-- SECURITY FIX: Phone Verification Rate Limiting
-- =====================================================
-- Add index for efficient rate limit queries
CREATE INDEX IF NOT EXISTS idx_phone_verification_phone_created 
ON public.phone_verification_codes(phone_number, created_at DESC);

-- Add index for cleanup of expired codes
CREATE INDEX IF NOT EXISTS idx_phone_verification_expires 
ON public.phone_verification_codes(expires_at) 
WHERE verified = false;