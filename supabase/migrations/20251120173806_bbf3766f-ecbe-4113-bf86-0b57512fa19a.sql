-- Update the initialize_runner_best_efforts function to include all 14 standard distances
CREATE OR REPLACE FUNCTION public.initialize_runner_best_efforts(p_runner_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_distance INTEGER;
  -- All 14 standard distances in meters
  v_standard_distances INTEGER[] := ARRAY[400, 800, 1000, 1609, 3219, 5000, 10000, 15000, 16093, 20000, 21097, 30000, 42195, 50000];
BEGIN
  -- For each standard distance, ensure at least one entry exists (even if estimated)
  FOREACH v_distance IN ARRAY v_standard_distances
  LOOP
    -- Only insert if no entry exists for this distance
    IF NOT EXISTS (
      SELECT 1 FROM best_efforts 
      WHERE runner_id = p_runner_id 
      AND distance = v_distance
    ) THEN
      -- Insert a placeholder estimated entry
      INSERT INTO best_efforts (
        runner_id,
        distance,
        elapsed_time,
        moving_time,
        is_estimated,
        is_current_pr
      ) VALUES (
        p_runner_id,
        v_distance,
        0, -- will be calculated/updated later
        0,
        true,
        true
      );
    END IF;
  END LOOP;
END;
$$;

-- Backfill: Initialize best efforts for all existing runners with new distances
DO $$
DECLARE
  v_runner RECORD;
BEGIN
  FOR v_runner IN SELECT id FROM runners
  LOOP
    PERFORM public.initialize_runner_best_efforts(v_runner.id);
  END LOOP;
END;
$$;