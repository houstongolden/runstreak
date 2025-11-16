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

        // Find the runner by Strava user ID
        const { data: runner, error: runnerError } = await supabase
          .from('runners')
          .select('id, current_streak_days, display_name')
          .eq('strava_user_id', athleteId)
          .maybeSingle();

        if (runnerError || !runner) {
          console.error('Runner not found:', runnerError);
          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        }

        console.log('Processing event for runner:', runner.id);

        // Trigger sync in the background for create/update events
        if (event.aspect_type === 'create' || event.aspect_type === 'update') {
          const previousStreak = runner.current_streak_days || 0;

          // Use background task to sync without blocking response
          EdgeRuntime.waitUntil(
            (async () => {
              try {
                console.log('Triggering sync-strava for runner:', runner.id);
                
                const { data: syncData, error: syncError } = await supabase.functions.invoke(
                  'sync-strava',
                  {
                    body: { runnerId: runner.id },
                  }
                );

                if (syncError) {
                  console.error('Error syncing runner:', syncError);
                  return;
                }

                console.log('Sync completed successfully:', syncData);

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
                console.error('Background sync error:', error);
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
