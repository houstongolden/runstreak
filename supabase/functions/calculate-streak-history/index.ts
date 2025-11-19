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

    // Get runner
    const { data: runner, error: runnerError } = await supabaseClient
      .from('runners')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (runnerError || !runner) {
      return new Response(JSON.stringify({ error: 'Runner not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Calculating streak history for runner ${runner.id}`);

    // Get all activities with 1+ miles
    const { data: activities, error: activitiesError } = await supabaseClient
      .from('daily_activities')
      .select('activity_date, distance')
      .eq('runner_id', runner.id)
      .gte('distance', 1.0)
      .order('activity_date', { ascending: true });

    if (activitiesError) {
      throw activitiesError;
    }

    if (!activities || activities.length === 0) {
      console.log('No activities found');
      return new Response(JSON.stringify({ 
        success: true,
        message: 'No activities to calculate streaks from'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Identify all streaks (5+ consecutive days)
    const streaks: Array<{
      runner_id: string;
      start_date: string;
      end_date: string;
      days_count: number;
      total_miles: number;
      total_runs: number;
      average_miles_per_day: number;
    }> = [];

    let currentStreak: {
      start_date: string;
      dates: Set<string>;
      total_miles: number;
      total_runs: number;
    } | null = null;

    const getDaysDiff = (date1: string, date2: string): number => {
      const d1 = new Date(date1);
      const d2 = new Date(date2);
      return Math.floor((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
    };

    for (let i = 0; i < activities.length; i++) {
      const activity = activities[i];
      const activityDate = activity.activity_date;

      if (!currentStreak) {
        // Start a new streak
        currentStreak = {
          start_date: activityDate,
          dates: new Set([activityDate]),
          total_miles: activity.distance,
          total_runs: 1,
        };
      } else {
        const lastDate = Array.from(currentStreak.dates).pop()!;
        const daysDiff = getDaysDiff(activityDate, lastDate);

        if (daysDiff === 1) {
          // Consecutive day - continue streak
          currentStreak.dates.add(activityDate);
          currentStreak.total_miles += activity.distance;
          currentStreak.total_runs += 1;
        } else if (daysDiff > 1) {
          // Gap found - end current streak if it's 5+ days
          if (currentStreak.dates.size >= 5) {
            const dates = Array.from(currentStreak.dates).sort();
            streaks.push({
              runner_id: runner.id,
              start_date: dates[0],
              end_date: dates[dates.length - 1],
              days_count: currentStreak.dates.size,
              total_miles: currentStreak.total_miles,
              total_runs: currentStreak.total_runs,
              average_miles_per_day: currentStreak.total_miles / currentStreak.dates.size,
            });
          }

          // Start new streak
          currentStreak = {
            start_date: activityDate,
            dates: new Set([activityDate]),
            total_miles: activity.distance,
            total_runs: 1,
          };
        }
        // If daysDiff === 0, same day activity - just add to total
        else if (daysDiff === 0) {
          currentStreak.total_miles += activity.distance;
          currentStreak.total_runs += 1;
        }
      }
    }

    // Check final streak
    if (currentStreak && currentStreak.dates.size >= 5) {
      const dates = Array.from(currentStreak.dates).sort();
      streaks.push({
        runner_id: runner.id,
        start_date: dates[0],
        end_date: dates[dates.length - 1],
        days_count: currentStreak.dates.size,
        total_miles: currentStreak.total_miles,
        total_runs: currentStreak.total_runs,
        average_miles_per_day: currentStreak.total_miles / currentStreak.dates.size,
      });
    }

    console.log(`Found ${streaks.length} streaks of 5+ days`);

    // Delete existing streak history for this runner
    await supabaseClient
      .from('streak_history')
      .delete()
      .eq('runner_id', runner.id);

    // Insert new streaks
    if (streaks.length > 0) {
      const { error: insertError } = await supabaseClient
        .from('streak_history')
        .insert(streaks);

      if (insertError) {
        throw insertError;
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      streaks_count: streaks.length,
      message: 'Streak history calculated successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error calculating streak history:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
