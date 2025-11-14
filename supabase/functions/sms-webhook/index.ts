import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const from = formData.get('From') as string;
    const body = formData.get('Body') as string;
    const messageId = formData.get('MessageSid') as string;

    console.log('Incoming SMS:', { from, body, messageId });

    if (!from || !body) {
      throw new Error('Missing required fields');
    }

    // Find user by phone number
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const settingsResponse = await fetch(
      `${supabaseUrl}/rest/v1/user_settings?phone_number=eq.${from}&select=*`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      }
    );

    const settings = await settingsResponse.json();
    
    if (!settings || settings.length === 0) {
      console.log('No user found with phone number:', from);
      return new Response('OK', { status: 200 });
    }

    const userSettings = settings[0];

    if (!userSettings.ai_coach_enabled) {
      console.log('AI coach not enabled for user:', from);
      return new Response('OK', { status: 200 });
    }

    // Get runner data for context
    const runnerResponse = await fetch(
      `${supabaseUrl}/rest/v1/runners?id=eq.${userSettings.runner_id}&select=*`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      }
    );

    const runners = await runnerResponse.json();
    const runner = runners[0];

    // Generate AI response
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    const coachingStylePrompts = {
      motivational: "You are an enthusiastic and motivating running coach. Be upbeat and encouraging.",
      analytical: "You are a data-driven running coach. Focus on metrics, trends, and objective analysis.",
      supportive: "You are a supportive and empathetic running coach. Be understanding and patient.",
      challenging: "You are a challenging running coach who pushes athletes to their limits. Be direct and demanding."
    };

    const systemPrompt = `${coachingStylePrompts[userSettings.ai_coach_style as keyof typeof coachingStylePrompts] || coachingStylePrompts.motivational}

Runner Stats:
- Current streak: ${runner.current_streak_days || 0} days
- Year-to-date distance: ${((runner.ytd_distance || 0) / 1609.34).toFixed(1)} miles
- Average pace: ${runner.average_miles_per_day || 0} miles/day

Keep responses under 160 characters for SMS. Be conversational and personal.`;

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
          { role: 'user', content: body }
        ],
        max_tokens: 100,
      }),
    });

    const aiData = await aiResponse.json();
    const aiMessage = aiData.choices[0].message.content;

    // Send SMS response via Twilio
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
        To: from,
        From: TWILIO_PHONE_NUMBER!,
        Body: aiMessage,
      }),
    });

    if (!twilioResponse.ok) {
      const errorText = await twilioResponse.text();
      console.error('Twilio error:', errorText);
      throw new Error('Failed to send SMS');
    }

    console.log('AI response sent successfully');

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Error in sms-webhook:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
});
