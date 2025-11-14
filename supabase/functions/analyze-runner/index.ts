import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { runnerData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Fetch daily activities to analyze training blocks
    const activitiesResponse = await fetch(
      `${supabaseUrl}/rest/v1/daily_activities?runner_id=eq.${runnerData.id}&order=activity_date.desc&limit=365`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      }
    );
    const activities = await activitiesResponse.json();

    // Find best training blocks (7-day and 30-day periods)
    let bestWeekMiles = 0;
    let bestWeekStart = '';
    let bestMonthMiles = 0;
    let bestMonthStart = '';

    if (activities && activities.length > 0) {
      // Calculate best 7-day block
      for (let i = 0; i < Math.min(activities.length - 6, 365); i++) {
        const weekMiles = activities.slice(i, i + 7).reduce((sum: number, a: any) => sum + (a.distance / 1609.34), 0);
        if (weekMiles > bestWeekMiles) {
          bestWeekMiles = weekMiles;
          bestWeekStart = activities[i].activity_date;
        }
      }

      // Calculate best 30-day block
      for (let i = 0; i < Math.min(activities.length - 29, 365); i++) {
        const monthMiles = activities.slice(i, i + 30).reduce((sum: number, a: any) => sum + (a.distance / 1609.34), 0);
        if (monthMiles > bestMonthMiles) {
          bestMonthMiles = monthMiles;
          bestMonthStart = activities[i].activity_date;
        }
      }
    }

    const prompt = `Analyze this runner's performance data and provide 3 concise insights:

Runner Stats:
- Current Streak: ${runnerData.current_streak_days} days
- Streak Miles: ${runnerData.current_streak_miles} miles
- Average Miles/Day: ${runnerData.average_miles_per_day}
- YTD Runs: ${runnerData.ytd_run_count}
- YTD Distance: ${runnerData.ytd_distance} miles
- All-Time Distance: ${runnerData.all_time_distance} miles
- Longest Streak: ${runnerData.longest_streak_ever} days

Peak Training Blocks:
- Best 7-Day Block: ${bestWeekMiles.toFixed(1)} miles (starting ${bestWeekStart})
- Best 30-Day Block: ${bestMonthMiles.toFixed(1)} miles (starting ${bestMonthStart})

Provide exactly 3 insights in this JSON format:
{
  "insights": [
    {"title": "short title", "description": "2-3 sentence insight"},
    {"title": "short title", "description": "2-3 sentence insight"},
    {"title": "short title", "description": "2-3 sentence insight"}
  ]
}

Focus on: consistency patterns, performance trends, peak training blocks, and motivational observations.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a running performance analyst. Provide motivational and data-driven insights.' },
          { role: 'user', content: prompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "provide_insights",
              description: "Return 3 running performance insights",
              parameters: {
                type: "object",
                properties: {
                  insights: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" }
                      },
                      required: ["title", "description"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["insights"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "provide_insights" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error('Failed to get AI analysis');
    }

    const data = await response.json();
    const toolCall = data.choices[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No tool call in response');
    }

    const insights = JSON.parse(toolCall.function.arguments);
    
    return new Response(JSON.stringify(insights), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
