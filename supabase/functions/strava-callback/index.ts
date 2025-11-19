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

// Declare EdgeRuntime global for background tasks
declare const EdgeRuntime: {
  waitUntil(promise: Promise<any>): void;
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

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get API mode from app_settings to use correct credentials
    const { data: settingData } = await supabase
      .from('app_settings')
      .select('setting_value')
      .eq('setting_key', 'strava_api_mode')
      .maybeSingle();
    
    const apiMode = (settingData?.setting_value as 'live' | 'test') || 'live';
    
    const clientId = apiMode === 'test'
      ? Deno.env.get('STRAVA_CLIENT_ID_2')
      : Deno.env.get('STRAVA_CLIENT_ID');
    const clientSecret = apiMode === 'test'
      ? Deno.env.get('STRAVA_CLIENT_SECRET_2')
      : Deno.env.get('STRAVA_CLIENT_SECRET');
    
    if (!clientId || !clientSecret) {
      throw new Error('Strava credentials not configured for ' + apiMode + ' mode');
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
    const userEmail = athleteProfile.email || `strava_${athleteProfile.id}@runstreaks.internal`;
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

    // Check if runner already exists in database with activity data
    const { data: returningRunner } = await supabase
      .from('runners')
      .select('id, last_activity_date')
      .eq('strava_user_id', athleteProfile.id)
      .maybeSingle();

    const isReturningUser = returningRunner && returningRunner.last_activity_date;
    
    if (isReturningUser) {
      console.log('Returning user detected - skipping activity sync, only authenticating');
      
      // Update tokens only, no activity sync needed
      const { error: updateError } = await supabase
        .from('runners')
        .update({
          strava_access_token: tokenData.access_token,
          strava_refresh_token: tokenData.refresh_token,
          token_expires_at: new Date(tokenData.expires_at * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', returningRunner.id);

      if (updateError) {
        console.error('Error updating runner tokens:', updateError);
      }

      // Generate session for returning user and redirect immediately
      const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: userEmail,
      });

      if (sessionError || !sessionData) {
        console.error('Session generation error:', sessionError);
        throw new Error('Failed to generate session');
      }

      const redirectUrl = new URL('https://runstreaks.io');
      redirectUrl.searchParams.set('access_token', sessionData.properties.action_link.split('#access_token=')[1].split('&')[0]);
      redirectUrl.searchParams.set('refresh_token', sessionData.properties.action_link.split('&refresh_token=')[1].split('&')[0]);

      return new Response(null, {
        status: 302,
        headers: {
          'Location': redirectUrl.toString(),
          ...corsHeaders
        }
      });
    }

    // NEW USER - Quick initial setup, then background sync
    console.log('New user detected - starting quick setup with background sync');
    
    // Quick fetch: Just get first page of activities for initial streak calculation
    const quickActivitiesResponse = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?per_page=200&page=1`,
      {
        headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
      }
    );

    if (!quickActivitiesResponse.ok) {
      throw new Error('Failed to fetch activities');
    }

    const quickActivities = await quickActivitiesResponse.json();
    console.log(`Quick fetch complete: ${quickActivities.length} activities`);
    const activities = quickActivities;

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
    let streakStatus = 'active';

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
    
    console.log('Calculating streak:', {
      totalActivityDays: sortedDates.length,
      mostRecentDate: sortedDates[0],
      todayInTimezone: todayStr,
      timezone: timezone
    });
    
    // Calculate current streak by counting consecutive days backwards from most recent activity
    // Streak is only broken if there's a gap of 2+ days BETWEEN activities
    let previousDateStr = sortedDates[0]; // Start with most recent
    
    for (let i = 0; i < sortedDates.length; i++) {
      const currentDateStr = sortedDates[i];
      const milesForDay = activityDates.get(currentDateStr) || 0;
      
      // Check for 1+ mile requirement
      if (milesForDay < 1.0) {
        console.log(`Day ${currentDateStr} has insufficient miles: ${milesForDay.toFixed(2)}`);
        break;
      }
      
      // Check for gaps between activities (only after first activity)
      if (i > 0) {
        const daysBetween = Math.floor((new Date(previousDateStr).getTime() - new Date(currentDateStr).getTime()) / (1000 * 60 * 60 * 24));
        console.log(`Gap between ${previousDateStr} and ${currentDateStr}: ${daysBetween} days`);
        
        if (daysBetween > 1) {
          console.log('Streak broken - gap of more than 1 day between activities');
          break;
        }
      }
      
      // This day is part of the streak
      currentStreakDays++;
      currentStreakMiles += milesForDay;
      if (!streakStartDate) streakStartDate = currentDateStr;
      lastActivityDate = currentDateStr;
      previousDateStr = currentDateStr;
      
      console.log(`Streak day ${i + 1}: ${currentDateStr}, miles: ${milesForDay.toFixed(2)}, total streak: ${currentStreakDays} days`);
    }
    
    // Determine streak status: only broken if 2+ days have passed since last activity
    // Using same logic as StreakCountdown component
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = formatInTimeZone(yesterday, timezone, 'yyyy-MM-dd');
    
    const lastActivityDateStr = sortedDates[0];
    const hasRunToday = lastActivityDateStr === todayStr;
    const hasRunYesterday = lastActivityDateStr === yesterdayStr;
    
    // Streak is only broken if last activity was 2+ days ago
    streakStatus = (hasRunToday || hasRunYesterday) ? 'active' : 'broken';
    console.log(`Streak status: ${streakStatus} (last activity: ${lastActivityDateStr}, today: ${todayStr}, yesterday: ${yesterdayStr})`);


    
    console.log('Streak calculation complete:', {
      currentStreakDays,
      currentStreakMiles: currentStreakMiles.toFixed(2),
      streakStartDate,
      lastActivityDate
    });

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
    
    // Start background sync for full activity data
    const backgroundSync = async () => {
      console.log('Starting background sync for full activity history...');
      
      try {
        // Fetch ALL activities (all pages)
        let allActivities: any[] = [];
        let page = 1;
        const perPage = 200;
        
        while (true) {
          const activitiesResponse = await fetch(
            `https://www.strava.com/api/v3/athlete/activities?per_page=${perPage}&page=${page}`,
            {
              headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
            }
          );

          if (!activitiesResponse.ok) {
            console.error('Failed to fetch activities in background sync');
            break;
          }

          const pageActivities = await activitiesResponse.json();
          
          if (pageActivities.length === 0) {
            console.log(`Background sync: No more activities at page ${page}`);
            break;
          }
          
          allActivities = allActivities.concat(pageActivities);
          console.log(`Background sync: Fetched page ${page}: ${pageActivities.length} activities (total: ${allActivities.length})`);
          
          if (pageActivities.length < perPage) {
            console.log('Background sync: Last page reached');
            break;
          }
          
          page++;
        }
        
        console.log(`Background sync: Fetched ${allActivities.length} total activities`);
        
        // Filter run activities
        const runActivities = allActivities.filter((a: any) => a.type === 'Run');
        console.log(`Background sync: Processing ${runActivities.length} run activities`);
        
        // Build daily activities map
        const dailyActivitiesMap = new Map<string, any>();
        
        for (const activity of runActivities) {
          const dateStr = convertToLocalDateStr(activity.start_date, timezone);
          const existing = dailyActivitiesMap.get(dateStr) || { 
            distance: 0, movingTime: 0, elevationGain: 0, runCount: 0,
            averageTemp: null, tempCount: 0,
            heartrates: [], cadences: [], speeds: [],
            calories: 0, sufferScore: 0, achievements: 0, kudos: 0, comments: 0, photos: 0,
            trainer: false, commute: false, devices: new Set(), workouts: new Set(), gears: new Set(),
            maxHR: 0, maxSpeed: 0
          };
          
          const newAverageTemp = activity.average_temp !== undefined && activity.average_temp !== null 
            ? (((existing.averageTemp || 0) * existing.tempCount) + activity.average_temp) / (existing.tempCount + 1)
            : existing.averageTemp;
          
          if (activity.average_heartrate) existing.heartrates.push(activity.average_heartrate);
          if (activity.average_cadence) existing.cadences.push(activity.average_cadence);
          if (activity.average_speed) existing.speeds.push(activity.average_speed);
          
          if (activity.device_name) existing.devices.add(activity.device_name);
          if (activity.workout_type) existing.workouts.add(activity.workout_type);
          if (activity.gear_id) existing.gears.add(activity.gear_id);
          
          dailyActivitiesMap.set(dateStr, {
            distance: existing.distance + (activity.distance / 1609.34),
            movingTime: existing.movingTime + activity.moving_time,
            elevationGain: existing.elevationGain + (activity.total_elevation_gain * 3.28084),
            runCount: existing.runCount + 1,
            averageTemp: newAverageTemp,
            tempCount: activity.average_temp !== undefined && activity.average_temp !== null ? existing.tempCount + 1 : existing.tempCount,
            heartrates: existing.heartrates,
            cadences: existing.cadences,
            speeds: existing.speeds,
            calories: existing.calories + (activity.calories || 0),
            sufferScore: Math.max(existing.sufferScore, activity.suffer_score || 0),
            achievements: existing.achievements + (activity.achievement_count || 0),
            kudos: existing.kudos + (activity.kudos_count || 0),
            comments: existing.comments + (activity.comment_count || 0),
            photos: existing.photos + (activity.photo_count || 0),
            trainer: existing.trainer || (activity.trainer === true),
            commute: existing.commute || (activity.commute === true),
            devices: existing.devices,
            workouts: existing.workouts,
            gears: existing.gears,
            maxHR: Math.max(existing.maxHR || 0, activity.max_heartrate || 0),
            maxSpeed: Math.max(existing.maxSpeed || 0, activity.max_speed || 0),
          });
        }
        
        console.log(`Background sync: Persisting ${dailyActivitiesMap.size} days of activities...`);
        
        // Persist to database
        for (const [dateStr, data] of dailyActivitiesMap.entries()) {
          const avgHR = data.heartrates.length > 0 ? data.heartrates.reduce((a: number, b: number) => a + b, 0) / data.heartrates.length : null;
          const avgCadence = data.cadences.length > 0 ? data.cadences.reduce((a: number, b: number) => a + b, 0) / data.cadences.length : null;
          const avgSpeed = data.speeds.length > 0 ? data.speeds.reduce((a: number, b: number) => a + b, 0) / data.speeds.length : null;
          
          await supabase
            .from('daily_activities')
            .upsert({
              runner_id: savedRunner.id,
              activity_date: dateStr,
              distance: data.distance,
              moving_time: data.movingTime,
              elevation_gain: data.elevationGain,
              run_count: data.runCount,
              average_temp: data.averageTemp,
              average_heartrate: avgHR,
              max_heartrate: data.maxHR,
              average_cadence: avgCadence,
              average_speed: avgSpeed,
              max_speed: data.maxSpeed,
              calories: data.calories,
              suffer_score: data.sufferScore,
              achievement_count: data.achievements,
              kudos_count: data.kudos,
              comment_count: data.comments,
              photo_count: data.photos,
              trainer: data.trainer,
              commute: data.commute,
              device_names: Array.from(data.devices),
              workout_types: Array.from(data.workouts),
              gear_ids: Array.from(data.gears),
            }, {
              onConflict: 'runner_id,activity_date'
            });
        }
        
        console.log('Background sync: Daily activities persisted successfully');
      } catch (error) {
        console.error('Background sync error:', error);
      }
    };
    
    // Run background sync without awaiting (using EdgeRuntime.waitUntil)
    EdgeRuntime.waitUntil(backgroundSync());
    console.log('Background sync started, proceeding with redirect...');
    
    // Determine if this is a new user
    const isNewUser = !existingRunner;
    
    // Get redirect base URL - use production domain
    const baseUrl = 'https://runstreaks.io';
    
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
    
    // NEW users: Quick redirect with background sync running
    // RETURNING users: No sync needed, only authentication
    // All future activity updates will come through webhooks
    console.log(isNewUser ? 'New user - redirecting to onboarding, background sync running' : 'Returning user - no sync needed');
    
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
    const baseUrl = 'https://runstreaks.io';
    return new Response(null, {
      status: 302,
      headers: {
        'Location': `${baseUrl}/?strava=error&message=${encodeURIComponent(errorMessage)}`,
      },
    });
  }
});
