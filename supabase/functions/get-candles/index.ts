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

    let symbol, resolution, limit;

    // Support both GET (query params) and POST (body)
    if (req.method === 'POST') {
        const body = await req.json()
        symbol = body.symbol
        resolution = body.resolution || '1h'
        limit = body.limit || 100
    } else {
        const url = new URL(req.url)
        symbol = url.searchParams.get('symbol')
        resolution = url.searchParams.get('resolution') || '1h'
        limit = parseInt(url.searchParams.get('limit') || '100')
    }

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

    const { data: candles, error: candlesError } = await supabaseClient
      .from('candles')
      .select('*')
      .eq('asset_id', asset.id)
      .eq('resolution', resolution)
      .order('timestamp', { ascending: false })
      .limit(limit)

    if (candlesError) throw candlesError

    // Return in ascending order for charts
    const sortedCandles = candles ? candles.reverse() : []

    return new Response(
      JSON.stringify(sortedCandles),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
