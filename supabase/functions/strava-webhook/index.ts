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
    const verifyToken = Deno.env.get('STRAVA_WEBHOOK_VERIFY_TOKEN');

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

      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Process activity events (create, update, delete)
      if (event.object_type === 'activity') {
        const athleteId = event.owner_id;
        const activityId = event.object_id;

        // Find the runner by Strava user ID
        const { data: runner, error: runnerError } = await supabase
          .from('runners')
          .select('id, current_streak_days, display_name, strava_access_token, timezone')
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

        // Fetch only the specific activity for create/update events
        if (event.aspect_type === 'create' || event.aspect_type === 'update') {
          const previousStreak = runner.current_streak_days || 0;

          // Fire-and-forget background processing
          void (async () => {
            try {
              console.log('Fetching specific activity:', activityId);
              
              // Make 1 API call to fetch only this activity
              const activityResponse = await fetch(
                `https://www.strava.com/api/v3/activities/${activityId}`,
                {
                  headers: {
                    'Authorization': `Bearer ${runner.strava_access_token}`,
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

              console.log('Activity saved to database, recalculating streak');

              // Recalculate streak from database (0 API calls)
              const { error: recalcError } = await supabase.functions.invoke(
                'recalculate-streak',
                {
                  body: { runnerId: runner.id },
                }
              );

              if (recalcError) {
                console.error('Error recalculating streak:', recalcError);
                return;
              }

              console.log('Streak recalculated successfully');

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
        status: 500,
      }
    );
  }
});
