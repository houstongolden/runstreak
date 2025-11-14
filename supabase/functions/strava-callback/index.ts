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

    // Upsert runner data
    const { error: upsertError } = await supabase
      .from('runners')
      .upsert({
        strava_user_id: tokenData.athlete.id,
        strava_username: tokenData.athlete.username || `${tokenData.athlete.firstname} ${tokenData.athlete.lastname}`,
        display_name: `${tokenData.athlete.firstname} ${tokenData.athlete.lastname}`,
        avatar_url: tokenData.athlete.profile,
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
      }, {
        onConflict: 'strava_user_id'
      });

    if (upsertError) {
      console.error('Error upserting runner:', upsertError);
      throw upsertError;
    }

    console.log('Runner data saved successfully');

    // Redirect to app
    return new Response(null, {
      status: 302,
      headers: {
        'Location': 'https://runstreak.lovable.app/?strava=success',
      },
    });
  } catch (error) {
    console.error('Error in strava-callback:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(null, {
      status: 302,
      headers: {
        'Location': `https://runstreak.lovable.app/?strava=error&message=${encodeURIComponent(errorMessage)}`,
      },
    });
  }
});
