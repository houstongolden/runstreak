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

    // Get recent conversation history for context
    const messagesResponse = await fetch(
      `${supabaseUrl}/rest/v1/coach_messages?runner_id=eq.${runner_id}&order=created_at.desc&limit=10`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      }
    );
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

      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      
      const coachingStylePrompts = {
        motivational: "You are an enthusiastic and motivating running coach. Be upbeat and encouraging.",
        analytical: "You are a data-driven running coach. Focus on metrics, trends, and objective analysis.",
        supportive: "You are a supportive and empathetic running coach. Be understanding and patient.",
        challenging: "You are a challenging running coach who pushes athletes to their limits. Be direct and demanding."
      };

      const timeOfDay = new Date().getHours();
      const greeting = timeOfDay < 12 ? 'morning' : timeOfDay < 18 ? 'afternoon' : 'evening';

      // Calculate average pace from YTD data
      const avgPaceMinutes = runner.ytd_moving_time && runner.ytd_distance 
        ? Math.floor((runner.ytd_moving_time / 60) / (runner.ytd_distance / 1609.34))
        : 10;
      const avgPaceSeconds = runner.ytd_moving_time && runner.ytd_distance
        ? Math.round(((runner.ytd_moving_time / 60) / (runner.ytd_distance / 1609.34) % 1) * 60)
        : 0;

      const systemPrompt = `${coachingStylePrompts[userSettings.ai_coach_style as keyof typeof coachingStylePrompts] || coachingStylePrompts.motivational}

Runner Stats:
- Name: ${runner.display_name}
- Current streak: ${runner.current_streak_days || 0} days (${((runner.current_streak_miles || 0) / 1609.34).toFixed(1)} miles)
- Year-to-date: ${runner.ytd_run_count || 0} runs, ${((runner.ytd_distance || 0) / 1609.34).toFixed(1)} miles
- Average pace: ${avgPaceMinutes}'${avgPaceSeconds}" per mile
- Last activity: ${runner.last_activity_date || 'Unknown'}

Generate a personalized coaching message for this ${greeting}. Keep it under 160 characters for SMS. Be specific about their stats and encouraging.
IMPORTANT: Include an encouraging reminder like "It'll only take you about ${avgPaceMinutes} minutes to keep your streak alive today—you'll never regret it!"`;

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

      const coachingStylePrompts = {
        motivational: "You are an enthusiastic and motivating running coach. Be upbeat and encouraging.",
        analytical: "You are a data-driven running coach. Focus on metrics, trends, and objective analysis.",
        supportive: "You are a supportive and empathetic running coach. Be understanding and patient.",
        challenging: "You are a challenging running coach who pushes athletes to their limits. Be direct and demanding."
      };

      const systemPrompt = `${coachingStylePrompts[userSettings.ai_coach_style as keyof typeof coachingStylePrompts] || coachingStylePrompts.motivational}

Runner Stats:
- Name: ${runner.display_name}
- Current streak: ${runner.current_streak_days || 0} days (${((runner.current_streak_miles || 0) / 1609.34).toFixed(1)} miles)
- Year-to-date: ${runner.ytd_run_count || 0} runs, ${((runner.ytd_distance || 0) / 1609.34).toFixed(1)} miles

Keep responses conversational and helpful. ${source === 'sms' ? 'Keep under 160 characters for SMS.' : ''}`;

      // Stream response for app, non-stream for SMS
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
          max_tokens: source === 'sms' ? 100 : 300,
          stream: source === 'app', // Enable streaming for app
        }),
      });

      // If streaming for app, return the stream directly
      if (source === 'app') {
        return new Response(aiResponse.body, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        });
      }

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
    if (session_id) {
      messagePayload.session_id = session_id;
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
