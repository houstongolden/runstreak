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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting daily sync for all runners...');

    // Fetch all runners
    const { data: runners, error: runnersError } = await supabase
      .from('runners')
      .select('id, strava_username');

    if (runnersError) {
      console.error('Error fetching runners:', runnersError);
      throw new Error('Failed to fetch runners');
    }

    if (!runners || runners.length === 0) {
      console.log('No runners found to sync');
      return new Response(
        JSON.stringify({ success: true, message: 'No runners to sync', synced: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log(`Found ${runners.length} runners to sync`);

    let successCount = 0;
    let failureCount = 0;
    const errors: any[] = [];

    // Sync each runner
    for (const runner of runners) {
      try {
        console.log(`Syncing runner: ${runner.strava_username} (${runner.id})`);
        
        const syncResponse = await supabase.functions.invoke('sync-strava', {
          body: { runnerId: runner.id }
        });

        if (syncResponse.error) {
          console.error(`Failed to sync ${runner.strava_username}:`, syncResponse.error);
          failureCount++;
          errors.push({
            runner: runner.strava_username,
            error: syncResponse.error
          });
        } else {
          console.log(`Successfully synced ${runner.strava_username}`);
          successCount++;
        }
      } catch (error) {
        console.error(`Error syncing ${runner.strava_username}:`, error);
        failureCount++;
        errors.push({
          runner: runner.strava_username,
          error: error.message
        });
      }
    }

    console.log(`Sync complete: ${successCount} succeeded, ${failureCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        total: runners.length,
        synced: successCount,
        failed: failureCount,
        errors: errors.length > 0 ? errors : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error in sync-all-runners:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
