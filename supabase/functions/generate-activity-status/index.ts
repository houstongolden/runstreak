import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { runnerId, activityDate } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get runner data
    const { data: runner, error: runnerError } = await supabase
      .from('runners')
      .select('display_name, current_streak_days')
      .eq('id', runnerId)
      .single();

    if (runnerError) throw runnerError;

    // Get activity data for that date
    const { data: activity, error: activityError } = await supabase
      .from('daily_activities')
      .select('distance, moving_time, run_count')
      .eq('runner_id', runnerId)
      .eq('activity_date', activityDate)
      .single();

    if (activityError) throw activityError;

    // Generate AI status
    const miles = (activity.distance / 1609.34).toFixed(2);
    const minutes = Math.floor(activity.moving_time / 60);
    
    const prompt = `Generate a short, motivational status update (max 100 chars) for ${runner.display_name} who just ran ${miles} miles in ${minutes} minutes, keeping their ${runner.current_streak_days}-day streak alive. Make it encouraging and personal. Just return the text, no quotes.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a motivational running coach. Generate short, encouraging status updates.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    const aiData = await response.json();
    const statusText = aiData.choices[0].message.content.trim();

    // Upsert the status
    const { data: status, error: statusError } = await supabase
      .from('activity_status')
      .upsert({
        runner_id: runnerId,
        activity_date: activityDate,
        status_text: statusText,
      }, {
        onConflict: 'runner_id,activity_date'
      })
      .select()
      .single();

    if (statusError) throw statusError;

    return new Response(JSON.stringify({ status }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating activity status:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
