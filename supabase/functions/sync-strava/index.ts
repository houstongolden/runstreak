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
    const { runnerId } = await req.json();

    if (!runnerId) {
      throw new Error('Runner ID is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get runner's current tokens
    const { data: runner, error: runnerError } = await supabase
      .from('runners')
      .select('*')
      .eq('id', runnerId)
      .single();

    if (runnerError || !runner) {
      throw new Error('Runner not found');
    }

    let accessToken = runner.strava_access_token;
    let refreshToken = runner.strava_refresh_token;

    // Check if token needs refresh
    const tokenExpiresAt = new Date(runner.token_expires_at);
    if (tokenExpiresAt <= new Date()) {
      console.log('Refreshing access token...');
      const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: Deno.env.get('STRAVA_CLIENT_ID'),
          client_secret: Deno.env.get('STRAVA_CLIENT_SECRET'),
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to refresh token');
      }

      const tokenData = await tokenResponse.json();
      accessToken = tokenData.access_token;
      refreshToken = tokenData.refresh_token;

      await supabase
        .from('runners')
        .update({
          strava_access_token: accessToken,
          strava_refresh_token: refreshToken,
          token_expires_at: new Date(tokenData.expires_at * 1000).toISOString(),
        })
        .eq('id', runnerId);
    }

    // Fetch athlete stats
    const statsResponse = await fetch('https://www.strava.com/api/v3/athletes/' + runner.strava_user_id + '/stats', {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    if (!statsResponse.ok) {
      throw new Error('Failed to fetch athlete stats');
    }

    const stats = await statsResponse.json();

    // Fetch all activities for streak calculation
    let allActivities: any[] = [];
    let page = 1;
    const perPage = 200;
    
    while (true) {
      const activitiesResponse = await fetch(
        `https://www.strava.com/api/v3/athlete/activities?per_page=${perPage}&page=${page}`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );

      if (!activitiesResponse.ok) break;
      
      const activities = await activitiesResponse.json();
      if (activities.length === 0) break;
      
      allActivities = allActivities.concat(activities.filter((a: any) => a.type === 'Run'));
      
      if (activities.length < perPage) break;
      page++;
    }

    // Calculate streaks
    const sortedActivities = allActivities
      .sort((a: any, b: any) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());

    let currentStreakDays = 0;
    let currentStreakMiles = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let lastDate: Date | null = null;
    let streakStartDate: Date | null = null;
    const activityDates = new Set<string>();

    for (const activity of sortedActivities) {
      const activityDate = new Date(activity.start_date);
      activityDate.setHours(0, 0, 0, 0);
      const dateStr = activityDate.toISOString().split('T')[0];
      activityDates.add(dateStr);
    }

    const sortedDates = Array.from(activityDates).sort().reverse();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < sortedDates.length; i++) {
      const dateStr = sortedDates[i];
      const date = new Date(dateStr);
      
      if (i === 0) {
        const daysDiff = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff > 1) break;
        
        tempStreak = 1;
        if (!streakStartDate) streakStartDate = date;
        lastDate = date;
      } else {
        const prevDate = new Date(sortedDates[i - 1]);
        const daysDiff = Math.floor((prevDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
          tempStreak++;
          if (!streakStartDate) streakStartDate = date;
          lastDate = date;
        } else {
          break;
        }
      }
    }

    currentStreakDays = tempStreak;
    longestStreak = Math.max(runner.longest_streak_ever || 0, currentStreakDays);

    // Calculate current streak miles
    if (streakStartDate && lastDate) {
      const streakActivities = sortedActivities.filter((activity: any) => {
        const activityDate = new Date(activity.start_date);
        return activityDate >= streakStartDate! && activityDate <= lastDate!;
      });
      currentStreakMiles = streakActivities.reduce((sum: number, a: any) => sum + (a.distance / 1609.34), 0);
    }

    const avgMilesPerDay = currentStreakDays > 0 ? currentStreakMiles / currentStreakDays : 0;
    const streakStatus = currentStreakDays > 0 ? 'active' : 'broken';
    const lastActivityDate = sortedActivities.length > 0 ? new Date(sortedActivities[0].start_date).toISOString().split('T')[0] : null;

    // Store daily activities
    const dailyActivitiesMap = new Map<string, { distance: number; movingTime: number; elevationGain: number; runCount: number }>();

    for (const activity of allActivities) {
      const dateStr = new Date(activity.start_date).toISOString().split('T')[0];
      const existing = dailyActivitiesMap.get(dateStr) || { distance: 0, movingTime: 0, elevationGain: 0, runCount: 0 };
      
      dailyActivitiesMap.set(dateStr, {
        distance: existing.distance + (activity.distance / 1609.34),
        movingTime: existing.movingTime + activity.moving_time,
        elevationGain: existing.elevationGain + (activity.total_elevation_gain * 3.28084),
        runCount: existing.runCount + 1,
      });
    }

    // Upsert daily activities
    for (const [dateStr, data] of dailyActivitiesMap.entries()) {
      await supabase
        .from('daily_activities')
        .upsert({
          runner_id: runnerId,
          activity_date: dateStr,
          distance: data.distance,
          moving_time: data.movingTime,
          elevation_gain: data.elevationGain,
          run_count: data.runCount,
        }, {
          onConflict: 'runner_id,activity_date'
        });
    }

    // Update runner
    await supabase
      .from('runners')
      .update({
        current_streak_days: currentStreakDays,
        current_streak_miles: currentStreakMiles,
        longest_streak_ever: longestStreak,
        average_miles_per_day: avgMilesPerDay,
        streak_status: streakStatus,
        last_activity_date: lastActivityDate,
        streak_start_date: streakStartDate?.toISOString().split('T')[0],
        ytd_run_count: stats.ytd_run_totals?.count || 0,
        ytd_distance: (stats.ytd_run_totals?.distance || 0) / 1609.34,
        ytd_moving_time: stats.ytd_run_totals?.moving_time || 0,
        ytd_elevation_gain: (stats.ytd_run_totals?.elevation_gain || 0) * 3.28084,
        all_time_run_count: stats.all_run_totals?.count || 0,
        all_time_distance: (stats.all_run_totals?.distance || 0) / 1609.34,
        updated_at: new Date().toISOString(),
      })
      .eq('id', runnerId);

    return new Response(
      JSON.stringify({ success: true, message: 'Strava data synced successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error syncing Strava data:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
