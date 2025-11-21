-- Update generate_referral_code to return existing code if found
CREATE OR REPLACE FUNCTION public.generate_referral_code(p_runner_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_code TEXT;
  v_username TEXT;
BEGIN
  -- First check if user already has a referral code
  SELECT referral_code INTO v_code
  FROM referrals
  WHERE referrer_id = p_runner_id
  LIMIT 1;
  
  -- If code exists, return it
  IF v_code IS NOT NULL THEN
    RETURN v_code;
  END IF;
  
  -- Otherwise generate new code from username + UUID
  SELECT COALESCE(username, strava_username) INTO v_username
  FROM runners
  WHERE id = p_runner_id;
  
  v_code := UPPER(LEFT(REGEXP_REPLACE(v_username, '[^a-zA-Z0-9]', '', 'g'), 6)) || 
            UPPER(RIGHT(REPLACE(p_runner_id::text, '-', ''), 4));
  
  RETURN v_code;
END;
$function$;