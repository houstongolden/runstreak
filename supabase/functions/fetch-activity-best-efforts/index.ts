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

    const { strava_activity_id, runner_id } = await req.json();

    if (!strava_activity_id || !runner_id) {
      return new Response(JSON.stringify({ error: 'Missing strava_activity_id or runner_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get API mode from app_settings to determine which credentials to use
    const { data: settingData } = await supabaseClient
      .from('app_settings')
      .select('setting_value')
      .eq('setting_key', 'strava_api_mode')
      .maybeSingle();
    
    const apiMode = (settingData?.setting_value as 'live' | 'test') || 'live';
    const stravaClientId = apiMode === 'test'
      ? Deno.env.get('STRAVA_CLIENT_ID_2')
      : Deno.env.get('STRAVA_CLIENT_ID');
    const stravaClientSecret = apiMode === 'test'
      ? Deno.env.get('STRAVA_CLIENT_SECRET_2')
      : Deno.env.get('STRAVA_CLIENT_SECRET');

    // Verify the runner belongs to the authenticated user
    const { data: runner, error: runnerError } = await supabaseClient
      .from('runners')
      .select('id, strava_access_token, strava_refresh_token, token_expires_at, user_id')
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

    let accessToken = runner.strava_access_token;

    // Check if token needs refresh
    const tokenExpiresAt = new Date(runner.token_expires_at);
    if (tokenExpiresAt <= new Date()) {
      console.log('Refreshing access token...');
      const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: stravaClientId,
          client_secret: stravaClientSecret,
          grant_type: 'refresh_token',
          refresh_token: runner.strava_refresh_token,
        }),
      });

      if (!tokenResponse.ok) {
        return new Response(JSON.stringify({ 
          error: 'Failed to refresh Strava token. Please reconnect your Strava account.' 
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const tokenData = await tokenResponse.json();
      accessToken = tokenData.access_token;

      // Update tokens in database
      await supabaseClient
        .from('runners')
        .update({
          strava_access_token: accessToken,
          strava_refresh_token: tokenData.refresh_token,
          token_expires_at: new Date(tokenData.expires_at * 1000).toISOString(),
        })
        .eq('id', runner_id);
      
      console.log('Access token refreshed successfully');
    }

    console.log(`Extracting best efforts for activity ${strava_activity_id}`);

    // Fetch detailed activity data from Strava API
    const detailResponse = await fetch(
      `https://www.strava.com/api/v3/activities/${strava_activity_id}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!detailResponse.ok) {
      const errorText = await detailResponse.text();
      console.error(`Failed to fetch activity ${strava_activity_id}: ${detailResponse.status} - ${errorText}`);
      
      if (detailResponse.status === 401) {
        return new Response(JSON.stringify({ 
          error: 'Strava authorization expired. Please reconnect your Strava account.' 
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({ 
        error: `Failed to fetch activity from Strava: ${detailResponse.status}` 
      }), {
        status: detailResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const detailData = await detailResponse.json();
    console.log(`Fetched activity ${strava_activity_id} with full details`);

    let updatedCount = 0;

    // Update strava_activities with enriched data
    await supabaseClient
      .from('strava_activities')
      .update({ 
        name: detailData.name || null,
        workout_type: detailData.workout_type?.toString() || null,
        device_name: detailData.device_name || null,
        gear_id: detailData.gear_id || null,
        average_speed: detailData.average_speed || null,
        max_speed: detailData.max_speed || null,
        average_cadence: detailData.average_cadence || null,
        average_heartrate: detailData.average_heartrate || null,
        max_heartrate: detailData.max_heartrate || null,
        average_temp: detailData.average_temp || null,
        calories: detailData.calories || null,
        suffer_score: detailData.suffer_score || null,
        achievement_count: detailData.achievement_count || null,
        kudos_count: detailData.kudos_count || null,
        comment_count: detailData.comment_count || null,
        photo_count: detailData.photo_count || null,
      })
      .eq('strava_activity_id', strava_activity_id)
      .eq('runner_id', runner_id);

    if (detailData.best_efforts && Array.isArray(detailData.best_efforts)) {
      console.log(`Found ${detailData.best_efforts.length} best efforts in activity ${strava_activity_id}`);

      // Process each best effort
      for (const effort of detailData.best_efforts) {
        // Only process standard distances
        if (!STANDARD_DISTANCES.includes(effort.distance)) continue;

        // Check if we already have a current PR for this distance
        const { data: currentPR } = await supabaseClient
          .from('best_efforts')
          .select('*')
          .eq('runner_id', runner_id)
          .eq('distance', effort.distance)
          .eq('is_current_pr', true)
          .single();

        // If new effort is faster than current PR, archive the old one
        if (currentPR && effort.moving_time < currentPR.moving_time) {
          // Mark the old PR as no longer current
          await supabaseClient
            .from('best_efforts')
            .update({ is_current_pr: false })
            .eq('id', currentPR.id);

          // Insert new PR
          await supabaseClient
            .from('best_efforts')
            .insert({
              runner_id: runner_id,
              distance: effort.distance,
              elapsed_time: effort.elapsed_time,
              moving_time: effort.moving_time,
              start_date: effort.start_date,
              is_estimated: false,
              is_current_pr: true,
              strava_activity_id: strava_activity_id,
              achieved_at: new Date().toISOString(),
            });
          console.log(`New PR for ${effort.distance}m! Archived previous best.`);
          updatedCount++;
        } else if (!currentPR) {
          // No current PR exists, insert this as the new PR
          await supabaseClient
            .from('best_efforts')
            .insert({
              runner_id: runner_id,
              distance: effort.distance,
              elapsed_time: effort.elapsed_time,
              moving_time: effort.moving_time,
              start_date: effort.start_date,
              is_estimated: false,
              is_current_pr: true,
              strava_activity_id: strava_activity_id,
              achieved_at: new Date().toISOString(),
            });
          console.log(`Inserted first PR for ${effort.distance}m`);
          updatedCount++;
        } else {
          console.log(`Skipping ${effort.distance}m - current PR is faster`);
        }
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: updatedCount > 0 
        ? `Successfully extracted ${updatedCount} best effort${updatedCount > 1 ? 's' : ''}`
        : `Activity enriched with full details (no new best efforts found)`,
      updated_count: updatedCount,
      activity_id: strava_activity_id
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
