import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyCodeRequest {
  phoneNumber: string;
  code: string;
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
    const { phoneNumber, code }: VerifyCodeRequest = await req.json();

    if (!phoneNumber || !code) {
      return new Response(
        JSON.stringify({ error: "Phone number and code are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate code format (6 digits)
    if (!/^\d{6}$/.test(code)) {
      return new Response(
        JSON.stringify({ error: "Invalid code format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Hash the input code to compare with stored hash
    const hashedCode = await hashCode(code);

    // Find the most recent non-verified code for this phone number
    const { data: verificationCode, error: fetchError } = await supabase
      .from("phone_verification_codes")
      .select("*")
      .eq("phone_number", phoneNumber)
      .eq("code", hashedCode)
      .eq("verified", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !verificationCode) {
      console.log("Verification attempt failed");
      return new Response(
        JSON.stringify({ error: "Invalid or expired verification code" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark code as verified
    const { error: updateError } = await supabase
      .from("phone_verification_codes")
      .update({ verified: true })
      .eq("id", verificationCode.id);

    if (updateError) {
      console.error("Error updating verification status");
      throw new Error("Failed to verify code");
    }

    console.log("Phone verification successful");

    return new Response(
      JSON.stringify({ success: true, message: "Phone number verified successfully" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in verify-sms-code:", error.message);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to verify code" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
