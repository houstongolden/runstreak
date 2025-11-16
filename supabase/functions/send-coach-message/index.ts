import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendMessageRequest {
  runner_id: string;
  message?: string; // Optional: if not provided, will generate AI message
  source?: 'sms' | 'app'; // Where the message is coming from
  session_id?: string; // Optional: session ID for app messages
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { runner_id, message, source = 'sms', session_id }: SendMessageRequest = await req.json();

    if (!runner_id) {
      throw new Error('runner_id is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Get user settings
    const settingsResponse = await fetch(
      `${supabaseUrl}/rest/v1/user_settings?runner_id=eq.${runner_id}&select=*`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      }
    );

    const settings = await settingsResponse.json();
    
    let userSettings;
    
    // If no user settings exist, create default ones for app usage
    if (!settings || settings.length === 0) {
      if (source === 'app') {
        // For app usage, create default settings
        const createResponse = await fetch(
          `${supabaseUrl}/rest/v1/user_settings`,
          {
            method: 'POST',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            },
            body: JSON.stringify({
              runner_id: runner_id,
              ai_coach_enabled: true,
              ai_coach_style: 'motivational',
              ai_coach_frequency: 'daily',
              ai_coach_time: '09:00'
            })
          }
        );
        const newSettings = await createResponse.json();
        userSettings = Array.isArray(newSettings) ? newSettings[0] : newSettings;
      } else {
        throw new Error('User settings not found');
      }
    } else {
      userSettings = settings[0];
    }

    // Phone verification only required for SMS
    if (source === 'sms' && !userSettings.phone_verified) {
      throw new Error('Phone number not verified');
    }

    // AI coach enabled check only for automated messages
    if (source === 'sms' && !userSettings.ai_coach_enabled && !message) {
      throw new Error('AI coach not enabled');
    }

    let messageToSend = message;
    let conversationMessages: any[] = [];
    let currentSessionId = session_id;

    // For app messages with a user message, create/get session and save the user message first
    if (source === 'app' && message) {
      // Create or get session
      if (!currentSessionId) {
        const createSessionResponse = await fetch(
          `${supabaseUrl}/rest/v1/coaching_sessions`,
          {
            method: 'POST',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            },
            body: JSON.stringify({
              runner_id: runner_id,
              title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
              last_message_at: new Date().toISOString()
            })
          }
        );
        const newSession = await createSessionResponse.json();
        currentSessionId = Array.isArray(newSession) ? newSession[0].id : newSession.id;
      } else {
        // Update session last_message_at
        await fetch(
          `${supabaseUrl}/rest/v1/coaching_sessions?id=eq.${currentSessionId}`,
          {
            method: 'PATCH',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              last_message_at: new Date().toISOString()
            })
          }
        );
      }

      // Save user message to database
      await fetch(
        `${supabaseUrl}/rest/v1/coach_messages`,
        {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({
            runner_id: runner_id,
            content: message,
            role: 'user',
            source: source,
            session_id: currentSessionId
          }),
        }
      );
    }

    // Get recent conversation history for context
    let query = `${supabaseUrl}/rest/v1/coach_messages?runner_id=eq.${runner_id}&order=created_at.desc&limit=10`;
    if (currentSessionId) {
      query = `${supabaseUrl}/rest/v1/coach_messages?runner_id=eq.${runner_id}&session_id=eq.${currentSessionId}&order=created_at.desc&limit=10`;
    }
    
    const messagesResponse = await fetch(query, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    });
    const recentMessages = await messagesResponse.json();
    conversationMessages = recentMessages.reverse().map((m: any) => ({
      role: m.role,
      content: m.content
    }));

    // If no message provided, generate one with AI
    if (!messageToSend) {
      // Get runner data for context
      const runnerResponse = await fetch(
        `${supabaseUrl}/rest/v1/runners?id=eq.${runner_id}&select=*`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          },
        }
      );

      const runners = await runnerResponse.json();
      const runner = runners[0];

      // Get recent activities (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const activitiesResponse = await fetch(
        `${supabaseUrl}/rest/v1/daily_activities?runner_id=eq.${runner_id}&activity_date=gte.${thirtyDaysAgo.toISOString().split('T')[0]}&order=activity_date.desc`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          },
        }
      );
      const recentActivities = await activitiesResponse.json();

      // Get best efforts
      const bestEffortsResponse = await fetch(
        `${supabaseUrl}/rest/v1/best_efforts?runner_id=eq.${runner_id}&order=distance.asc`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          },
        }
      );
      const bestEfforts = await bestEffortsResponse.json();

      // Get streak history
      const streakHistoryResponse = await fetch(
        `${supabaseUrl}/rest/v1/streak_history?runner_id=eq.${runner_id}&order=days_count.desc&limit=5`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          },
        }
      );
      const streakHistory = await streakHistoryResponse.json();

      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      
      const coachingStylePrompts = {
        motivational: "You are an enthusiastic and motivating running coach. Be upbeat and encouraging.",
        analytical: "You are a data-driven running coach. Focus on metrics, trends, and objective analysis.",
        supportive: "You are a supportive and empathetic running coach. Be understanding and patient.",
        challenging: "You are a challenging running coach who pushes athletes to their limits. Be direct and demanding."
      };

      const timeOfDay = new Date().getHours();
      const greeting = timeOfDay < 12 ? 'morning' : timeOfDay < 18 ? 'afternoon' : 'evening';

      // Calculate statistics from recent activities
      const recentMiles = recentActivities.reduce((sum: number, a: any) => sum + (a.distance || 0), 0);
      const recentRuns = recentActivities.length;
      const avgRecentMiles = recentRuns > 0 ? recentMiles / recentRuns : 0;

      // Calculate average pace from YTD data
      const avgPaceMinutes = runner.ytd_moving_time && runner.ytd_distance 
        ? Math.floor((runner.ytd_moving_time / 60) / runner.ytd_distance)
        : 10;
      const avgPaceSeconds = runner.ytd_moving_time && runner.ytd_distance
        ? Math.round(((runner.ytd_moving_time / 60) / runner.ytd_distance % 1) * 60)
        : 0;

      // Format best efforts for context
      const bestEffortsText = bestEfforts.slice(0, 5).map((be: any) => {
        const distanceMiles = (be.distance / 1609.34).toFixed(2);
        const paceMin = Math.floor((be.moving_time / 60) / (be.distance / 1609.34));
        const paceSec = Math.round(((be.moving_time / 60) / (be.distance / 1609.34) % 1) * 60);
        return `${distanceMiles}mi in ${Math.floor(be.moving_time / 60)}:${String(be.moving_time % 60).padStart(2, '0')} (${paceMin}'${String(paceSec).padStart(2, '0')}/mi)`;
      }).join(', ');

      // Format streak history
      const streakHistoryText = streakHistory.map((sh: any) => 
        `${sh.days_count} days (${sh.total_miles.toFixed(1)}mi)`
      ).join(', ');

      const systemPrompt = `${coachingStylePrompts[userSettings.ai_coach_style as keyof typeof coachingStylePrompts] || coachingStylePrompts.motivational}

COMPREHENSIVE RUNNER DATA:

CURRENT STATUS:
- Name: ${runner.display_name}
- Current streak: ${runner.current_streak_days || 0} days, ${(runner.current_streak_miles || 0).toFixed(1)} miles
- Streak status: ${runner.streak_status || 'unknown'}
- Longest streak ever: ${runner.longest_streak_ever || 0} days
- Last activity: ${runner.last_activity_date || 'Unknown'}

ALL-TIME STATS:
- Total runs: ${runner.all_time_run_count || 0}
- Total distance: ${(runner.all_time_distance || 0).toFixed(1)} miles
- Average miles per day: ${(runner.average_miles_per_day || 0).toFixed(1)}

YEAR-TO-DATE (${new Date().getFullYear()}):
- Runs: ${runner.ytd_run_count || 0}
- Distance: ${(runner.ytd_distance || 0).toFixed(1)} miles
- Moving time: ${Math.floor((runner.ytd_moving_time || 0) / 3600)}h ${Math.floor(((runner.ytd_moving_time || 0) % 3600) / 60)}m
- Elevation gain: ${(runner.ytd_elevation_gain || 0).toFixed(0)} feet
- Average pace: ${avgPaceMinutes}'${String(avgPaceSeconds).padStart(2, '0')}" per mile

LAST 30 DAYS:
- Runs completed: ${recentRuns}
- Total distance: ${recentMiles.toFixed(1)} miles
- Average per run: ${avgRecentMiles.toFixed(1)} miles
- Days with activity: ${runner.days_on_streak_last_30 || 0} of 30

LAST 60/90 DAYS CONSISTENCY:
- Last 60 days: ${runner.days_on_streak_last_60 || 0} days active
- Last 90 days: ${runner.days_on_streak_last_90 || 0} days active

BEST EFFORTS:
${bestEffortsText || 'No best efforts recorded yet'}

STREAK HISTORY (Top 5):
${streakHistoryText || 'No previous streaks recorded'}

LOCATION:
- City: ${runner.city || 'Unknown'}, ${runner.state || 'Unknown'}

Generate a personalized coaching message for this ${greeting}. Keep it under 160 characters for SMS. Be specific about their actual stats and trends. ${runner.current_streak_days && runner.current_streak_days > 0 ? `Encourage them to keep their ${runner.current_streak_days}-day streak alive!` : 'Motivate them to start a new streak!'}`;

      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: 'Send me a coaching message' }
          ],
          max_tokens: 100,
        }),
      });

      const aiData = await aiResponse.json();
      messageToSend = aiData.choices[0].message.content;
    } else {
      // User sent a message, generate AI response with conversation context
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      const runnerResponse = await fetch(
        `${supabaseUrl}/rest/v1/runners?id=eq.${runner_id}&select=*`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          },
        }
      );
      const runners = await runnerResponse.json();
      const runner = runners[0];

      // Get recent activities (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const activitiesResponse = await fetch(
        `${supabaseUrl}/rest/v1/daily_activities?runner_id=eq.${runner_id}&activity_date=gte.${thirtyDaysAgo.toISOString().split('T')[0]}&order=activity_date.desc`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          },
        }
      );
      const recentActivities = await activitiesResponse.json();

      // Get best efforts
      const bestEffortsResponse = await fetch(
        `${supabaseUrl}/rest/v1/best_efforts?runner_id=eq.${runner_id}&order=distance.asc`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          },
        }
      );
      const bestEfforts = await bestEffortsResponse.json();

      // Get streak history
      const streakHistoryResponse = await fetch(
        `${supabaseUrl}/rest/v1/streak_history?runner_id=eq.${runner_id}&order=days_count.desc&limit=5`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          },
        }
      );
      const streakHistory = await streakHistoryResponse.json();

      const coachingStylePrompts = {
        motivational: "You are an enthusiastic and motivating running coach. Be upbeat and encouraging.",
        analytical: "You are a data-driven running coach. Focus on metrics, trends, and objective analysis.",
        supportive: "You are a supportive and empathetic running coach. Be understanding and patient.",
        challenging: "You are a challenging running coach who pushes athletes to their limits. Be direct and demanding."
      };

      // Calculate statistics from recent activities
      const recentMiles = recentActivities.reduce((sum: number, a: any) => sum + (a.distance || 0), 0);
      const recentRuns = recentActivities.length;
      const avgRecentMiles = recentRuns > 0 ? recentMiles / recentRuns : 0;

      // Calculate average pace
      const avgPaceMinutes = runner.ytd_moving_time && runner.ytd_distance 
        ? Math.floor((runner.ytd_moving_time / 60) / runner.ytd_distance)
        : 10;
      const avgPaceSeconds = runner.ytd_moving_time && runner.ytd_distance
        ? Math.round(((runner.ytd_moving_time / 60) / runner.ytd_distance % 1) * 60)
        : 0;

      // Format best efforts
      const bestEffortsText = bestEfforts.slice(0, 5).map((be: any) => {
        const distanceMiles = (be.distance / 1609.34).toFixed(2);
        const paceMin = Math.floor((be.moving_time / 60) / (be.distance / 1609.34));
        const paceSec = Math.round(((be.moving_time / 60) / (be.distance / 1609.34) % 1) * 60);
        return `${distanceMiles}mi in ${Math.floor(be.moving_time / 60)}:${String(be.moving_time % 60).padStart(2, '0')} (${paceMin}'${String(paceSec).padStart(2, '0')}/mi)`;
      }).join(', ');

      // Format streak history
      const streakHistoryText = streakHistory.map((sh: any) => 
        `${sh.days_count} days (${sh.total_miles.toFixed(1)}mi)`
      ).join(', ');

      // Format recent activity details
      const recentActivityDetails = recentActivities.slice(0, 10).map((a: any) => {
        const date = new Date(a.activity_date).toLocaleDateString();
        return `${date}: ${a.distance.toFixed(1)}mi in ${Math.floor(a.moving_time / 60)}min`;
      }).join('\n');

      const systemPrompt = `${coachingStylePrompts[userSettings.ai_coach_style as keyof typeof coachingStylePrompts] || coachingStylePrompts.motivational}

COMPREHENSIVE RUNNER DATA FOR ${runner.display_name}:

CURRENT STATUS:
- Current streak: ${runner.current_streak_days || 0} days, ${(runner.current_streak_miles || 0).toFixed(1)} miles
- Streak status: ${runner.streak_status || 'unknown'}
- Longest streak ever: ${runner.longest_streak_ever || 0} days
- Last activity: ${runner.last_activity_date || 'Unknown'}
- Streak start date: ${runner.streak_start_date || 'N/A'}

ALL-TIME STATS:
- Total runs: ${runner.all_time_run_count || 0}
- Total distance: ${(runner.all_time_distance || 0).toFixed(1)} miles
- Average miles per day: ${(runner.average_miles_per_day || 0).toFixed(1)}

YEAR-TO-DATE (${new Date().getFullYear()}):
- Runs: ${runner.ytd_run_count || 0}
- Distance: ${(runner.ytd_distance || 0).toFixed(1)} miles
- Moving time: ${Math.floor((runner.ytd_moving_time || 0) / 3600)}h ${Math.floor(((runner.ytd_moving_time || 0) % 3600) / 60)}m
- Elevation gain: ${(runner.ytd_elevation_gain || 0).toFixed(0)} feet
- Average pace: ${avgPaceMinutes}'${String(avgPaceSeconds).padStart(2, '0')}" per mile

LAST 30 DAYS:
- Runs completed: ${recentRuns}
- Total distance: ${recentMiles.toFixed(1)} miles
- Average per run: ${avgRecentMiles.toFixed(1)} miles
- Days with activity: ${runner.days_on_streak_last_30 || 0} of 30

RECENT ACTIVITIES (Last 10):
${recentActivityDetails || 'No recent activities'}

CONSISTENCY METRICS:
- Last 30 days: ${runner.days_on_streak_last_30 || 0} days active
- Last 60 days: ${runner.days_on_streak_last_60 || 0} days active
- Last 90 days: ${runner.days_on_streak_last_90 || 0} days active
- Since joining RunStreak: ${runner.days_on_streak_since_joining || 0} days out of ${runner.total_days_since_joining || 0} total days

BEST EFFORTS:
${bestEffortsText || 'No best efforts recorded yet'}

STREAK HISTORY (Top 5 Previous Streaks):
${streakHistoryText || 'No previous streaks recorded'}

LOCATION:
- ${runner.city || 'Unknown'}, ${runner.state || 'Unknown'}

Answer the runner's questions and provide coaching based on this comprehensive data. Be specific and reference actual numbers. ${source === 'sms' ? 'Keep under 160 characters for SMS.' : 'Provide detailed, helpful responses.'}`;

      // For app, get full response (no streaming to simplify)
      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            ...conversationMessages,
            { role: 'user', content: message }
          ],
          max_tokens: source === 'sms' ? 100 : 800,
          stream: false,
        }),
      });

      // For SMS, get the full response
      const aiData = await aiResponse.json();
      messageToSend = aiData.choices[0].message.content;
    }

    // Save AI response to database
    const messagePayload: any = {
      runner_id: runner_id,
      content: messageToSend,
      role: 'assistant',
      source: source,
    };
    
    // Add session_id if provided (for app messages)
    if (currentSessionId) {
      messagePayload.session_id = currentSessionId;
    }

    await fetch(
      `${supabaseUrl}/rest/v1/coach_messages`,
      {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify(messagePayload),
      }
    );

    // Only send SMS if source is 'sms' (not from app)
    let message_sid = null;
    if (source === 'sms') {
      const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
      const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
      const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER');

      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
      
      const twilioResponse = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: userSettings.phone_number,
          From: TWILIO_PHONE_NUMBER!,
          Body: messageToSend!,
        }),
      });

      if (!twilioResponse.ok) {
        const errorText = await twilioResponse.text();
        console.error('Twilio error:', errorText);
        throw new Error('Failed to send SMS');
      }

      const twilioData = await twilioResponse.json();
      message_sid = twilioData.sid;
      console.log('SMS sent successfully:', message_sid);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: messageToSend,
        message_sid: message_sid,
        source: source
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in send-coach-message:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
