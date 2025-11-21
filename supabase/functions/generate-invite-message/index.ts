import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { runnerId } = await req.json();
    
    if (!runnerId) {
      return new Response(JSON.stringify({ error: 'Runner ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch runner data
    const { data: runner, error: runnerError } = await supabase
      .from('runners')
      .select('*')
      .eq('id', runnerId)
      .single();

    if (runnerError || !runner) {
      return new Response(JSON.stringify({ error: 'Runner not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch runner's referral stats
    const { data: referrals } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', runnerId);

    const completedReferrals = referrals?.filter(r => r.signup_completed).length || 0;
    const totalReferrals = referrals?.length || 0;

    // Build context for AI
    const runnerContext = {
      displayName: runner.display_name,
      currentStreak: runner.current_streak_days || 0,
      longestStreak: runner.longest_streak_ever || 0,
      totalMiles: runner.all_time_distance ? (runner.all_time_distance / 1609.34).toFixed(0) : 0,
      location: [runner.city, runner.state, runner.country].filter(Boolean).join(', '),
      completedReferrals,
      totalReferrals,
    };

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are a friendly running coach helping create personalized invite messages for RunStreaks, a platform that tracks daily running streaks. Create a short, engaging, and authentic invite message (2-3 sentences max) that:
1. Highlights the runner's achievements naturally (current streak, miles, etc.)
2. Invites friends to join the streak accountability community
3. Feels personal and conversational, not salesy
4. Includes enthusiasm about the streak journey

Keep it concise, authentic, and motivating. DO NOT include placeholders like [link] or [referral code] - those will be added automatically.`;

    const userPrompt = `Create an invite message for ${runnerContext.displayName}:
- Current streak: ${runnerContext.currentStreak} days
- Longest streak ever: ${runnerContext.longestStreak} days
- Total miles: ${runnerContext.totalMiles}
- Location: ${runnerContext.location || 'Unknown'}
- Has referred ${runnerContext.completedReferrals} runners successfully

Make it personal and authentic to their running journey.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limits exceeded, please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required, please add funds to your Lovable AI workspace.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      return new Response(JSON.stringify({ error: 'AI gateway error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const generatedMessage = data.choices[0].message.content;

    return new Response(JSON.stringify({ message: generatedMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-invite-message function:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
