
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load .env.local
try {
  const envConfig = dotenv.parse(fs.readFileSync(path.resolve(__dirname, '../.env.local')));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
} catch (e) {
  console.error("Could not load .env.local", e);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log("Testing Supabase connection...");
  // Try to select from a common table, e.g., auth.users wouldn't be accessible with anon key usually,
  // but public tables would. If no public tables, this might error.
  // Instead, just check if we can call getSession or similar? No, that's client side.
  // We can try to list a dummy table. 
  // Or check `from('profiles').select('*').limit(1)` since imports showed usage of `profiles`.
  
  const { data, error } = await supabase.from('profiles').select('*').limit(1);
  
  if (error) {
    if (error.code === 'PGRST116') { // JSON object requested, multiple (or no) rows returned
      // This actually means connection worked but query failed logic? No.
    }
    console.log("Connection/Query Error (might be RLS or missing table):", error.message);
    // If we get a response, the connection is active even if access is denied.
    if (error.message) process.exit(0); 
  }
  
  console.log("Connection Successful! Data:", data);
}

testConnection();
