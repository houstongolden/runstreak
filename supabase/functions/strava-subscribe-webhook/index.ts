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
    // Verify admin access
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    // Check if user is admin
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    const { action } = await req.json();
    const clientId = Deno.env.get('STRAVA_CLIENT_ID');
    const clientSecret = Deno.env.get('STRAVA_CLIENT_SECRET');
    const verifyToken = Deno.env.get('STRAVA_WEBHOOK_VERIFY_TOKEN');
    const callbackUrl = `${supabaseUrl}/functions/v1/strava-webhook`;

    if (!clientId || !clientSecret || !verifyToken) {
      return new Response(
        JSON.stringify({ error: 'Missing required environment variables' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    // Handle different actions
    if (action === 'subscribe') {
      console.log('Subscribing to Strava webhooks...');
      console.log('Callback URL:', callbackUrl);

      // Subscribe to Strava webhooks
      const subscribeResponse = await fetch(
        'https://www.strava.com/api/v3/push_subscriptions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            callback_url: callbackUrl,
            verify_token: verifyToken,
          }),
        }
      );

      const subscribeData = await subscribeResponse.json();
      console.log('Strava subscription response:', subscribeData);

      if (!subscribeResponse.ok) {
        return new Response(
          JSON.stringify({
            error: 'Failed to subscribe',
            details: subscribeData,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: subscribeResponse.status,
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          subscription: subscribeData,
          message: 'Successfully subscribed to Strava webhooks',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } else if (action === 'list') {
      console.log('Listing Strava webhook subscriptions...');

      // List existing subscriptions
      const listResponse = await fetch(
        `https://www.strava.com/api/v3/push_subscriptions?client_id=${clientId}&client_secret=${clientSecret}`
      );

      const subscriptions = await listResponse.json();
      console.log('Existing subscriptions:', subscriptions);

      return new Response(
        JSON.stringify({
          subscriptions,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } else if (action === 'delete') {
      const { subscriptionId } = await req.json();
      
      if (!subscriptionId) {
        return new Response(
          JSON.stringify({ error: 'subscriptionId required for delete action' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        );
      }

      console.log('Deleting Strava webhook subscription:', subscriptionId);

      // Delete subscription
      const deleteResponse = await fetch(
        `https://www.strava.com/api/v3/push_subscriptions/${subscriptionId}?client_id=${clientId}&client_secret=${clientSecret}`,
        {
          method: 'DELETE',
        }
      );

      if (!deleteResponse.ok) {
        const errorData = await deleteResponse.json();
        return new Response(
          JSON.stringify({
            error: 'Failed to delete subscription',
            details: errorData,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: deleteResponse.status,
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Successfully deleted webhook subscription',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use: subscribe, list, or delete' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  } catch (error) {
    console.error('Error in strava-subscribe-webhook:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
