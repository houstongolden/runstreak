import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// All 14 standard distances for best efforts (in meters)
const STANDARD_DISTANCES = [
  400,    // 400m
  800,    // 800m
  1000,   // 1km
  1609,   // 1 mile
  3219,   // 2 miles
  5000,   // 5k
  10000,  // 10k
  15000,  // 15k
  16093,  // 10 miles
  20000,  // 20k
  21097,  // Half Marathon
  30000,  // 30k
  42195,  // Marathon
  50000,  // 50k
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { runnerId } = await req.json();

    if (!runnerId) {
      return new Response(JSON.stringify({ error: 'runnerId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Get runner with access token
    const { data: runner, error: runnerError } = await supabaseClient
      .from('runners')
      .select('id, strava_access_token')
      .eq('id', runnerId)
      .single();

    if (runnerError || !runner) {
      return new Response(JSON.stringify({ error: 'Runner not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Calculating best efforts for runner ${runner.id}`);

    // Get all activities with detailed data
    const { data: activities, error: activitiesError } = await supabaseClient
      .from('daily_activities')
      .select('*')
      .eq('runner_id', runner.id)
      .order('activity_date', { ascending: false });

    if (activitiesError) {
      throw activitiesError;
    }

    if (!activities || activities.length === 0) {
      console.log('No activities found');
      return new Response(JSON.stringify({ 
        success: true,
        message: 'No activities to calculate best efforts from'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 1: Calculate estimated best efforts from daily data (0 API calls)
    const estimatedEfforts: Array<{
      runner_id: string;
      distance: number;
      elapsed_time: number;
      moving_time: number;
      start_date: string;
      is_estimated: boolean;
      is_current_pr: boolean;
      strava_activity_id?: number;
    }> = [];

    const topCandidates: Array<{
      distance: number;
      activity: any;
    }> = [];

    for (const distance of STANDARD_DISTANCES) {
      let bestTime = Infinity;
      let bestActivity = null;

      for (const activity of activities) {
        const activityDistanceMeters = activity.distance * 1609.34; // Convert miles to meters
        
        // Only consider activities that meet or exceed this distance
        if (activityDistanceMeters >= distance) {
          // Calculate pace-adjusted time for this distance
          const pacePerMeter = activity.moving_time / activityDistanceMeters;
          const estimatedTime = Math.round(pacePerMeter * distance);
          
          if (estimatedTime < bestTime) {
            bestTime = estimatedTime;
            bestActivity = activity;
          }
        }
      }

      if (bestActivity) {
        estimatedEfforts.push({
          runner_id: runner.id,
          distance: distance,
          elapsed_time: bestTime,
          moving_time: bestTime,
          start_date: bestActivity.activity_date,
          is_estimated: true,
          is_current_pr: true,
        });
        
        // Track top candidates for detailed fetching (max 30)
        if (topCandidates.length < 30) {
          topCandidates.push({
            distance: distance,
            activity: bestActivity,
          });
        }
      }
    }

    console.log(`Calculated ${estimatedEfforts.length} estimated best efforts`);

    // Step 2: Fetch detailed activity data for top 30 candidates (max 30 API calls)
    const accessToken = runner.strava_access_token;
    let actualEffortsCount = 0;

    if (accessToken && topCandidates.length > 0) {
      console.log(`Fetching detailed data for ${topCandidates.length} top candidate activities`);
      
      for (let i = 0; i < Math.min(topCandidates.length, 30); i++) {
        const candidate = topCandidates[i];
        
        // Need to find the Strava activity ID - look for it in the activity data
        // If we don't have it stored, skip this candidate
        if (!candidate.activity.strava_activity_id) {
          console.log(`Skipping candidate for ${candidate.distance}m - no Strava activity ID`);
          continue;
        }

        try {
          const detailResponse = await fetch(
            `https://www.strava.com/api/v3/activities/${candidate.activity.strava_activity_id}`,
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
              },
            }
          );

          if (detailResponse.ok) {
            const detailData = await detailResponse.json();
            
            // Check if this activity has best_efforts data
            if (detailData.best_efforts && Array.isArray(detailData.best_efforts)) {
              // Find the matching distance in best_efforts
              const matchingEffort = detailData.best_efforts.find(
                (effort: any) => effort.distance === candidate.distance
              );

              if (matchingEffort) {
                // Update the estimated effort with actual data
                const effortIndex = estimatedEfforts.findIndex(
                  e => e.distance === candidate.distance
                );
                
                if (effortIndex !== -1) {
                  estimatedEfforts[effortIndex] = {
                    runner_id: runner.id,
                    distance: candidate.distance,
                    elapsed_time: matchingEffort.elapsed_time,
                    moving_time: matchingEffort.moving_time,
                    start_date: candidate.activity.activity_date,
                    is_estimated: false,
                    is_current_pr: true,
                    strava_activity_id: candidate.activity.strava_activity_id,
                  };
                  actualEffortsCount++;
                  console.log(`Found actual best effort for ${candidate.distance}m`);
                }
              }
            }
          }
        } catch (error) {
          console.error(`Error fetching detailed activity ${candidate.activity.strava_activity_id}:`, error);
          // Continue with estimated data for this distance
        }
      }
    }

    console.log(`Upgraded ${actualEffortsCount} efforts to actual best efforts`);

    const bestEfforts = estimatedEfforts;

    console.log(`Calculated ${bestEfforts.length} best efforts`);

    // For each best effort, check if we should update or insert
    for (const effort of bestEfforts) {
      // Get current PR for this distance
      const { data: currentPR } = await supabaseClient
        .from('best_efforts')
        .select('*')
        .eq('runner_id', runner.id)
        .eq('distance', effort.distance)
        .eq('is_current_pr', true)
        .single();

      if (currentPR) {
        // If new effort is faster, archive old PR and insert new one
        if (effort.moving_time < currentPR.moving_time) {
          // Mark old PR as not current
          await supabaseClient
            .from('best_efforts')
            .update({ is_current_pr: false })
            .eq('id', currentPR.id);

          // Insert new PR
          await supabaseClient
            .from('best_efforts')
            .insert(effort);
        } else if (effort.is_estimated === false && currentPR.is_estimated === true) {
          // If new effort is actual (not estimated) and old one was estimated, replace it
          await supabaseClient
            .from('best_efforts')
            .update({
              elapsed_time: effort.elapsed_time,
              moving_time: effort.moving_time,
              start_date: effort.start_date,
              is_estimated: false,
              strava_activity_id: effort.strava_activity_id,
            })
            .eq('id', currentPR.id);
        }
      } else {
        // No current PR exists, insert this as new PR
        await supabaseClient
          .from('best_efforts')
          .insert(effort);
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      best_efforts_count: bestEfforts.length,
      message: 'Best efforts calculated successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error calculating best efforts:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
