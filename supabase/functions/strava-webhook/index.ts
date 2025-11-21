import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    
    // Initialize Supabase client first
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get API mode from app_settings to determine which credentials to use
    const { data: settingData } = await supabase
      .from('app_settings')
      .select('setting_value')
      .eq('setting_key', 'strava_api_mode')
      .maybeSingle();
    
    const apiMode = (settingData?.setting_value as 'live' | 'test') || 'live';
    
    const verifyToken = apiMode === 'test'
      ? Deno.env.get('STRAVA_WEBHOOK_VERIFY_TOKEN_2')
      : Deno.env.get('STRAVA_WEBHOOK_VERIFY_TOKEN');

    // Handle GET request for webhook verification
    if (req.method === 'GET') {
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');

      console.log('Webhook verification request:', { mode, token, challenge });

      if (mode === 'subscribe' && token === verifyToken) {
        console.log('Webhook verified successfully');
        return new Response(JSON.stringify({ 'hub.challenge': challenge }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      } else {
        console.error('Webhook verification failed');
        return new Response('Forbidden', { status: 403 });
      }
    }

    // Handle POST request for webhook events
    if (req.method === 'POST') {
      const event = await req.json();
      console.log('Received webhook event:', JSON.stringify(event));

      // Process activity events (create, update, delete)
      if (event.object_type === 'activity') {
        const athleteId = event.owner_id;
        const activityId = event.object_id;

        // Find the runner by Strava user ID
        const { data: runner, error: runnerError } = await supabase
          .from('runners')
          .select('id, current_streak_days, display_name, strava_access_token, strava_refresh_token, token_expires_at, timezone')
          .eq('strava_user_id', athleteId)
          .maybeSingle();

        if (runnerError || !runner) {
          console.error('Runner not found:', runnerError);
          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        }

        if (!runner.strava_access_token) {
          console.error('Runner missing Strava access token');
          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        }

        console.log('Processing event for runner:', runner.id, 'Activity ID:', activityId);

        // Handle delete events - remove activity from database
        if (event.aspect_type === 'delete') {
          console.log('Activity deleted, removing from database');
          
          (async () => {
            try {
              // Delete from strava_activities table if it exists there
              const { error: deleteStravaError } = await supabase
                .from('strava_activities')
                .delete()
                .eq('runner_id', runner.id)
                .eq('strava_activity_id', activityId);

              if (deleteStravaError) {
                console.error('Error deleting from strava_activities:', deleteStravaError);
              }

              // Recalculate streak, best efforts, and history after deletion
              await supabase.functions.invoke('recalculate-streak', { body: { runnerId: runner.id } });
              await supabase.functions.invoke('calculate-best-efforts', { body: { runnerId: runner.id } });
              await supabase.functions.invoke('calculate-streak-history', { body: { runnerId: runner.id } });
              
              console.log('Activity deleted and stats recalculated');
            } catch (error) {
              console.error('Error handling delete event:', error);
            }
          })();
        }

        // Handle privacy changes - respect when activities become private
        if (event.aspect_type === 'update' && event.updates?.private) {
          console.log('Activity privacy changed:', event.updates.private);
          
          // If activity is now private, treat it like a delete
          if (event.updates.private === 'true') {
            console.log('Activity made private, removing from database');
            
            (async () => {
              try {
                // Delete from strava_activities table
                const { error: deleteError } = await supabase
                  .from('strava_activities')
                  .delete()
                  .eq('runner_id', runner.id)
                  .eq('strava_activity_id', activityId);

                if (deleteError) {
                  console.error('Error deleting private activity:', deleteError);
                }

                // Recalculate stats after removing private activity
                await supabase.functions.invoke('recalculate-streak', { body: { runnerId: runner.id } });
                await supabase.functions.invoke('calculate-best-efforts', { body: { runnerId: runner.id } });
                await supabase.functions.invoke('calculate-streak-history', { body: { runnerId: runner.id } });
                
                console.log('Private activity removed and stats recalculated');
              } catch (error) {
                console.error('Error handling privacy change:', error);
              }
            })();
            
            // Don't process the activity further
            return new Response(JSON.stringify({ success: true }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            });
          }
        }

        // Fetch only the specific activity for create/update events
        if (event.aspect_type === 'create' || event.aspect_type === 'update') {
          const previousStreak = runner.current_streak_days || 0;

          // Fire-and-forget background processing
          (async () => {
            try {
              // Check if token is expired and refresh if needed
              let accessToken = runner.strava_access_token;
              
              if (runner.token_expires_at) {
                const expiresAt = new Date(runner.token_expires_at).getTime();
                const now = Date.now();
                
                if (now >= expiresAt) {
                  console.log('Access token expired, refreshing...');
                  
                  const refreshResponse = await fetch('https://www.strava.com/oauth/token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      client_id: Deno.env.get('STRAVA_CLIENT_ID'),
                      client_secret: Deno.env.get('STRAVA_CLIENT_SECRET'),
                      refresh_token: runner.strava_refresh_token,
                      grant_type: 'refresh_token',
                    }),
                  });
                  
                  if (refreshResponse.ok) {
                    const refreshData = await refreshResponse.json();
                    accessToken = refreshData.access_token;
                    
                    // Update tokens in database
                    await supabase
                      .from('runners')
                      .update({
                        strava_access_token: refreshData.access_token,
                        strava_refresh_token: refreshData.refresh_token,
                        token_expires_at: new Date(refreshData.expires_at * 1000).toISOString(),
                      })
                      .eq('id', runner.id);
                    
                    console.log('Token refreshed successfully');
                  } else {
                    console.error('Failed to refresh token:', refreshResponse.status);
                    return;
                  }
                }
              }

              console.log('Fetching specific activity:', activityId);
              
              // Make 1 API call to fetch only this activity
              const activityResponse = await fetch(
                `https://www.strava.com/api/v3/activities/${activityId}`,
                {
                  headers: {
                    'Authorization': `Bearer ${accessToken}`,
                  },
                }
              );

              if (!activityResponse.ok) {
                console.error('Failed to fetch activity:', activityResponse.status);
                return;
              }

              const activity = await activityResponse.json();
              console.log('Fetched activity:', activity.id, activity.type, activity.distance);

              // Only process running activities
              if (activity.type !== 'Run') {
                console.log('Activity is not a run, skipping');
                return;
              }

              // Convert UTC to runner's local timezone
              const activityDate = new Date(activity.start_date);
              const timezone = runner.timezone || 'America/Los_Angeles';
              
              // Format date in runner's timezone
              const localDateStr = new Intl.DateTimeFormat('en-CA', {
                timeZone: timezone,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
              }).format(activityDate);

              const distanceInMiles = activity.distance / 1609.34;

              // Store individual activity to strava_activities with ALL fields from detail endpoint
              const { error: stravaActivityError } = await supabase
                .from('strava_activities')
                .upsert({
                  runner_id: runner.id,
                  strava_activity_id: activity.id,
                  activity_date: localDateStr,
                  name: activity.name || null,
                  distance: distanceInMiles,
                  moving_time: activity.moving_time || 0,
                  elapsed_time: activity.elapsed_time || 0,
                  elevation_gain: (activity.total_elevation_gain || 0) * 3.28084, // meters to feet
                  workout_type: activity.workout_type?.toString() || null,
                  device_name: activity.device_name || null,
                  gear_id: activity.gear_id || null,
                  average_speed: activity.average_speed || null,
                  max_speed: activity.max_speed || null,
                  average_cadence: activity.average_cadence || null,
                  average_heartrate: activity.average_heartrate || null,
                  max_heartrate: activity.max_heartrate || null,
                  average_temp: activity.average_temp || null,
                  calories: activity.calories || null,
                  suffer_score: activity.suffer_score || null,
                  achievement_count: activity.achievement_count || null,
                  kudos_count: activity.kudos_count || null,
                  comment_count: activity.comment_count || null,
                  photo_count: activity.photo_count || null,
                  trainer: activity.trainer || false,
                  commute: activity.commute || false,
                  
                  // Activity Classification
                  type: activity.type || null,
                  sport_type: activity.sport_type || null,
                  
                  // Timing
                  start_date: activity.start_date || null,
                  start_date_local: activity.start_date_local || null,
                  timezone: activity.timezone || null,
                  
                  // Location
                  location_city: activity.location_city || null,
                  location_state: activity.location_state || null,
                  location_country: activity.location_country || null,
                  start_latlng: activity.start_latlng ? JSON.stringify(activity.start_latlng) : null,
                  end_latlng: activity.end_latlng ? JSON.stringify(activity.end_latlng) : null,
                  
                  // Elevation Details
                  elev_high: activity.elev_high || null,
                  elev_low: activity.elev_low || null,
                  
                  // Activity Properties
                  has_heartrate: activity.has_heartrate || false,
                  manual: activity.manual || false,
                  private: activity.private || false,
                  visibility: activity.visibility || null,
                  flagged: activity.flagged || false,
                  hide_from_home: activity.hide_from_home || false,
                  from_accepted_tag: activity.from_accepted_tag || false,
                  
                  // IDs & References
                  upload_id: activity.upload_id || null,
                  external_id: activity.external_id || null,
                  map_id: activity.map?.id || null,
                  summary_polyline: activity.map?.summary_polyline || null,
                  
                  // Stats
                  pr_count: activity.pr_count || 0,
                  total_photo_count: activity.total_photo_count || null,
                  
                  // DETAIL ENDPOINT ONLY FIELDS
                  description: activity.description || null,
                  device_watts: activity.device_watts || null,
                  average_watts: activity.average_watts || null,
                  weighted_average_watts: activity.weighted_average_watts || null,
                  kilojoules: activity.kilojoules || null,
                  max_watts: activity.max_watts || null,
                  perceived_exertion: activity.perceived_exertion || null,
                }, {
                  onConflict: 'runner_id,strava_activity_id',
                  ignoreDuplicates: false,
                });

              if (stravaActivityError) {
                console.error('Error storing individual activity to strava_activities:', stravaActivityError);
              } else {
                console.log('Individual activity stored to strava_activities');
              }

              // Store segment efforts
              if (activity.segment_efforts && activity.segment_efforts.length > 0) {
                for (const effort of activity.segment_efforts) {
                  await supabase.from('segment_efforts').upsert({
                    runner_id: runner.id,
                    strava_activity_id: activity.id,
                    segment_id: effort.segment.id,
                    segment_name: effort.segment.name,
                    elapsed_time: effort.elapsed_time,
                    moving_time: effort.moving_time,
                    distance: effort.distance / 1609.34, // meters to miles
                    pr_rank: effort.pr_rank || null,
                    kom_rank: effort.kom_rank || null,
                  }, {
                    onConflict: 'runner_id,strava_activity_id,segment_id',
                    ignoreDuplicates: false,
                  });
                }
                console.log(`Stored ${activity.segment_efforts.length} segment efforts`);
              }

              // Store splits (both metric and imperial)
              if (activity.splits_metric && activity.splits_metric.length > 0) {
                for (let i = 0; i < activity.splits_metric.length; i++) {
                  const split = activity.splits_metric[i];
                  await supabase.from('splits').upsert({
                    runner_id: runner.id,
                    strava_activity_id: activity.id,
                    split_number: i + 1,
                    unit: 'metric',
                    distance: split.distance / 1000, // meters to km
                    elapsed_time: split.elapsed_time,
                    moving_time: split.moving_time,
                    elevation_difference: split.elevation_difference || null,
                    average_speed: split.average_speed || null,
                    pace_zone: split.pace_zone || null,
                  }, {
                    onConflict: 'runner_id,strava_activity_id,split_number,unit',
                    ignoreDuplicates: false,
                  });
                }
                console.log(`Stored ${activity.splits_metric.length} metric splits`);
              }

              if (activity.splits_standard && activity.splits_standard.length > 0) {
                for (let i = 0; i < activity.splits_standard.length; i++) {
                  const split = activity.splits_standard[i];
                  await supabase.from('splits').upsert({
                    runner_id: runner.id,
                    strava_activity_id: activity.id,
                    split_number: i + 1,
                    unit: 'imperial',
                    distance: split.distance / 1609.34, // meters to miles
                    elapsed_time: split.elapsed_time,
                    moving_time: split.moving_time,
                    elevation_difference: split.elevation_difference || null,
                    average_speed: split.average_speed || null,
                    pace_zone: split.pace_zone || null,
                  }, {
                    onConflict: 'runner_id,strava_activity_id,split_number,unit',
                    ignoreDuplicates: false,
                  });
                }
                console.log(`Stored ${activity.splits_standard.length} imperial splits`);
              }

              // Upsert activity into daily_activities
              const { error: upsertError } = await supabase
                .from('daily_activities')
                .upsert({
                  runner_id: runner.id,
                  activity_date: localDateStr,
                  distance: distanceInMiles,
                  moving_time: activity.moving_time,
                  elevation_gain: activity.total_elevation_gain * 3.28084, // meters to feet
                  run_count: 1,
                  average_speed: activity.average_speed,
                  max_speed: activity.max_speed,
                  average_heartrate: activity.average_heartrate,
                  max_heartrate: activity.max_heartrate,
                  average_cadence: activity.average_cadence,
                  calories: activity.calories,
                  suffer_score: activity.suffer_score,
                  average_temp: activity.average_temp,
                  trainer: activity.trainer,
                  commute: activity.commute,
                  updated_at: new Date().toISOString(),
                }, {
                  onConflict: 'runner_id,activity_date',
                  ignoreDuplicates: false,
                });

              if (upsertError) {
                console.error('Error upserting activity:', upsertError);
                return;
              }

              console.log('Activity saved to database, running calculations');

              // Recalculate streak from database (0 API calls)
              const { error: recalcError } = await supabase.functions.invoke(
                'recalculate-streak',
                {
                  body: { runnerId: runner.id },
                }
              );

              if (recalcError) {
                console.error('Error recalculating streak:', recalcError);
              } else {
                console.log('Streak recalculated successfully');
              }

              // Calculate best efforts from database (0 API calls)
              const { error: bestEffortsError } = await supabase.functions.invoke(
                'calculate-best-efforts',
                {
                  body: { runnerId: runner.id },
                }
              );

              if (bestEffortsError) {
                console.error('Error calculating best efforts:', bestEffortsError);
              } else {
                console.log('Best efforts calculated successfully');
              }

              // Calculate streak history from database (0 API calls)
              const { error: historyError } = await supabase.functions.invoke(
                'calculate-streak-history',
                {
                  body: { runnerId: runner.id },
                }
              );

              if (historyError) {
                console.error('Error calculating streak history:', historyError);
              } else {
                console.log('Streak history calculated successfully');
              }

              // Check if streak milestone reached
              const { data: updatedRunner } = await supabase
                .from('runners')
                .select('current_streak_days')
                .eq('id', runner.id)
                .single();

              const newStreak = updatedRunner?.current_streak_days || 0;
              const streakMilestones = [7, 30, 50, 100, 365, 500, 1000];

              // Check if we hit a milestone
              const hitMilestone = streakMilestones.find(
                (milestone) => previousStreak < milestone && newStreak >= milestone
              );

              if (hitMilestone) {
                console.log(`Streak milestone reached: ${hitMilestone} days`);

                // Send congratulations message via AI coach
                const { error: coachError } = await supabase.functions.invoke(
                  'send-coach-message',
                  {
                    body: {
                      runnerId: runner.id,
                      userMessage: `I just reached a ${hitMilestone}-day streak milestone!`,
                      source: 'webhook',
                    },
                  }
                );

                if (coachError) {
                  console.error('Error sending coach message:', coachError);
                }
              }
            } catch (error) {
              console.error('Background activity processing error:', error);
            }
          })();
        }
      }

      // Always return 200 to acknowledge receipt
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    return new Response('Method not allowed', { status: 405 });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  }
});
