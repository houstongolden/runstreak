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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
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

    // Get all daily activities sorted by date descending
    const { data: activities, error: activitiesError } = await supabaseClient
      .from('daily_activities')
      .select('*')
      .eq('runner_id', runner.id)
      .gte('distance', 1.0) // Only activities with at least 1 mile
      .order('activity_date', { ascending: false });

    if (activitiesError) {
      throw activitiesError;
    }

    const timezone = runner.timezone || 'America/New_York';
    
    const getDateInTimezone = (date: Date, tz: string): Date => {
      const dateStr = date.toLocaleString('en-US', { timeZone: tz });
      return new Date(dateStr);
    };

    const getTodayInTimezone = (tz: string): Date => {
      const now = new Date();
      const todayStr = now.toLocaleString('en-US', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' });
      const [month, day, year] = todayStr.split('/');
      return new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), 0, 0, 0, 0));
    };

    if (!activities || activities.length === 0) {
      await supabaseClient
        .from('runners')
        .update({
          current_streak_days: 0,
          current_streak_miles: 0,
          streak_start_date: null,
          streak_status: 'broken',
          updated_at: new Date().toISOString(),
        })
        .eq('id', runner.id);

      return new Response(JSON.stringify({ 
        success: true,
        current_streak_days: 0,
        message: 'No activities found'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate streak
    let currentStreakDays = 0;
    let streakStartDate: Date | null = null;
    let currentStreakMiles = 0;

    const todayInTZ = getTodayInTimezone(timezone);
    todayInTZ.setHours(0, 0, 0, 0);

    // Count consecutive days backwards from most recent activity
    for (let i = 0; i < activities.length; i++) {
      const activity = activities[i];
      const activityDate = new Date(activity.activity_date + 'T00:00:00Z');
      
      if (i === 0) {
        // Check if most recent activity is today or yesterday
        const daysDiff = Math.floor((todayInTZ.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff >= 2) {
          // Streak is broken - last activity was 2+ days ago
          break;
        }
        
        currentStreakDays = 1;
        streakStartDate = activityDate;
        currentStreakMiles = activity.distance;
      } else {
        const prevActivity = activities[i - 1];
        const prevDate = new Date(prevActivity.activity_date + 'T00:00:00Z');
        const daysDiff = Math.floor((prevDate.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
          // Consecutive day found
          currentStreakDays++;
          streakStartDate = activityDate;
          currentStreakMiles += activity.distance;
        } else {
          // Gap found, stop counting
          break;
        }
      }
    }

    const longestStreak = Math.max(runner.longest_streak_ever || 0, currentStreakDays);
    const avgMilesPerDay = currentStreakDays > 0 ? currentStreakMiles / currentStreakDays : 0;
    const streakStatus = currentStreakDays > 0 ? 'active' : 'broken';
    const lastActivityDate = activities[0].activity_date;

    // Update runner
    const { error: updateError } = await supabaseClient
      .from('runners')
      .update({
        current_streak_days: currentStreakDays,
        current_streak_miles: currentStreakMiles,
        streak_start_date: streakStartDate?.toISOString().split('T')[0],
        streak_status: streakStatus,
        longest_streak_ever: longestStreak,
        average_miles_per_day: avgMilesPerDay,
        last_activity_date: lastActivityDate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', runner.id);

    if (updateError) {
      throw updateError;
    }

    return new Response(JSON.stringify({ 
      success: true,
      current_streak_days: currentStreakDays,
      current_streak_miles: currentStreakMiles,
      streak_start_date: streakStartDate?.toISOString().split('T')[0],
      message: 'Streak recalculated successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error recalculating streak:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
