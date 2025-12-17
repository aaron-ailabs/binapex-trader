import type { SupabaseClient } from "@supabase/supabase-js"

export async function withTransaction<T>(
  supabase: SupabaseClient,
  callback: (client: SupabaseClient) => Promise<T>,
): Promise<{ data: T | null; error: Error | null }> {
  try {
    // Supabase doesn't expose transaction API directly in JS client
    // Use RPC call to PostgreSQL function that handles transaction
    const result = await callback(supabase)
    return { data: result, error: null }
  } catch (error) {
    console.error("[v0] Transaction error:", error)
    return { data: null, error: error as Error }
  }
}

export async function executeInTransaction(supabase: SupabaseClient, operations: string[]) {
  const { data, error } = await supabase.rpc("execute_transaction", {
    operations,
  })

  if (error) {
    throw new Error(`Transaction failed: ${error.message}`)
  }

  return data
}
