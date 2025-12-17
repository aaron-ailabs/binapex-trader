import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Get user from token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
        return new Response(
            JSON.stringify({ error: 'Invalid token' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    const { symbol, side, type, size, leverage, price } = await req.json()

    if (!symbol || !side || !type || !size) {
        return new Response(
            JSON.stringify({ error: 'Missing required fields' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    // Get asset id
    const { data: asset, error: assetError } = await supabaseClient
        .from('assets')
        .select('id')
        .eq('symbol', symbol)
        .single()

    if (assetError || !asset) {
        return new Response(
            JSON.stringify({ error: 'Asset not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    // Insert order (Using Service Role would be safer for balance checks etc, but following schema for now)
    // For a real app, we should check balance here before placing order.
    // Assuming 'orders' table RLS allows insert for authenticated users, or we use service role here for full control.
    
    // Switch to service role client for order placement to bypass RLS complications if any, or strictly enforce server-side validation.
    // Actually, let's stick to the authenticated client for now as per schema "Users can create orders".
    // But realistically, a trading engine needs more checks.
    
    const orderData = {
        user_id: user.id,
        asset_id: asset.id,
        side,
        type,
        size,
        leverage: leverage || 1,
        price: price || null, // Market orders might have null price initially or filled price
        status: 'pending'   
    }

    const { data: order, error: orderError } = await supabaseClient
        .from('orders')
        .insert(orderData)
        .select()
        .single()

    if (orderError) throw orderError

    return new Response(
      JSON.stringify(order),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
