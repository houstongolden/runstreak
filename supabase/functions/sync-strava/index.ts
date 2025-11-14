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
        `https://www.strava.com/api/v3/athlete/activities?per_page=${perPage}&page=${page}&include_all_efforts=true`,
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

    // Fetch best efforts from individual activity details
    // Strava only provides best_efforts in detailed activity endpoint, not in list
    console.log('Fetching best efforts from activity details...');
    const bestEffortsMap = new Map<number, any>();
    
    // Limit to recent activities to avoid rate limits (last 100 runs)
    const activitiesToFetch = sortedActivities.slice(0, 100);
    
    for (const activity of activitiesToFetch) {
      try {
        const detailResponse = await fetch(
          `https://www.strava.com/api/v3/activities/${activity.id}`,
          { headers: { 'Authorization': `Bearer ${accessToken}` } }
        );
        
        if (!detailResponse.ok) {
          console.log(`Failed to fetch details for activity ${activity.id}`);
          continue;
        }
        
        const detailedActivity = await detailResponse.json();
        
        if (detailedActivity.best_efforts && Array.isArray(detailedActivity.best_efforts)) {
          for (const effort of detailedActivity.best_efforts) {
            const distance = effort.distance;
            const existing = bestEffortsMap.get(distance);
            
            // Keep the fastest effort for each distance
            if (!existing || effort.elapsed_time < existing.elapsed_time) {
              bestEffortsMap.set(distance, {
                runner_id: runnerId,
                distance: Math.round(distance),
                elapsed_time: effort.elapsed_time,
                moving_time: effort.moving_time,
                start_date: effort.start_date,
                activity_id: activity.id,
              });
            }
          }
        }
        
        // Add small delay to respect rate limits (100 requests per 15 min = ~9 seconds between)
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`Error fetching activity ${activity.id}:`, error);
      }
    }

    console.log(`Found ${bestEffortsMap.size} unique best effort distances`);

    // Upsert best efforts
    for (const effort of bestEffortsMap.values()) {
      await supabase
        .from('best_efforts')
        .upsert(effort, {
          onConflict: 'runner_id,distance'
        });
    }

    // Calculate days on streak metrics
    const allActivityDates = Array.from(activityDates);
    
    // Calculate days on streak for last 30/60/90 days
    const getDaysWithActivity = (daysPast: number) => {
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - daysPast);
      return allActivityDates.filter(dateStr => {
        const date = new Date(dateStr);
        return date >= startDate && date <= today;
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
      totalDaysSinceJoining = Math.floor((today.getTime() - joinedDate.getTime()) / (1000 * 60 * 60 * 24));
      
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
    
    const sortedActivityDates = Array.from(activityDates).sort();
    let currentHistoricalStreak: {
      start: Date;
      end: Date;
      dates: Set<string>;
    } | null = null;
    
    for (let i = 0; i < sortedActivityDates.length; i++) {
      const dateStr = sortedActivityDates[i];
      const currentDate = new Date(dateStr);
      
      if (!currentHistoricalStreak) {
        // Start new streak
        currentHistoricalStreak = {
          start: currentDate,
          end: currentDate,
          dates: new Set([dateStr])
        };
      } else {
        const prevDateStr = sortedActivityDates[i - 1];
        const prevDate = new Date(prevDateStr);
        const daysDiff = Math.floor((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
          // Continue streak
          currentHistoricalStreak.end = currentDate;
          currentHistoricalStreak.dates.add(dateStr);
        } else {
          // Streak broken, save the previous one if it's 5+ days
          if (currentHistoricalStreak.dates.size >= 5) {
            const streakActivities = allActivities.filter((a: any) => {
              const aDate = new Date(a.start_date).toISOString().split('T')[0];
              return currentHistoricalStreak!.dates.has(aDate);
            });
            
            const totalMiles = streakActivities.reduce((sum: number, a: any) => 
              sum + (a.distance / 1609.34), 0
            );
            const totalRuns = streakActivities.length;
            
            historicalStreaks.push({
              start_date: currentHistoricalStreak.start.toISOString().split('T')[0],
              end_date: currentHistoricalStreak.end.toISOString().split('T')[0],
              days_count: currentHistoricalStreak.dates.size,
              total_miles: totalMiles,
              total_runs: totalRuns
            });
          }
          
          // Start new streak
          currentHistoricalStreak = {
            start: currentDate,
            end: currentDate,
            dates: new Set([dateStr])
          };
        }
      }
    }
    
    // Don't forget the last streak
    if (currentHistoricalStreak && currentHistoricalStreak.dates.size >= 5) {
      const streakActivities = allActivities.filter((a: any) => {
        const aDate = new Date(a.start_date).toISOString().split('T')[0];
        return currentHistoricalStreak!.dates.has(aDate);
      });
      
      const totalMiles = streakActivities.reduce((sum: number, a: any) => 
        sum + (a.distance / 1609.34), 0
      );
      const totalRuns = streakActivities.length;
      
      historicalStreaks.push({
        start_date: currentHistoricalStreak.start.toISOString().split('T')[0],
        end_date: currentHistoricalStreak.end.toISOString().split('T')[0],
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

    // Update runner stats
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
