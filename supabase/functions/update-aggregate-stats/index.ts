import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Fetching runners data...');

    // Fetch all runners with their days on streak data
    const { data: runners, error: runnersError } = await supabase
      .from('runners')
      .select('days_on_streak_since_joining, total_days_since_joining, days_on_streak_before_joining, total_days_before_joining, streak_status, all_time_distance');

    if (runnersError) {
      console.error('Error fetching runners:', runnersError);
      throw runnersError;
    }

    if (!runners || runners.length === 0) {
      console.log('No runners found');
      return new Response(
        JSON.stringify({ message: 'No runners to calculate stats' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Calculating stats for ${runners.length} runners`);

    let totalImprovement = 0;
    let totalPercentage = 0;
    let validImprovementCount = 0;
    let validPercentageCount = 0;
    let activeStreaksCount = 0;
    let totalMilesLogged = 0;

    runners.forEach(runner => {
      // Calculate percentage since joining
      if (runner.total_days_since_joining > 0) {
        const percentageSince = (runner.days_on_streak_since_joining / runner.total_days_since_joining) * 100;
        totalPercentage += percentageSince;
        validPercentageCount++;

        // Calculate improvement (only if we have before data)
        if (runner.total_days_before_joining > 0) {
          const percentageBefore = (runner.days_on_streak_before_joining / runner.total_days_before_joining) * 100;
          const improvement = percentageSince - percentageBefore;
          totalImprovement += improvement;
          validImprovementCount++;
        }
      }

      // Count active streaks
      if (runner.streak_status === 'active') {
        activeStreaksCount++;
      }

      // Sum total miles (convert from meters to miles)
      if (runner.all_time_distance) {
        totalMilesLogged += runner.all_time_distance * 0.000621371;
      }
    });

    const avgImprovement = validImprovementCount > 0 ? totalImprovement / validImprovementCount : 0;
    const avgPercentage = validPercentageCount > 0 ? totalPercentage / validPercentageCount : 0;

    console.log('Calculated stats:', {
      total_users: runners.length,
      avg_days_on_streak_improvement: avgImprovement,
      avg_days_on_streak_percentage: avgPercentage,
      total_miles_logged: totalMilesLogged,
      active_streaks_count: activeStreaksCount,
    });

    // Upsert aggregate stats for today
    const { error: upsertError } = await supabase
      .from('aggregate_stats')
      .upsert({
        stat_date: new Date().toISOString().split('T')[0],
        total_users: runners.length,
        avg_days_on_streak_improvement: avgImprovement,
        avg_days_on_streak_percentage: avgPercentage,
        total_miles_logged: totalMilesLogged,
        active_streaks_count: activeStreaksCount,
      }, {
        onConflict: 'stat_date'
      });

    if (upsertError) {
      console.error('Error upserting aggregate stats:', upsertError);
      throw upsertError;
    }

    console.log('Aggregate stats updated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        stats: {
          total_users: runners.length,
          avg_days_on_streak_improvement: avgImprovement,
          avg_days_on_streak_percentage: avgPercentage,
          total_miles_logged: totalMilesLogged,
          active_streaks_count: activeStreaksCount,
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error in update-aggregate-stats:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
