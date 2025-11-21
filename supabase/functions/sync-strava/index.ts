import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';
import { formatInTimeZone, toZonedTime } from 'https://esm.sh/date-fns-tz@3.2.0';
import { format } from 'https://esm.sh/date-fns@4.1.0';

// Helper function to get timezone from coordinates
async function getTimezoneFromCoords(lat: number, lon: number): Promise<string> {
  try {
    const response = await fetch(
      `https://timeapi.io/api/timezone/coordinate?latitude=${lat}&longitude=${lon}`
    );
    
    if (response.ok) {
      const data = await response.json();
      return data.timeZone || 'America/New_York';
    }
  } catch (error) {
    console.error('Error fetching timezone:', error);
  }
  
  // Fallback to UTC-based estimation from longitude
  const utcOffset = Math.round(lon / 15);
  const timezones: { [key: number]: string } = {
    '-8': 'America/Los_Angeles',
    '-7': 'America/Denver',
    '-6': 'America/Chicago',
    '-5': 'America/New_York',
    '0': 'Europe/London',
    '1': 'Europe/Paris',
    '8': 'Asia/Shanghai',
    '9': 'Asia/Tokyo',
  };
  return timezones[utcOffset] || 'America/New_York';
}

// Convert UTC date string to local date string in runner's timezone
function convertToLocalDateStr(utcDateStr: string, timezone: string): string {
  try {
    const utcDate = new Date(utcDateStr);
    // Convert to the runner's timezone and format as YYYY-MM-DD
    return formatInTimeZone(utcDate, timezone, 'yyyy-MM-dd');
  } catch (error) {
    console.error('Error converting date to timezone:', error);
    // Fallback to basic conversion
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
    const { runnerId, quickSync, maxPages, skipFirstPage } = await req.json();

    if (!runnerId) {
      throw new Error('Runner ID is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get API mode from app_settings to determine which credentials to use
    const { data: settingData } = await supabase
      .from('app_settings')
      .select('setting_value')
      .eq('setting_key', 'strava_api_mode')
      .maybeSingle();
    
    const apiMode = (settingData?.setting_value as 'live' | 'test') || 'live';
    const stravaClientId = apiMode === 'test'
      ? Deno.env.get('STRAVA_CLIENT_ID_2')
      : Deno.env.get('STRAVA_CLIENT_ID');
    const stravaClientSecret = apiMode === 'test'
      ? Deno.env.get('STRAVA_CLIENT_SECRET_2')
      : Deno.env.get('STRAVA_CLIENT_SECRET');

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
          client_id: stravaClientId,
          client_secret: stravaClientSecret,
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
    
    // Fetch athlete profile to get updated avatar
    let storedAvatarUrl = runner.avatar_url;
    try {
      const athleteResponse = await fetch('https://www.strava.com/api/v3/athlete', {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });

      if (athleteResponse.ok) {
        const athleteProfile = await athleteResponse.json();
        const stravaAvatarUrl = athleteProfile.profile || athleteProfile.profile_medium;
        
        // Download and store avatar if it's different or missing
        if (stravaAvatarUrl && stravaAvatarUrl !== runner.avatar_url) {
          console.log('Updating avatar from Strava...');
          const avatarResponse = await fetch(stravaAvatarUrl);
          if (avatarResponse.ok) {
            const avatarBlob = await avatarResponse.blob();
            const fileExt = stravaAvatarUrl.split('.').pop()?.split('?')[0] || 'jpg';
            const fileName = `${runner.strava_user_id}-${Date.now()}.${fileExt}`;
            
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('avatars')
              .upload(fileName, avatarBlob, {
                contentType: avatarResponse.headers.get('content-type') || 'image/jpeg',
                upsert: true
              });

            if (!uploadError) {
              const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);
              storedAvatarUrl = publicUrl;
              console.log('Avatar updated successfully:', publicUrl);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error updating avatar:', error);
    }

    // Fetch all activities for streak calculation (need complete history for accurate streaks)
    // But we'll only fetch detailed activity info for NEW activities when checking PRs
    // Support quick sync (first page only) for fast initial rank calculation
    let allActivities: any[] = [];
    let page = skipFirstPage ? 2 : 1; // Skip first page if this is a full sync after quick sync
    const perPage = 200;
    const maxPagesToFetch = maxPages || Infinity; // Limit pages for quick sync
    let pagesFetched = 0;

    console.log(`Starting activity fetch (${quickSync ? 'QUICK' : 'FULL'} sync, starting page ${page}, max pages: ${maxPagesToFetch})...`);
    
    while (pagesFetched < maxPagesToFetch) {
      pagesFetched++;
      console.log(`Fetching page ${page}...`);
      
      const activitiesResponse = await fetch(
        `https://www.strava.com/api/v3/athlete/activities?per_page=${perPage}&page=${page}&include_all_efforts=true`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );

      if (!activitiesResponse.ok) {
        console.log('Activities fetch failed, stopping pagination');
        break;
      }
      
      const activities = await activitiesResponse.json();
      if (activities.length === 0) {
        console.log('No more activities, stopping pagination');
        break;
      }
      
      const runActivities = activities.filter((a: any) => a.type === 'Run');
      allActivities = allActivities.concat(runActivities);
      console.log(`Page ${page}: Found ${runActivities.length} running activities`);
      
      if (activities.length < perPage) {
        console.log('Last page reached (fewer than perPage activities)');
        break;
      }
      page++;
    }

    console.log(`Activity fetch complete: ${allActivities.length} total running activities (${quickSync ? 'QUICK' : 'FULL'} sync)`);

    // Determine runner's timezone from coordinates
    let timezone = runner.timezone;
    if (!timezone && runner.latitude && runner.longitude) {
      console.log('Determining timezone from coordinates...');
      timezone = await getTimezoneFromCoords(runner.latitude, runner.longitude);
      console.log(`Determined timezone: ${timezone}`);
    }
    if (!timezone) {
      timezone = 'America/New_York'; // Default fallback
      console.log('Using fallback timezone');
    }

    // Calculate streaks - filter to 1+ mile runs only
    const sortedActivities = allActivities
      .filter((a: any) => (a.distance / 1609.34) >= 1.0)
      .sort((a: any, b: any) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());

    let currentStreakDays = 0;
    let currentStreakMiles = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let lastDate: string | null = null;
    let streakStartDate: string | null = null;
    const activityDates = new Set<string>();

    // Convert all activities to runner's local timezone dates
    for (const activity of sortedActivities) {
      const dateStr = convertToLocalDateStr(activity.start_date, timezone);
      activityDates.add(dateStr);
    }

    const sortedDates = Array.from(activityDates).sort().reverse();
    const todayStr = getTodayInTimezone(timezone);

    for (let i = 0; i < sortedDates.length; i++) {
      const dateStr = sortedDates[i];
      
      if (i === 0) {
        // Calculate days difference between today and last run
        const lastRunDate = new Date(dateStr);
        const todayDate = new Date(todayStr);
        const daysDiff = Math.floor((todayDate.getTime() - lastRunDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Streak is active if you ran today (0) or yesterday (1)
        if (daysDiff >= 2) {
          console.log(`Streak broken: Last run was ${daysDiff} days ago in timezone ${timezone}`);
          break;
        }
        
        console.log(`Streak active: Last run was ${daysDiff} days ago in timezone ${timezone}`);
        tempStreak = 1;
        if (!streakStartDate) streakStartDate = dateStr;
        lastDate = dateStr;
      } else {
        const prevDateStr = sortedDates[i - 1];
        const prevDate = new Date(prevDateStr);
        const currDate = new Date(dateStr);
        const daysDiff = Math.floor((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
          tempStreak++;
          streakStartDate = dateStr;
        } else {
          break;
        }
      }
    }

    currentStreakDays = tempStreak;
    longestStreak = Math.max(runner.longest_streak_ever || 0, currentStreakDays);

    // Calculate current streak miles using timezone-aware date strings
    if (streakStartDate && lastDate) {
      const streakActivities = sortedActivities.filter((activity: any) => {
        const activityDateStr = convertToLocalDateStr(activity.start_date, timezone);
        // String comparison works for YYYY-MM-DD format
        return activityDateStr >= streakStartDate && activityDateStr <= lastDate;
      });
      currentStreakMiles = streakActivities.reduce((sum: number, a: any) => sum + (a.distance / 1609.34), 0);
    }

    const avgMilesPerDay = currentStreakDays > 0 ? currentStreakMiles / currentStreakDays : 0;
    const streakStatus = currentStreakDays > 0 ? 'active' : 'broken';

    // Store INDIVIDUAL activities to strava_activities table with ALL fields from list endpoint
    for (const activity of allActivities) {
      const dateStr = convertToLocalDateStr(activity.start_date, timezone);
      
      await supabase
        .from('strava_activities')
        .upsert({
          runner_id: runnerId,
          strava_activity_id: activity.id,
          activity_date: dateStr,
          name: activity.name || null,
          distance: activity.distance / 1609.34, // meters to miles
          moving_time: activity.moving_time || 0,
          elapsed_time: activity.elapsed_time || 0,
          elevation_gain: (activity.total_elevation_gain || 0) * 3.28084, // meters to feet
          workout_type: activity.workout_type?.toString() || null,
          device_name: activity.device_name || null,
          gear_id: activity.gear_id || null,
          average_speed: activity.average_speed || null,
          max_speed: activity.max_speed || null,
          average_cadence: activity.average_cadence || null,
          average_heartrate: activity.average_heartrate || null,
          max_heartrate: activity.max_heartrate || null,
          average_temp: activity.average_temp || null,
          calories: activity.calories || null,
          suffer_score: activity.suffer_score || null,
          achievement_count: activity.achievement_count || null,
          kudos_count: activity.kudos_count || null,
          comment_count: activity.comment_count || null,
          photo_count: activity.photo_count || null,
          trainer: activity.trainer || false,
          commute: activity.commute || false,
          
          // NEW FIELDS - Activity Classification
          type: activity.type || null,
          sport_type: activity.sport_type || null,
          
          // NEW FIELDS - Timing
          start_date: activity.start_date || null,
          start_date_local: activity.start_date_local || null,
          timezone: activity.timezone || null,
          
          // NEW FIELDS - Location
          location_city: activity.location_city || null,
          location_state: activity.location_state || null,
          location_country: activity.location_country || null,
          start_latlng: activity.start_latlng ? JSON.stringify(activity.start_latlng) : null,
          end_latlng: activity.end_latlng ? JSON.stringify(activity.end_latlng) : null,
          
          // NEW FIELDS - Elevation Details
          elev_high: activity.elev_high || null,
          elev_low: activity.elev_low || null,
          
          // NEW FIELDS - Activity Properties
          has_heartrate: activity.has_heartrate || false,
          manual: activity.manual || false,
          private: activity.private || false,
          visibility: activity.visibility || null,
          flagged: activity.flagged || false,
          hide_from_home: activity.hide_from_home || false,
          from_accepted_tag: activity.from_accepted_tag || false,
          
          // NEW FIELDS - IDs & References
          upload_id: activity.upload_id || null,
          external_id: activity.external_id || null,
          map_id: activity.map?.id || null,
          summary_polyline: activity.map?.summary_polyline || null,
          
          // NEW FIELDS - Stats
          pr_count: activity.pr_count || 0,
          total_photo_count: activity.total_photo_count || null,
        }, {
          onConflict: 'runner_id,strava_activity_id',
          ignoreDuplicates: false,
        });
    }

    // Store daily activities with comprehensive data using runner's timezone
    const dailyActivitiesMap = new Map<string, any>();

    for (const activity of allActivities) {
      const dateStr = convertToLocalDateStr(activity.start_date, timezone);
      const existing = dailyActivitiesMap.get(dateStr) || { 
        distance: 0, movingTime: 0, elevationGain: 0, runCount: 0,
        averageTemp: null, tempCount: 0,
        heartrates: [], cadences: [], speeds: [],
        calories: 0, sufferScore: 0, achievements: 0, kudos: 0, comments: 0, photos: 0,
        trainer: false, commute: false, devices: new Set(), workouts: new Set(), gears: new Set()
      };
      
      // Aggregate temperature
      const newAverageTemp = activity.average_temp !== undefined && activity.average_temp !== null 
        ? (((existing.averageTemp || 0) * existing.tempCount) + activity.average_temp) / (existing.tempCount + 1)
        : existing.averageTemp;
      
      // Collect heart rate data
      if (activity.average_heartrate) existing.heartrates.push(activity.average_heartrate);
      if (activity.average_cadence) existing.cadences.push(activity.average_cadence);
      if (activity.average_speed) existing.speeds.push(activity.average_speed);
      
      // Add device/workout/gear info
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

    // Upsert daily activities with all data
    for (const [dateStr, data] of dailyActivitiesMap.entries()) {
      const avgHR = data.heartrates.length > 0 ? data.heartrates.reduce((a: number, b: number) => a + b, 0) / data.heartrates.length : null;
      const avgCadence = data.cadences.length > 0 ? data.cadences.reduce((a: number, b: number) => a + b, 0) / data.cadences.length : null;
      const avgSpeed = data.speeds.length > 0 ? data.speeds.reduce((a: number, b: number) => a + b, 0) / data.speeds.length : null;
      
      await supabase
        .from('daily_activities')
        .upsert({
          runner_id: runnerId,
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

    // Best efforts will be calculated by separate calculate-best-efforts function after sync completes

    // Calculate days on streak metrics
    const allActivityDates = Array.from(activityDates);
    
    // Calculate days on streak for last 30/60/90 days
    const todayDate = new Date(todayStr);
    const getDaysWithActivity = (daysPast: number) => {
      const startDate = new Date(todayStr);
      startDate.setDate(startDate.getDate() - daysPast);
      return allActivityDates.filter(dateStr => {
        const date = new Date(dateStr + 'T00:00:00');
        return date >= startDate && date <= todayDate;
      }).length;
    };
    
    const daysOnStreak30 = getDaysWithActivity(30);
    const daysOnStreak60 = getDaysWithActivity(60);
    const daysOnStreak90 = getDaysWithActivity(90);
    
    // Calculate days since joining vs before joining
    const joinedDate = runner.joined_runstreak_at ? new Date(runner.joined_runstreak_at) : null;
    let daysOnStreakSinceJoining = 0;
    let totalDaysSinceJoining = 0;
    let daysOnStreakBeforeJoining = 0;
    let totalDaysBeforeJoining = 0;
    
    if (joinedDate) {
      joinedDate.setHours(0, 0, 0, 0);
      totalDaysSinceJoining = Math.floor((todayDate.getTime() - joinedDate.getTime()) / (1000 * 60 * 60 * 24)) + 1; // +1 for inclusive count
      
      // Count days with activity since joining
      daysOnStreakSinceJoining = allActivityDates.filter(dateStr => {
        const date = new Date(dateStr);
        return date >= joinedDate;
      }).length;
      
      // Find earliest activity date for "before joining" calculation
      const earliestActivityDate = allActivityDates.length > 0 
        ? new Date(Math.min(...allActivityDates.map(d => new Date(d).getTime())))
        : null;
      
      if (earliestActivityDate) {
        earliestActivityDate.setHours(0, 0, 0, 0);
        
        // Only calculate if there are activities before joining
        if (earliestActivityDate < joinedDate) {
          totalDaysBeforeJoining = Math.floor((joinedDate.getTime() - earliestActivityDate.getTime()) / (1000 * 60 * 60 * 24));
          daysOnStreakBeforeJoining = allActivityDates.filter(dateStr => {
            const date = new Date(dateStr);
            return date < joinedDate;
          }).length;
        }
      }
    }

    // Calculate historical streaks for streak_history table
    console.log('Calculating historical streaks...');
    const historicalStreaks: Array<{
      start_date: string;
      end_date: string;
      days_count: number;
      total_miles: number;
      total_runs: number;
    }> = [];
    
    // Use only dates with 1+ mile for streak calculation
    const sortedActivityDates = Array.from(activityDates).sort();
    let currentHistoricalStreak: {
      start: string;
      end: string;
      dates: Set<string>;
    } | null = null;
    
    for (let i = 0; i < sortedActivityDates.length; i++) {
      const dateStr = sortedActivityDates[i];
      const currentDate = new Date(dateStr);
      
      if (!currentHistoricalStreak) {
        // Start new streak
        currentHistoricalStreak = {
          start: dateStr,
          end: dateStr,
          dates: new Set([dateStr])
        };
      } else {
        const prevDateStr = sortedActivityDates[i - 1];
        const prevDate = new Date(prevDateStr);
        const daysDiff = Math.floor((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
          // Continue streak
          currentHistoricalStreak.end = dateStr;
          currentHistoricalStreak.dates.add(dateStr);
        } else {
          // Streak broken, save the previous one if it's 5+ days
          if (currentHistoricalStreak.dates.size >= 5) {
            // Filter activities using timezone-aware dates
            const streakActivities = allActivities.filter((a: any) => {
              const aDate = convertToLocalDateStr(a.start_date, timezone);
              return currentHistoricalStreak!.dates.has(aDate);
            });
            
            const totalMiles = streakActivities.reduce((sum: number, a: any) => 
              sum + (a.distance / 1609.34), 0
            );
            const totalRuns = streakActivities.length;
            
            historicalStreaks.push({
              start_date: currentHistoricalStreak.start,
              end_date: currentHistoricalStreak.end,
              days_count: currentHistoricalStreak.dates.size,
              total_miles: totalMiles,
              total_runs: totalRuns
            });
          }
          
          // Start new streak
          currentHistoricalStreak = {
            start: dateStr,
            end: dateStr,
            dates: new Set([dateStr])
          };
        }
      }
    }
    
    // Don't forget the last streak
    if (currentHistoricalStreak && currentHistoricalStreak.dates.size >= 5) {
      // Filter activities using timezone-aware dates
      const streakActivities = allActivities.filter((a: any) => {
        const aDate = convertToLocalDateStr(a.start_date, timezone);
        return currentHistoricalStreak!.dates.has(aDate);
      });
      
      const totalMiles = streakActivities.reduce((sum: number, a: any) => 
        sum + (a.distance / 1609.34), 0
      );
      const totalRuns = streakActivities.length;
      
      historicalStreaks.push({
        start_date: currentHistoricalStreak.start,
        end_date: currentHistoricalStreak.end,
        days_count: currentHistoricalStreak.dates.size,
        total_miles: totalMiles,
        total_runs: totalRuns
      });
    }
    
    console.log(`Found ${historicalStreaks.length} historical streaks (5+ days)`);
    
    // Clear old streak history and insert new ones
    await supabase
      .from('streak_history')
      .delete()
      .eq('runner_id', runnerId);
    
    for (const streak of historicalStreaks) {
      await supabase
        .from('streak_history')
        .insert({
          runner_id: runnerId,
          start_date: streak.start_date,
          end_date: streak.end_date,
          days_count: streak.days_count,
          total_miles: streak.total_miles,
          total_runs: streak.total_runs,
          average_miles_per_day: streak.total_miles / streak.days_count
        });
    }

    // Calculate last_activity_date from daily_activities with 1+ mile
    const { data: recentActivities } = await supabase
      .from('daily_activities')
      .select('activity_date, distance')
      .eq('runner_id', runnerId)
      .gte('distance', 1.0)
      .order('activity_date', { ascending: false })
      .limit(1);
    
    const lastActivityDate = recentActivities && recentActivities.length > 0 
      ? recentActivities[0].activity_date 
      : null;

    // Update runner stats
    await supabase
      .from('runners')
      .update({
        avatar_url: storedAvatarUrl,
        timezone: timezone, // Save the timezone for future use
        current_streak_days: currentStreakDays,
        current_streak_miles: currentStreakMiles,
        longest_streak_ever: longestStreak,
        average_miles_per_day: avgMilesPerDay,
        streak_status: streakStatus,
        last_activity_date: lastActivityDate,
        streak_start_date: streakStartDate,
        days_on_streak_last_30: daysOnStreak30,
        days_on_streak_last_60: daysOnStreak60,
        days_on_streak_last_90: daysOnStreak90,
        days_on_streak_since_joining: daysOnStreakSinceJoining,
        total_days_since_joining: totalDaysSinceJoining,
        days_on_streak_before_joining: daysOnStreakBeforeJoining,
        total_days_before_joining: totalDaysBeforeJoining,
        ytd_run_count: stats.ytd_run_totals?.count || 0,
        ytd_distance: (stats.ytd_run_totals?.distance || 0) / 1609.34,
        ytd_moving_time: stats.ytd_run_totals?.moving_time || 0,
        ytd_elevation_gain: (stats.ytd_run_totals?.elevation_gain || 0) * 3.28084,
        all_time_run_count: stats.all_run_totals?.count || 0,
        all_time_distance: (stats.all_run_totals?.distance || 0) / 1609.34,
        updated_at: new Date().toISOString(),
      })
      .eq('id', runnerId);

    // Generate AI analysis after sync (background task)
    console.log('Generating AI analysis...');
    try {
      const { data: runnerData } = await supabase
        .from('runners')
        .select('*')
        .eq('id', runnerId)
        .single();

      if (runnerData) {
        const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
        if (LOVABLE_API_KEY) {
          const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [
                {
                  role: 'system',
                  content: 'You are an expert running coach analyzing performance data. Provide 3 specific, actionable insights based on the runner\'s data. Keep each insight under 100 words.'
                },
                {
                  role: 'user',
                  content: `Analyze this runner's performance:
- Current streak: ${runnerData.current_streak_days} days, ${runnerData.current_streak_miles?.toFixed(1)} miles
- Longest streak: ${runnerData.longest_streak_ever} days
- YTD: ${runnerData.ytd_run_count} runs, ${runnerData.ytd_distance?.toFixed(1)} miles
- All-time: ${runnerData.all_time_run_count} runs, ${runnerData.all_time_distance?.toFixed(1)} miles
- Streak status: ${runnerData.streak_status}
- Last activity: ${runnerData.last_activity_date || 'N/A'}

Provide exactly 3 insights with titles and descriptions.`
                }
              ],
              tools: [{
                type: 'function',
                function: {
                  name: 'provide_insights',
                  description: 'Provide running performance insights',
                  parameters: {
                    type: 'object',
                    properties: {
                      insights: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            title: { type: 'string' },
                            description: { type: 'string' }
                          },
                          required: ['title', 'description']
                        }
                      }
                    },
                    required: ['insights']
                  }
                }
              }],
              tool_choice: { type: 'function', function: { name: 'provide_insights' } }
            })
          });

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
            if (toolCall?.function?.arguments) {
              const analysis = JSON.parse(toolCall.function.arguments);
              
              // Cache AI analysis
              await supabase
                .from('runners')
                .update({
                  ai_analysis: analysis,
                  ai_analysis_updated_at: new Date().toISOString()
                })
                .eq('id', runnerId);
              
              console.log('AI analysis cached successfully');
            }
          }
        }
      }
    } catch (aiError) {
      console.error('Error generating AI analysis:', aiError);
      // Don't fail the sync if AI generation fails
    }

    // After syncing all data, calculate streaks, best efforts, and streak history
    console.log('Calling calculation functions...');
    
    try {
      // Call recalculate-streak
      const streakResponse = await supabase.functions.invoke('recalculate-streak', {
        headers: { Authorization: req.headers.get('Authorization')! }
      });
      
      if (streakResponse.error) {
        console.error('Error calculating streak:', streakResponse.error);
      } else {
        console.log('Streak calculated:', streakResponse.data);
      }

      // Call calculate-best-efforts
      const bestEffortsResponse = await supabase.functions.invoke('calculate-best-efforts', {
        headers: { Authorization: req.headers.get('Authorization')! }
      });
      
      if (bestEffortsResponse.error) {
        console.error('Error calculating best efforts:', bestEffortsResponse.error);
      } else {
        console.log('Best efforts calculated:', bestEffortsResponse.data);
      }

      // Call calculate-streak-history
      const historyResponse = await supabase.functions.invoke('calculate-streak-history', {
        headers: { Authorization: req.headers.get('Authorization')! }
      });
      
      if (historyResponse.error) {
        console.error('Error calculating streak history:', historyResponse.error);
      } else {
        console.log('Streak history calculated:', historyResponse.data);
      }
    } catch (calcError) {
      console.error('Error in calculation functions:', calcError);
      // Don't fail the sync if calculations fail
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Strava data synced and calculations completed' }),
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
