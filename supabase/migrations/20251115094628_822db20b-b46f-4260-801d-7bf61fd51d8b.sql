-- Fix critical RLS security issues on social features
-- Issue: Comments, kudos, follows, and accountability partners allow anyone to do anything

-- ==========================================
-- FIX ACTIVITY COMMENTS RLS POLICIES
-- ==========================================

DROP POLICY IF EXISTS "Users can create comments" ON activity_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON activity_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON activity_comments;

-- Only authenticated users can create comments as themselves
CREATE POLICY "Authenticated users can create comments"
  ON activity_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT user_id FROM runners WHERE id = activity_comments.runner_id) = auth.uid()
  );

-- Users can only update their own comments
CREATE POLICY "Users can update own comments"
  ON activity_comments FOR UPDATE
  TO authenticated
  USING (
    (SELECT user_id FROM runners WHERE id = activity_comments.runner_id) = auth.uid()
  );

-- Users can only delete their own comments
CREATE POLICY "Users can delete own comments"
  ON activity_comments FOR DELETE
  TO authenticated
  USING (
    (SELECT user_id FROM runners WHERE id = activity_comments.runner_id) = auth.uid()
  );

-- ==========================================
-- FIX ACTIVITY KUDOS RLS POLICIES
-- ==========================================

DROP POLICY IF EXISTS "Users can give kudos" ON activity_kudos;
DROP POLICY IF EXISTS "Users can remove their own kudos" ON activity_kudos;

-- Only authenticated users can give kudos as themselves
CREATE POLICY "Authenticated users can give kudos"
  ON activity_kudos FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT user_id FROM runners WHERE id = activity_kudos.given_by_runner_id) = auth.uid()
  );

-- Users can only remove kudos they gave
CREATE POLICY "Users can remove own kudos"
  ON activity_kudos FOR DELETE
  TO authenticated
  USING (
    (SELECT user_id FROM runners WHERE id = activity_kudos.given_by_runner_id) = auth.uid()
  );

-- ==========================================
-- FIX USER FOLLOWS RLS POLICIES
-- ==========================================

DROP POLICY IF EXISTS "Users can create their own follows" ON user_follows;
DROP POLICY IF EXISTS "Users can delete their own follows" ON user_follows;

-- Only authenticated users can follow as themselves
CREATE POLICY "Authenticated users can follow"
  ON user_follows FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT user_id FROM runners WHERE id = user_follows.follower_id) = auth.uid()
  );

-- Users can only unfollow their own follows
CREATE POLICY "Users can unfollow"
  ON user_follows FOR DELETE
  TO authenticated
  USING (
    (SELECT user_id FROM runners WHERE id = user_follows.follower_id) = auth.uid()
  );

-- ==========================================
-- FIX ACCOUNTABILITY PARTNERS RLS POLICIES
-- ==========================================

DROP POLICY IF EXISTS "Users can create partnership requests" ON accountability_partners;
DROP POLICY IF EXISTS "Users can update partnership requests they're involved in" ON accountability_partners;
DROP POLICY IF EXISTS "Users can view their own partnership requests" ON accountability_partners;

-- Only authenticated users can create partnership requests as themselves
CREATE POLICY "Authenticated users can create partnership requests"
  ON accountability_partners FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT user_id FROM runners WHERE id = accountability_partners.requester_id) = auth.uid()
  );

-- Users can update partnerships they're involved in
CREATE POLICY "Users can update their partnerships"
  ON accountability_partners FOR UPDATE
  TO authenticated
  USING (
    (SELECT user_id FROM runners WHERE id = accountability_partners.requester_id) = auth.uid() OR
    (SELECT user_id FROM runners WHERE id = accountability_partners.partner_id) = auth.uid()
  );

-- Users can view partnerships they're involved in
CREATE POLICY "Users can view their partnerships"
  ON accountability_partners FOR SELECT
  TO authenticated
  USING (
    (SELECT user_id FROM runners WHERE id = accountability_partners.requester_id) = auth.uid() OR
    (SELECT user_id FROM runners WHERE id = accountability_partners.partner_id) = auth.uid()
  );

-- Users can delete partnership requests they created
CREATE POLICY "Users can delete their partnership requests"
  ON accountability_partners FOR DELETE
  TO authenticated
  USING (
    (SELECT user_id FROM runners WHERE id = accountability_partners.requester_id) = auth.uid()
  );

-- ==========================================
-- FIX COACHING SESSIONS RLS POLICIES
-- ==========================================

DROP POLICY IF EXISTS "Users can create their own coaching sessions" ON coaching_sessions;
DROP POLICY IF EXISTS "Users can update their own coaching sessions" ON coaching_sessions;
DROP POLICY IF EXISTS "Users can delete their own coaching sessions" ON coaching_sessions;
DROP POLICY IF EXISTS "Users can view their own coaching sessions" ON coaching_sessions;

-- Only authenticated users can create sessions for themselves
CREATE POLICY "Authenticated users can create sessions"
  ON coaching_sessions FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT user_id FROM runners WHERE id = coaching_sessions.runner_id) = auth.uid()
  );

-- Users can only update their own sessions
CREATE POLICY "Users can update own sessions"
  ON coaching_sessions FOR UPDATE
  TO authenticated
  USING (
    (SELECT user_id FROM runners WHERE id = coaching_sessions.runner_id) = auth.uid()
  );

-- Users can only delete their own sessions
CREATE POLICY "Users can delete own sessions"
  ON coaching_sessions FOR DELETE
  TO authenticated
  USING (
    (SELECT user_id FROM runners WHERE id = coaching_sessions.runner_id) = auth.uid()
  );

-- Users can only view their own sessions
CREATE POLICY "Users can view own sessions"
  ON coaching_sessions FOR SELECT
  TO authenticated
  USING (
    (SELECT user_id FROM runners WHERE id = coaching_sessions.runner_id) = auth.uid()
  );