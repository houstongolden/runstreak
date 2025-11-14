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
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    
    if (!code) {
      throw new Error('No authorization code provided');
    }

    const clientId = Deno.env.get('STRAVA_CLIENT_ID');
    const clientSecret = Deno.env.get('STRAVA_CLIENT_SECRET');
    
    if (!clientId || !clientSecret) {
      throw new Error('Strava credentials not configured');
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for tokens');
    }

    const tokenData = await tokenResponse.json();
    console.log('Token exchange successful:', { athlete: tokenData.athlete.id });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch full athlete profile with all details
    const athleteResponse = await fetch(
      `https://www.strava.com/api/v3/athlete`,
      {
        headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
      }
    );

    if (!athleteResponse.ok) {
      throw new Error('Failed to fetch athlete profile');
    }

    const athleteProfile = await athleteResponse.json();
    console.log('Fetched athlete profile:', { id: athleteProfile.id, email: athleteProfile.email });

    // Fetch athlete stats
    const statsResponse = await fetch(
      `https://www.strava.com/api/v3/athletes/${athleteProfile.id}/stats`,
      {
        headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
      }
    );

    let athleteStats = null;
    if (statsResponse.ok) {
      athleteStats = await statsResponse.json();
      console.log('Fetched athlete stats');
    }

    // Fetch athlete activities
    const activitiesResponse = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?per_page=200`,
      {
        headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
      }
    );

    if (!activitiesResponse.ok) {
      throw new Error('Failed to fetch activities');
    }

    const activities = await activitiesResponse.json();
    console.log(`Fetched ${activities.length} activities`);

    // Calculate streak
    const runActivities = activities
      .filter((a: any) => a.type === 'Run')
      .sort((a: any, b: any) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());

    let currentStreakDays = 0;
    let currentStreakMiles = 0;
    let longestStreakEver = 0;
    let streakStartDate = null;
    let lastActivityDate = null;
    let tempStreak = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const activityDates = new Map();
    runActivities.forEach((activity: any) => {
      const date = new Date(activity.start_date);
      date.setHours(0, 0, 0, 0);
      const dateStr = date.toISOString().split('T')[0];
      const miles = (activity.distance * 0.000621371);
      
      if (!activityDates.has(dateStr)) {
        activityDates.set(dateStr, miles);
      } else {
        activityDates.set(dateStr, activityDates.get(dateStr) + miles);
      }
    });

    const sortedDates = Array.from(activityDates.keys()).sort().reverse();
    
    for (let i = 0; i < sortedDates.length; i++) {
      const currentDate = new Date(sortedDates[i]);
      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - i);
      expectedDate.setHours(0, 0, 0, 0);
      
      if (currentDate.getTime() === expectedDate.getTime()) {
        currentStreakDays++;
        currentStreakMiles += activityDates.get(sortedDates[i]);
        if (!streakStartDate) streakStartDate = sortedDates[i];
        lastActivityDate = sortedDates[i];
      } else {
        break;
      }
    }

    // Calculate longest streak
    for (let i = 0; i < sortedDates.length; i++) {
      const currentDate = new Date(sortedDates[i]);
      
      if (i === 0 || new Date(sortedDates[i - 1]).getTime() === currentDate.getTime() + 86400000) {
        tempStreak++;
        longestStreakEver = Math.max(longestStreakEver, tempStreak);
      } else {
        tempStreak = 1;
      }
    }

    const averageMilesPerDay = currentStreakDays > 0 ? currentStreakMiles / currentStreakDays : 0;

    // Calculate Days on Streak metrics (activity regardless of breaks)
    const calculateDaysOnStreak = (daysBack: number) => {
      const cutoffDate = new Date(today);
      cutoffDate.setDate(cutoffDate.getDate() - daysBack);
      return sortedDates.filter(dateStr => {
        const date = new Date(dateStr);
        return date >= cutoffDate && date <= today;
      }).length;
    };

    const daysOnStreak30 = calculateDaysOnStreak(30);
    const daysOnStreak60 = calculateDaysOnStreak(60);
    const daysOnStreak90 = calculateDaysOnStreak(90);

    // Check if this is an existing user to get their join date
    const { data: existingRunner } = await supabase
      .from('runners')
      .select('id, joined_runstreak_at')
      .eq('strava_user_id', athleteProfile.id)
      .maybeSingle();

    const joinedDate = existingRunner?.joined_runstreak_at 
      ? new Date(existingRunner.joined_runstreak_at)
      : new Date(); // New users join today

    joinedDate.setHours(0, 0, 0, 0);
    
    // Calculate days on streak since joining RunStreak
    const daysSinceJoining = Math.floor((today.getTime() - joinedDate.getTime()) / 86400000) + 1;
    const daysOnStreakSinceJoining = sortedDates.filter(dateStr => {
      const date = new Date(dateStr);
      return date >= joinedDate && date <= today;
    }).length;

    // Calculate baseline before joining (average of 90-day periods before join date)
    const daysBeforeJoining = 90; // Use 90 days before joining as baseline
    const baselineStartDate = new Date(joinedDate);
    baselineStartDate.setDate(baselineStartDate.getDate() - daysBeforeJoining);
    
    const daysOnStreakBeforeJoining = sortedDates.filter(dateStr => {
      const date = new Date(dateStr);
      return date >= baselineStartDate && date < joinedDate;
    }).length;

    console.log(`Days on Streak: 30d=${daysOnStreak30}, 60d=${daysOnStreak60}, 90d=${daysOnStreak90}, since joining=${daysOnStreakSinceJoining}/${daysSinceJoining}`);

    // Calculate all historical streaks (5+ days)
    const allStreaks: Array<{
      start_date: string;
      end_date: string;
      days_count: number;
      total_miles: number;
      average_miles_per_day: number;
      total_runs: number;
    }> = [];

    let currentStreakGroup: string[] = [];
    let currentStreakMileage = 0;
    let currentStreakRunCount = 0;

    for (let i = 0; i < sortedDates.length; i++) {
      const currentDate = new Date(sortedDates[i]);
      
      if (i === 0) {
        currentStreakGroup.push(sortedDates[i]);
        currentStreakMileage += activityDates.get(sortedDates[i]);
        currentStreakRunCount++;
      } else {
        const prevDate = new Date(sortedDates[i - 1]);
        const dayDiff = (prevDate.getTime() - currentDate.getTime()) / 86400000;
        
        if (dayDiff === 1) {
          // Consecutive day
          currentStreakGroup.push(sortedDates[i]);
          currentStreakMileage += activityDates.get(sortedDates[i]);
          currentStreakRunCount++;
        } else {
          // Streak broken - save if 5+ days
          if (currentStreakGroup.length >= 5) {
            allStreaks.push({
              start_date: currentStreakGroup[currentStreakGroup.length - 1],
              end_date: currentStreakGroup[0],
              days_count: currentStreakGroup.length,
              total_miles: currentStreakMileage,
              average_miles_per_day: currentStreakMileage / currentStreakGroup.length,
              total_runs: currentStreakRunCount,
            });
          }
          // Start new streak
          currentStreakGroup = [sortedDates[i]];
          currentStreakMileage = activityDates.get(sortedDates[i]);
          currentStreakRunCount = 1;
        }
      }
    }

    // Don't forget the last streak
    if (currentStreakGroup.length >= 5) {
      allStreaks.push({
        start_date: currentStreakGroup[currentStreakGroup.length - 1],
        end_date: currentStreakGroup[0],
        days_count: currentStreakGroup.length,
        total_miles: currentStreakMileage,
        average_miles_per_day: currentStreakMileage / currentStreakGroup.length,
        total_runs: currentStreakRunCount,
      });
    }

    console.log(`Identified ${allStreaks.length} historical streaks (5+ days)`);

    // Prepare comprehensive runner data with all available stats
    const runnerData: any = {
      strava_user_id: athleteProfile.id,
      strava_username: athleteProfile.username || `${athleteProfile.firstname} ${athleteProfile.lastname}`,
      display_name: `${athleteProfile.firstname} ${athleteProfile.lastname}`,
      avatar_url: athleteProfile.profile || athleteProfile.profile_medium,
      email: athleteProfile.email, // Store email from Strava
      sex: athleteProfile.sex,
      weight: athleteProfile.weight,
      city: athleteProfile.city,
      state: athleteProfile.state,
      country: athleteProfile.country,
      created_at_strava: athleteProfile.created_at,
      updated_at_strava: athleteProfile.updated_at,
      follower_count: athleteProfile.follower_count,
      friend_count: athleteProfile.friend_count,
      athlete_type: athleteProfile.athlete_type ? String(athleteProfile.athlete_type) : null,
      date_preference: athleteProfile.date_preference,
      measurement_preference: athleteProfile.measurement_preference,
      ftp: athleteProfile.ftp,
      clubs: athleteProfile.clubs ? JSON.stringify(athleteProfile.clubs) : null,
      bikes: athleteProfile.bikes ? JSON.stringify(athleteProfile.bikes) : null,
      shoes: athleteProfile.shoes ? JSON.stringify(athleteProfile.shoes) : null,
      strava_access_token: tokenData.access_token,
      strava_refresh_token: tokenData.refresh_token,
      token_expires_at: new Date(tokenData.expires_at * 1000).toISOString(),
      current_streak_days: currentStreakDays,
      current_streak_miles: currentStreakMiles,
      streak_start_date: streakStartDate,
      last_activity_date: lastActivityDate,
      longest_streak_ever: longestStreakEver,
      average_miles_per_day: averageMilesPerDay,
      streak_status: currentStreakDays > 0 ? 'active' : 'broken',
      // Stats from Strava API
      ytd_run_count: athleteStats?.ytd_run_totals?.count || 0,
      ytd_distance: athleteStats?.ytd_run_totals?.distance || 0.0,
      ytd_moving_time: athleteStats?.ytd_run_totals?.moving_time || 0,
      ytd_elevation_gain: athleteStats?.ytd_run_totals?.elevation_gain || 0.0,
      all_time_run_count: athleteStats?.all_run_totals?.count || 0,
      all_time_distance: athleteStats?.all_run_totals?.distance || 0.0,
      // Days on Streak metrics (new user-friendly approach)
      days_on_streak_last_30: daysOnStreak30,
      days_on_streak_last_60: daysOnStreak60,
      days_on_streak_last_90: daysOnStreak90,
      days_on_streak_since_joining: daysOnStreakSinceJoining,
      total_days_since_joining: daysSinceJoining,
      days_on_streak_before_joining: daysOnStreakBeforeJoining,
      total_days_before_joining: daysBeforeJoining,
    };

    // Only set joined_runstreak_at for new users
    if (!existingRunner) {
      runnerData.joined_runstreak_at = joinedDate.toISOString();
    }

    // Upsert runner data
    const { data: savedRunner, error: upsertError } = await supabase
      .from('runners')
      .upsert(runnerData, {
        onConflict: 'strava_user_id'
      })
      .select()
      .single();

    if (upsertError) {
      console.error('Error upserting runner:', upsertError);
      throw upsertError;
    }

    console.log('Runner data saved successfully');

    // Save streak history
    if (allStreaks.length > 0) {
      // Delete existing streaks for this runner to avoid duplicates
      const { error: deleteError } = await supabase
        .from('streak_history')
        .delete()
        .eq('runner_id', savedRunner.id);

      if (deleteError) {
        console.error('Error deleting old streak history:', deleteError);
      }

      // Insert all streaks
      const streakRecords = allStreaks.map(streak => ({
        runner_id: savedRunner.id,
        ...streak
      }));

      const { error: streakError } = await supabase
        .from('streak_history')
        .insert(streakRecords);

      if (streakError) {
        console.error('Error saving streak history:', streakError);
      } else {
        console.log(`Saved ${allStreaks.length} streaks to history`);
      }
    }

    // Create or update user_settings with email
    if (athleteProfile.email) {
      const { error: settingsError } = await supabase
        .from('user_settings')
        .upsert({
          runner_id: savedRunner.id,
          email: athleteProfile.email,
          ai_coach_enabled: true,
          ai_coach_style: 'motivational',
          ai_coach_frequency: 'daily',
          ai_coach_time: '09:00'
        }, {
          onConflict: 'runner_id'
        });

      if (settingsError) {
        console.error('Error creating user settings:', settingsError);
      } else {
        console.log('User settings created with email:', athleteProfile.email);
      }
    }

    // Redirect to app with runner ID
    const appUrl = Deno.env.get('VITE_SUPABASE_URL')?.replace('https://pazxdeeuhlwwdxmpmplo.supabase.co', 'https://runstreak.lovable.app') || 'https://runstreak.lovable.app';
    const runnerId = savedRunner?.id || '';
    return new Response(null, {
      status: 302,
      headers: {
        'Location': `${appUrl}/?strava=success&runnerId=${runnerId}`,
      },
    });
  } catch (error) {
    console.error('Error in strava-callback:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const appUrl = Deno.env.get('VITE_SUPABASE_URL')?.replace('https://pazxdeeuhlwwdxmpmplo.supabase.co', 'https://runstreak.lovable.app') || 'https://runstreak.lovable.app';
    return new Response(null, {
      status: 302,
      headers: {
        'Location': `${appUrl}/?strava=error&message=${encodeURIComponent(errorMessage)}`,
      },
    });
  }
});
