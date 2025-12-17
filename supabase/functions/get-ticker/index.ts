import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const url = new URL(req.url)
    const symbol = url.searchParams.get('symbol')

    if (!symbol) {
      return new Response(
        JSON.stringify({ error: 'Symbol is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // First get asset id
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

    const { data: ticker, error: tickerError } = await supabaseClient
      .from('tickers')
      .select('*')
      .eq('asset_id', asset.id)
      .single()

    if (tickerError) throw tickerError

    return new Response(
      JSON.stringify(ticker),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
