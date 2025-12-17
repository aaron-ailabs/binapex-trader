
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const assets = [
  // FOREX
  { symbol: "SGD=X", name: "USD/SGD", type: "forex", price: 1.29 },
  { symbol: "PHP=X", name: "USD/PHP", type: "forex", price: 59.06 },
  { symbol: "NZD=X", name: "USD/NZD", type: "forex", price: 1.72 },
  { symbol: "EUR=X", name: "USD/EUR", type: "forex", price: 0.85 },
  { symbol: "MYR=X", name: "USD/MYR", type: "forex", price: 4.09 },
  { symbol: "AUD=X", name: "USD/AUD", type: "forex", price: 1.5 },
  { symbol: "GBP=X", name: "USD/GBP", type: "forex", price: 0.75 },
  { symbol: "JPY=X", name: "USD/JPY", type: "forex", price: 155.75 },
  { symbol: "THB=X", name: "USD/THB", type: "forex", price: 31.56 },
  { symbol: "IDR=X", name: "USD/IDR", type: "forex", price: 16635.0 },
  { symbol: "HKD=X", name: "USD/HKD", type: "forex", price: 7.78 },
  { symbol: "KRW=X", name: "USD/KRW", type: "forex", price: 1477.3 },
  // STOCKS
  { symbol: "WMT", name: "Walmart", type: "stock", price: 116.7 },
  { symbol: "AVGO", name: "Broadcom Inc.", type: "stock", price: 359.93 },
  { symbol: "GOOGL", name: "Alphabet Inc.", type: "stock", price: 309.29 },
  { symbol: "GOOG", name: "Google", type: "stock", price: 310.52 },
  { symbol: "MSFT", name: "Microsoft Corp.", type: "stock", price: 478.53 },
  { symbol: "NVDA", name: "NVIDIA Corp.", type: "stock", price: 175.02 },
  { symbol: "AMZN", name: "Amazon.com, Inc.", type: "stock", price: 226.19 },
  { symbol: "META", name: "Meta Platforms, Inc.", type: "stock", price: 644.23 },
  { symbol: "AAPL", name: "Apple Inc.", type: "stock", price: 278.28 },
  { symbol: "JPM", name: "JP Morgan Chase", type: "stock", price: 318.52 },
  { symbol: "LLY", name: "Eli Lilly and Company", type: "stock", price: 1027.51 },
  { symbol: "TSLA", name: "Tesla, Inc.", type: "stock", price: 458.96 },
  // COMMODITIES
  { symbol: "GC=F", name: "COMEX Gold", type: "commodity", price: 4328.3 },
  { symbol: "ALI=F", name: "Aluminum Futures", type: "commodity", price: 2855.75 },
  { symbol: "HG=F", name: "Copper", type: "commodity", price: 5.36 },
  { symbol: "PA=F", name: "Palladium", type: "commodity", price: 1542.7 },
  { symbol: "PL=F", name: "Platinum", type: "commodity", price: 1762.5 },
  { symbol: "SIL=F", name: "Micro Silver", type: "commodity", price: 62.01 },
  { symbol: "BZ=F", name: "Brent Crude Oil", type: "commodity", price: 61.12 },
  { symbol: "CL=F", name: "Crude Oil", type: "commodity", price: 57.44 },
  { symbol: "NG=F", name: "Natural Gas", type: "commodity", price: 4.11 },
  { symbol: "RB=F", name: "RBOB Gasoline", type: "commodity", price: 1.75 },
  { symbol: "HO=F", name: "Heating Oil", type: "commodity", price: 2.19 },
  { symbol: "KC=F", name: "Coffee Futures", type: "commodity", price: 369.55 },
  // CRYPTO
  { symbol: "BTC-USD", name: "Bitcoin", type: "crypto", price: 90349.22 },
  { symbol: "ETH-USD", name: "Ethereum", type: "crypto", price: 3111.66 },
  { symbol: "BCH-USD", name: "Bitcoin Cash", type: "crypto", price: 576.38 },
  { symbol: "USDT-USD", name: "Tether USD", type: "crypto", price: 1.0 },
  { symbol: "ETC-USD", name: "Ethereum Classic", type: "crypto", price: 13.19 },
  { symbol: "UNI7083-USD", name: "Uniswap", type: "crypto", price: 5.45 },
  { symbol: "LINK-USD", name: "Chainlink", type: "crypto", price: 13.76 },
  { symbol: "SOL-USD", name: "Solana", type: "crypto", price: 133.01 },
  { symbol: "DOGE-USD", name: "Dogecoin", type: "crypto", price: 0.14 },
  { symbol: "ADA-USD", name: "Cardano", type: "crypto", price: 0.41 },
  { symbol: "MATIC-USD", name: "Polygon", type: "crypto", price: 0.22 },
  { symbol: "LTC-USD", name: "Litecoin", type: "crypto", price: 81.65 },
];

async function seed() {
  console.log(`Seeding ${assets.length} assets...`);
  
  for (const asset of assets) {
    const { data: assetData, error: assetError } = await supabase
      .from("assets")
      .upsert(
        {
          symbol: asset.symbol,
          name: asset.name,
          type: asset.type,
          is_active: true,
        },
        { onConflict: "symbol" }
      )
      .select()
      .single();

    if (assetError) {
      console.error(`Error seeding asset ${asset.symbol}:`, assetError);
      continue;
    }

    const { error: tickerError } = await supabase
      .from("tickers")
      .upsert(
        {
          asset_id: assetData.id,
          price: asset.price,
        },
        { onConflict: "asset_id" }
      );

    if (tickerError) {
      console.error(`Error seeding ticker for ${asset.symbol}:`, tickerError);
    } else {
    //   console.log(`Seeded ${asset.symbol} at $${asset.price}`);
    }
  }

  console.log("Seeding complete!");
}

seed();
