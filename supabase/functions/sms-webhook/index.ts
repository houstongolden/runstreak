import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
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

    console.log('Incoming SMS received');

    if (!from || !body) {
      throw new Error('Missing required fields');
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find user by phone number using Supabase client
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('phone_number', from)
      .maybeSingle();
    
    if (settingsError || !settings) {
      console.log('No user found for incoming SMS');
      return new Response('OK', { status: 200 });
    }

    const userSettings = settings;

    if (!userSettings.ai_coach_enabled) {
      console.log('AI coach not enabled for user');
      return new Response('OK', { status: 200 });
    }

    // Save user message to database
    const { error: messageError } = await supabase
      .from('coach_messages')
      .insert({
        runner_id: userSettings.runner_id,
        content: body,
        role: 'user',
        source: 'sms',
      });

    if (messageError) {
      console.error('Error saving message');
    }

    // Get runner data for context
    const { data: runner, error: runnerError } = await supabase
      .from('runners')
      .select('*')
      .eq('id', userSettings.runner_id)
      .single();

    if (runnerError || !runner) {
      console.error('Error fetching runner data');
      return new Response('OK', { status: 200 });
    }

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
        max_tokens: 150,
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      console.error('AI API error');
      throw new Error('Failed to get AI response');
    }

    const aiData = await aiResponse.json();
    const coachResponse = aiData.choices[0]?.message?.content || "Keep up the great work!";

    // Save coach response
    await supabase
      .from('coach_messages')
      .insert({
        runner_id: userSettings.runner_id,
        content: coachResponse,
        role: 'assistant',
        source: 'sms',
      });

    // Send SMS response using Account SID and Auth Token
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
    const responseBody = new URLSearchParams({
      To: from,
      From: twilioPhoneNumber!,
      Body: coachResponse,
    });

    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
      },
      body: responseBody.toString(),
    });

    if (!twilioResponse.ok) {
      console.error('SMS send error');
    } else {
      console.log('SMS response sent successfully');
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Error in sms-webhook:', error instanceof Error ? error.message : 'Unknown error');
    return new Response('OK', { status: 200 }); // Always return 200 to Twilio
  }
});
