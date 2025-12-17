
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verify() {
  const { count: assetCount, error: assetError } = await supabase
    .from("assets")
    .select("*", { count: "exact", head: true });

  if (assetError) console.error("Asset check error:", assetError);
  else console.log(`Assets count: ${assetCount}`);

  const { count: tickerCount, error: tickerError } = await supabase
    .from("tickers")
    .select("*", { count: "exact", head: true });

  if (tickerError) console.error("Ticker check error:", tickerError.message);
  else console.log(`Tickers count: ${tickerCount}`);
}

verify();
