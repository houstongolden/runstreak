import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendSMSRequest {
  phoneNumber: string;
}

// Hash function for verification codes
async function hashCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phoneNumber }: SendSMSRequest = await req.json();

    // Validate phone number format
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneNumber || !phoneRegex.test(phoneNumber)) {
      return new Response(
        JSON.stringify({ error: "Valid phone number in E.164 format is required (e.g., +1234567890)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Rate limiting: Check for recent codes (max 1 per minute)
    const { data: recentCodes } = await supabase
      .from('phone_verification_codes')
      .select('created_at')
      .eq('phone_number', phoneNumber)
      .gte('created_at', new Date(Date.now() - 60000).toISOString())
      .limit(1);

    if (recentCodes && recentCodes.length > 0) {
      return new Response(
        JSON.stringify({ error: 'Please wait at least 1 minute before requesting another code' }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate cryptographically secure 6-digit code
    const codeArray = new Uint32Array(1);
    crypto.getRandomValues(codeArray);
    const code = (100000 + (codeArray[0] % 900000)).toString();
    
    // Hash the code before storing
    const hashedCode = await hashCode(code);

    // Store hashed verification code in database
    const { error: dbError } = await supabase
      .from("phone_verification_codes")
      .insert({
        phone_number: phoneNumber,
        code: hashedCode,
      });

    if (dbError) {
      console.error("Database error storing verification code");
      throw new Error("Failed to store verification code");
    }

    // Send SMS via Twilio
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
    const body = new URLSearchParams({
      To: phoneNumber,
      From: twilioPhoneNumber!,
      Body: `Your RunStreak verification code is: ${code}. This code expires in 10 minutes.`,
    });

    const twilioResponse = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
      },
      body: body.toString(),
    });

    if (!twilioResponse.ok) {
      const errorText = await twilioResponse.text();
      console.error("Twilio error response:", {
        status: twilioResponse.status,
        statusText: twilioResponse.statusText,
        body: errorText
      });
      throw new Error(`Twilio error (${twilioResponse.status}): ${errorText}`);
    }

    console.log("Verification code sent successfully");

    return new Response(
      JSON.stringify({ success: true, message: "Verification code sent" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-verification-sms:", {
      message: error.message,
      stack: error.stack,
      error: error
    });
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send verification code" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
