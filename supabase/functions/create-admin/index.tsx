/// <reference types="https://esm.sh/v135/@supabase/functions-js@2.1.5/src/edge-runtime.d.ts" />

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"
import { Deno } from "https://deno.land/std@0.170.0/runtime/mod.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    // Create admin client with service role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    )

    // Admin credentials
    const adminEmail = "admin.01@binapex.my"
    const adminPassword = "Admin888"

    // Check if admin already exists
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id, email, role")
      .eq("email", adminEmail)
      .single()

    if (existingProfile) {
      // User exists, just update to admin
      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({
          role: "admin",
          full_name: "System Administrator",
          balance_usd: 0,
          bonus_balance: 0,
          membership_tier: "diamond",
          kyc_verified: true,
          risk_mode: "neutral",
        })
        .eq("email", adminEmail)

      if (updateError) throw updateError

      return new Response(
        JSON.stringify({
          success: true,
          message: "Existing user promoted to admin",
          email: adminEmail,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        },
      )
    }

    // Create new admin user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        full_name: "System Administrator",
      },
    })

    if (authError) throw authError

    // Update profile to admin
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        role: "admin",
        full_name: "System Administrator",
        balance_usd: 0,
        bonus_balance: 0,
        membership_tier: "diamond",
        kyc_verified: true,
        risk_mode: "neutral",
      })
      .eq("id", authData.user.id)

    if (profileError) throw profileError

    return new Response(
      JSON.stringify({
        success: true,
        message: "Admin user created successfully",
        email: adminEmail,
        user_id: authData.user.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      },
    )
  }
})
