import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Standard distances for best efforts (in meters)
const STANDARD_DISTANCES = [
  1609,    // 1 mile
  5000,    // 5k
  10000,   // 10k
  21097,   // Half Marathon
  42195,   // Marathon
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data: { user } } = await supabaseClient.auth.getUser(
      req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
    );
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { activity_date, runner_id } = await req.json();

    if (!activity_date || !runner_id) {
      return new Response(JSON.stringify({ error: 'Missing activity_date or runner_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify the runner belongs to the authenticated user
    const { data: runner, error: runnerError } = await supabaseClient
      .from('runners')
      .select('id, strava_access_token, user_id')
      .eq('id', runner_id)
      .single();

    if (runnerError || !runner) {
      return new Response(JSON.stringify({ error: 'Runner not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (runner.user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized - runner does not belong to user' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check rate limiting: max 10 extractions per day per user
    const today = new Date().toISOString().split('T')[0];
    const { count: extractionsCount, error: countError } = await supabaseClient
      .from('best_efforts')
      .select('id', { count: 'exact', head: true })
      .eq('runner_id', runner_id)
      .eq('is_estimated', false)
      .gte('updated_at', `${today}T00:00:00Z`)
      .lte('updated_at', `${today}T23:59:59Z`);

    if (countError) {
      console.error('Error checking rate limit:', countError);
    }

    const extractionsToday = extractionsCount || 0;
    if (extractionsToday >= 10) {
      return new Response(JSON.stringify({ 
        error: 'Daily limit reached. You can extract best efforts from up to 10 activities per day.' 
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Extracting best efforts for activity on ${activity_date} (${extractionsToday}/10 today)`);

    // Get the daily activity to find Strava activity IDs
    const { data: dailyActivity, error: activityError } = await supabaseClient
      .from('daily_activities')
      .select('*')
      .eq('runner_id', runner_id)
      .eq('activity_date', activity_date)
      .single();

    if (activityError || !dailyActivity) {
      return new Response(JSON.stringify({ error: 'Activity not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch all activities for this date from Strava
    const startOfDay = new Date(activity_date + 'T00:00:00Z');
    const endOfDay = new Date(activity_date + 'T23:59:59Z');

    const activitiesResponse = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?after=${Math.floor(startOfDay.getTime() / 1000)}&before=${Math.floor(endOfDay.getTime() / 1000)}`,
      {
        headers: {
          'Authorization': `Bearer ${runner.strava_access_token}`,
        },
      }
    );

    if (!activitiesResponse.ok) {
      throw new Error(`Strava API error: ${activitiesResponse.statusText}`);
    }

    const activities = await activitiesResponse.json();
    console.log(`Found ${activities.length} activities on ${activity_date}`);

    let updatedCount = 0;

    // For each activity, fetch detailed data and extract best efforts
    for (const activity of activities) {
      if (activity.type !== 'Run') continue;

      const detailResponse = await fetch(
        `https://www.strava.com/api/v3/activities/${activity.id}`,
        {
          headers: {
            'Authorization': `Bearer ${runner.strava_access_token}`,
          },
        }
      );

      if (!detailResponse.ok) {
        console.error(`Failed to fetch activity ${activity.id}`);
        continue;
      }

      const detailData = await detailResponse.json();

      if (detailData.best_efforts && Array.isArray(detailData.best_efforts)) {
        console.log(`Found ${detailData.best_efforts.length} best efforts in activity ${activity.id}`);

        // Process each best effort
        for (const effort of detailData.best_efforts) {
          // Only process standard distances
          if (!STANDARD_DISTANCES.includes(effort.distance)) continue;

          // Check if we already have a better effort for this distance
          const { data: existingEffort } = await supabaseClient
            .from('best_efforts')
            .select('*')
            .eq('runner_id', runner_id)
            .eq('distance', effort.distance)
            .single();

          // If we have an existing effort and it's faster, skip
          if (existingEffort && existingEffort.moving_time <= effort.moving_time) {
            console.log(`Skipping ${effort.distance}m - existing effort is faster`);
            continue;
          }

          // Insert or update the best effort
          const bestEffortData = {
            runner_id: runner_id,
            distance: effort.distance,
            elapsed_time: effort.elapsed_time,
            moving_time: effort.moving_time,
            start_date: effort.start_date,
            is_estimated: false,
            activity_id: activity.id,
          };

          if (existingEffort) {
            await supabaseClient
              .from('best_efforts')
              .update(bestEffortData)
              .eq('id', existingEffort.id);
            console.log(`Updated best effort for ${effort.distance}m`);
          } else {
            await supabaseClient
              .from('best_efforts')
              .insert(bestEffortData);
            console.log(`Inserted new best effort for ${effort.distance}m`);
          }

          updatedCount++;
        }
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: `Successfully extracted ${updatedCount} best efforts`,
      updated_count: updatedCount,
      extractions_today: extractionsToday + 1
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error extracting best efforts:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
