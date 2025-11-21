import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get batch size from request or default to 5 users per run
    const { batchSize = 5 } = await req.json().catch(() => ({}));

    console.log(`Processing sync queue (batch size: ${batchSize})...`);

    // Query pending sync jobs, prioritize by priority and next_sync_at
    const { data: queueItems, error: queueError } = await supabase
      .from('sync_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('next_sync_at', new Date().toISOString())
      .order('priority', { ascending: false })
      .order('next_sync_at', { ascending: true })
      .limit(batchSize);

    if (queueError) {
      console.error('Error fetching queue:', queueError);
      throw queueError;
    }

    if (!queueItems || queueItems.length === 0) {
      console.log('No pending sync jobs');
      return new Response(
        JSON.stringify({ message: 'No pending jobs', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${queueItems.length} pending jobs`);

    let processed = 0;
    let failed = 0;

    // Process each queue item
    for (const item of queueItems) {
      try {
        console.log(`Processing runner ${item.runner_id}...`);

        // Mark as processing
        await supabase
          .from('sync_queue')
          .update({ status: 'processing', updated_at: new Date().toISOString() })
          .eq('id', item.id);

        // Calculate the after parameter (oldest synced date as Unix timestamp)
        const afterTimestamp = item.oldest_synced_date
          ? Math.floor(new Date(item.oldest_synced_date).getTime() / 1000)
          : undefined;

        console.log(`Resuming from date: ${item.oldest_synced_date || 'beginning'}`);

        // Invoke sync-strava with resume parameters
        // This will fetch activities BEFORE the oldest_synced_date
        const { data: syncResult, error: syncError } = await supabase.functions.invoke('sync-strava', {
          body: {
            runnerId: item.runner_id,
            beforeTimestamp: afterTimestamp, // Fetch activities before this date
            maxPages: 10, // Fetch 2000 more activities (10 pages * 200)
          }
        });

        if (syncError) {
          throw syncError;
        }

        console.log(`Sync result:`, syncResult);

        // Update queue item
        const newActivitiesSynced = (item.activities_synced || 0) + (syncResult?.activitiesSynced || 0);
        const newOldestDate = syncResult?.oldestActivityDate || item.oldest_synced_date;
        const hasMore = syncResult?.hasMoreActivities || false;

        if (!hasMore || newActivitiesSynced >= (item.total_activities_estimate || 0)) {
          // Sync complete
          await supabase
            .from('sync_queue')
            .update({
              status: 'completed',
              activities_synced: newActivitiesSynced,
              oldest_synced_date: newOldestDate,
              updated_at: new Date().toISOString(),
            })
            .eq('id', item.id);

          console.log(`Sync completed for runner ${item.runner_id}`);
        } else {
          // More to sync, reschedule for next batch
          const nextSyncAt = new Date();
          nextSyncAt.setMinutes(nextSyncAt.getMinutes() + 30); // 30 minutes delay

          await supabase
            .from('sync_queue')
            .update({
              status: 'pending',
              activities_synced: newActivitiesSynced,
              oldest_synced_date: newOldestDate,
              next_sync_at: nextSyncAt.toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', item.id);

          console.log(`Sync continuing for runner ${item.runner_id}, next batch at ${nextSyncAt}`);
        }

        processed++;
      } catch (error: any) {
        console.error(`Error processing runner ${item.runner_id}:`, error);
        failed++;

        // Update with error
        const retryCount = (item.retry_count || 0) + 1;
        const maxRetries = 5;

        if (retryCount >= maxRetries) {
          await supabase
            .from('sync_queue')
            .update({
              status: 'failed',
              error_message: error.message || 'Unknown error',
              retry_count: retryCount,
              updated_at: new Date().toISOString(),
            })
            .eq('id', item.id);
        } else {
          // Retry with exponential backoff
          const nextSyncAt = new Date();
          nextSyncAt.setMinutes(nextSyncAt.getMinutes() + (retryCount * 30));

          await supabase
            .from('sync_queue')
            .update({
              status: 'pending',
              error_message: error.message || 'Unknown error',
              retry_count: retryCount,
              next_sync_at: nextSyncAt.toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', item.id);
        }
      }
    }

    console.log(`Queue processing complete: ${processed} succeeded, ${failed} failed`);

    return new Response(
      JSON.stringify({
        message: 'Queue processing complete',
        processed,
        failed,
        total: queueItems.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in process-sync-queue:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
