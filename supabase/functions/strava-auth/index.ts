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
    
    // Import createClient dynamically
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.81.1');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get API mode from app_settings
    const { data: settingData } = await supabase
      .from('app_settings')
      .select('setting_value')
      .eq('setting_key', 'strava_api_mode')
      .maybeSingle();
    
    const apiMode = (settingData?.setting_value as 'live' | 'test') || 'live';
    
    const clientId = apiMode === 'test'
      ? Deno.env.get('STRAVA_CLIENT_ID_2')
      : Deno.env.get('STRAVA_CLIENT_ID');
    const redirectUri = `https://pazxdeeuhlwwdxmpmplo.supabase.co/functions/v1/strava-callback`;
    
    if (!clientId) {
      throw new Error('STRAVA_CLIENT_ID not configured');
    }

    const authUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&approval_prompt=force&scope=read,activity:read_all,profile:read_all`;

    return new Response(
      JSON.stringify({ authUrl }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in strava-auth:', error);
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
