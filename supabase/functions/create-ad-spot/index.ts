import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Creating ad spot...');
    
    const { companyName, domain, description, logoUrl } = await req.json();

    // Validate required fields
    if (!companyName || !domain || !description) {
      console.error('Missing required fields');
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role key to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get the next display_order
    const { data: existingSpots, error: fetchError } = await supabaseAdmin
      .from('ad_spots')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1);

    if (fetchError) {
      console.error('Error fetching existing ad spots:', fetchError);
      throw fetchError;
    }

    const nextOrder = (existingSpots?.[0]?.display_order || 0) + 1;
    console.log('Next display order:', nextOrder);

    // Insert new ad spot
    const { data, error: insertError } = await supabaseAdmin
      .from('ad_spots')
      .insert({
        company_name: companyName,
        domain: domain,
        description: description,
        logo_url: logoUrl || null,
        display_order: nextOrder,
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting ad spot:', insertError);
      throw insertError;
    }

    console.log('Ad spot created successfully:', data.id);

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in create-ad-spot function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
