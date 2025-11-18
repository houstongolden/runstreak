import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { formatInTimeZone } from 'https://esm.sh/date-fns-tz@3.2.0';

// Convert UTC date string to local date string in runner's timezone
function convertToLocalDateStr(utcDateStr: string, timezone: string): string {
  try {
    const utcDate = new Date(utcDateStr);
    return formatInTimeZone(utcDate, timezone, 'yyyy-MM-dd');
  } catch (error) {
    console.error('Error converting date to timezone:', error);
    return utcDateStr.split('T')[0];
  }
}

// Get today's date in runner's timezone as YYYY-MM-DD
function getTodayInTimezone(timezone: string): string {
  return formatInTimeZone(new Date(), timezone, 'yyyy-MM-dd');
}

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
      const errorBody = await athleteResponse.text();
      console.error('Strava API error:', { 
        status: athleteResponse.status, 
        statusText: athleteResponse.statusText,
        body: errorBody 
      });
      throw new Error(`Failed to fetch athlete profile: ${athleteResponse.status} ${errorBody}`);
    }

    const athleteProfile = await athleteResponse.json();
    console.log('Fetched athlete profile:', { id: athleteProfile.id, email: athleteProfile.email });

    // Create or get Supabase auth user
    const userEmail = athleteProfile.email || `strava_${athleteProfile.id}@runstreak.internal`;
    let userId: string;
    
    // Check if user already exists
    const { data: existingUser } = await supabase.auth.admin.listUsers();
    const foundUser = existingUser.users.find(u => u.email === userEmail);
    
    if (foundUser) {
      userId = foundUser.id;
      console.log('Found existing user:', userId);
    } else {
      // Create new auth user
      const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
        email: userEmail,
        email_confirm: true,
        user_metadata: {
          strava_user_id: athleteProfile.id,
          display_name: `${athleteProfile.firstname} ${athleteProfile.lastname}`,
        }
      });
      
      if (createUserError || !newUser.user) {
        console.error('Error creating user:', createUserError);
        throw new Error('Failed to create user account');
      }
      
      userId = newUser.user.id;
      console.log('Created new user:', userId);
    }

    // Download and store avatar in our own storage
    let storedAvatarUrl = athleteProfile.profile || athleteProfile.profile_medium;
    if (storedAvatarUrl) {
      try {
        console.log('Downloading avatar from Strava...');
        const avatarResponse = await fetch(storedAvatarUrl);
        if (avatarResponse.ok) {
          const avatarBlob = await avatarResponse.blob();
          const fileExt = storedAvatarUrl.split('.').pop()?.split('?')[0] || 'jpg';
          const fileName = `${athleteProfile.id}-${Date.now()}.${fileExt}`;
          
          // Upload to our storage bucket
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, avatarBlob, {
              contentType: avatarResponse.headers.get('content-type') || 'image/jpeg',
              upsert: true
            });

          if (uploadError) {
            console.error('Error uploading avatar:', uploadError);
          } else {
            // Get public URL for the uploaded avatar
            const { data: { publicUrl } } = supabase.storage
              .from('avatars')
              .getPublicUrl(fileName);
            storedAvatarUrl = publicUrl;
            console.log('Avatar stored successfully:', publicUrl);
          }
        }
      } catch (error) {
        console.error('Error processing avatar:', error);
        // Fall back to Strava URL if our storage fails
      }
    }

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

    // Fetch ONLY first 1-2 pages for initial streak calculation (quick signup)
    let allActivities: any[] = [];
    let page = 1;
    const perPage = 200;
    const maxPages = 2; // Only fetch 2 pages (400 activities) for quick signup
    
    console.log('Starting quick activity fetch for signup (2 pages max)...');
    
    while (page <= maxPages) {
      const activitiesResponse = await fetch(
        `https://www.strava.com/api/v3/athlete/activities?per_page=${perPage}&page=${page}`,
        {
          headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
        }
      );

      if (!activitiesResponse.ok) {
        throw new Error('Failed to fetch activities');
      }

      const activities = await activitiesResponse.json();
      
      if (activities.length === 0) {
        console.log(`No more activities found at page ${page}`);
        break;
      }
      
      allActivities = allActivities.concat(activities);
      console.log(`Fetched page ${page}: ${activities.length} activities (total: ${allActivities.length})`);
      
      // Stop if we got fewer than perPage results (no more pages)
      if (activities.length < perPage) {
        break;
      }
      
      page++;
    }
    
    const activities = allActivities;
    console.log(`Quick fetch complete: ${activities.length} activities for initial streak calculation`);

    // Get runner's timezone from Strava profile, fallback to America/Los_Angeles
    const timezone = athleteProfile.timezone || 'America/Los_Angeles';
    console.log('Using timezone:', timezone);

    // Calculate streak using runner's local timezone
    const runActivities = activities
      .filter((a: any) => a.type === 'Run')
      .sort((a: any, b: any) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());

    let currentStreakDays = 0;
    let currentStreakMiles = 0;
    let longestStreakEver = 0;
    let streakStartDate = null;
    let lastActivityDate = null;
    let tempStreak = 0;

    const todayStr = getTodayInTimezone(timezone);
    
    // Build activity map using runner's local date
    const activityDates = new Map();
    runActivities.forEach((activity: any) => {
      const dateStr = convertToLocalDateStr(activity.start_date, timezone);
      const miles = (activity.distance * 0.000621371);
      
      if (!activityDates.has(dateStr)) {
        activityDates.set(dateStr, miles);
      } else {
        activityDates.set(dateStr, activityDates.get(dateStr) + miles);
      }
    });

    const sortedDates = Array.from(activityDates.keys()).sort().reverse();
    
    // Calculate current streak
    for (let i = 0; i < sortedDates.length; i++) {
      const currentDateStr = sortedDates[i];
      const currentDate = new Date(currentDateStr);
      const todayDate = new Date(todayStr);
      const expectedDate = new Date(todayDate);
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
    const todayDate = new Date(todayStr);
    const calculateDaysOnStreak = (daysBack: number) => {
      const cutoffDate = new Date(todayStr);
      cutoffDate.setDate(cutoffDate.getDate() - daysBack);
      return sortedDates.filter(dateStr => {
        const date = new Date(dateStr);
        return date >= cutoffDate && date <= todayDate;
      }).length;
    };

    const daysOnStreak30 = calculateDaysOnStreak(30);
    const daysOnStreak60 = calculateDaysOnStreak(60);
    const daysOnStreak90 = calculateDaysOnStreak(90);

    // Check if this is an existing user to get their join date and email
    const { data: existingRunner } = await supabase
      .from('runners')
      .select('id, joined_runstreak_at, email')
      .eq('strava_user_id', athleteProfile.id)
      .maybeSingle();

    const joinedDate = existingRunner?.joined_runstreak_at 
      ? new Date(existingRunner.joined_runstreak_at)
      : new Date(); // New users join today

    joinedDate.setHours(0, 0, 0, 0);
    
    // Calculate days on streak since joining RunStreak
    const daysSinceJoining = Math.floor((todayDate.getTime() - joinedDate.getTime()) / 86400000) + 1;
    const daysOnStreakSinceJoining = sortedDates.filter(dateStr => {
      const date = new Date(dateStr);
      return date >= joinedDate && date <= todayDate;
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
    // Only update email if Strava provides one, otherwise keep existing email
    const shouldUpdateEmail = !!athleteProfile.email;
    const emailToStore = shouldUpdateEmail 
      ? athleteProfile.email 
      : (existingRunner?.email || null);
    
    const runnerData: any = {
      user_id: userId,
      strava_user_id: athleteProfile.id,
      strava_username: athleteProfile.username || `${athleteProfile.firstname} ${athleteProfile.lastname}`,
      display_name: `${athleteProfile.firstname} ${athleteProfile.lastname}`,
      avatar_url: storedAvatarUrl,
      email: emailToStore, // Only update if Strava provides it, otherwise preserve existing
      sex: athleteProfile.sex,
      weight: athleteProfile.weight,
      city: athleteProfile.city,
      state: athleteProfile.state,
      country: athleteProfile.country,
      timezone: timezone,
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
      // Stats from Strava API (convert meters to miles and meters to feet)
      ytd_run_count: athleteStats?.ytd_run_totals?.count || 0,
      ytd_distance: (athleteStats?.ytd_run_totals?.distance || 0) / 1609.34,
      ytd_moving_time: athleteStats?.ytd_run_totals?.moving_time || 0,
      ytd_elevation_gain: (athleteStats?.ytd_run_totals?.elevation_gain || 0) * 3.28084,
      all_time_run_count: athleteStats?.all_run_totals?.count || 0,
      all_time_distance: (athleteStats?.all_run_totals?.distance || 0) / 1609.34,
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
    
    // Determine if this is a new user
    const isNewUser = !existingRunner;
    
    // Get redirect base URL - use production domain
    const baseUrl = 'https://runstreak.to';
    
    // Create session tokens for the user
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: userEmail,
    });

    if (sessionError || !sessionData) {
      console.error('Error generating session:', sessionError);
      throw new Error('Failed to generate session');
    }

    // Extract access and refresh tokens
    const actionLink = sessionData.properties.action_link;
    const linkUrl = new URL(actionLink);
    const hashToken = linkUrl.searchParams.get('token');

    if (!hashToken) {
      console.error('No token in generated link');
      throw new Error('Failed to extract session token');
    }

    // Exchange for actual session tokens
    const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: hashToken,
      type: 'magiclink',
    });

    if (verifyError || !verifyData.session) {
      console.error('Error verifying token:', verifyError);
      throw new Error('Failed to create session');
    }
    
    const accessToken = verifyData.session.access_token;
    const refreshToken = verifyData.session.refresh_token;
    
    console.log('Session tokens generated successfully');
    
    // NEW users: Full sync will be triggered AFTER email verification on Step 2
    // This keeps OAuth callback fast and avoids rate limits during testing
    console.log(isNewUser ? 'New user - full sync will trigger after email verification' : 'Returning user - no sync needed');
    
    // Build redirect URL with session tokens for client-side auth
    const redirectUrl = isNewUser 
      ? `${baseUrl}/onboarding/step-1?runnerId=${savedRunner.id}&access_token=${accessToken}&refresh_token=${refreshToken}`
      : `${baseUrl}/?access_token=${accessToken}&refresh_token=${refreshToken}`;
    
    console.log(`Redirecting ${isNewUser ? 'new' : 'returning'} user to ${redirectUrl}`);

    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': redirectUrl,
      },
    });

  } catch (error) {
    console.error('Error in strava-callback:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const baseUrl = 'https://runstreak.to';
    return new Response(null, {
      status: 302,
      headers: {
        'Location': `${baseUrl}/?strava=error&message=${encodeURIComponent(errorMessage)}`,
      },
    });
  }
});
