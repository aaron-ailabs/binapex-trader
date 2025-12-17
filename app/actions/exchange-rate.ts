"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"

export async function getExchangeRate(pair: string = "USD-MYR") {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("exchange_rates")
    .select("rate, updated_at")
    .eq("currency_pair", pair)
    .single()

  if (error) {
    console.error("Error fetching exchange rate:", error)
    return { rate: 0, lastUpdated: null }
  }

  return { rate: Number(data.rate), lastUpdated: data.updated_at }
}

export async function updateExchangeRate(rate: number, pair: string = "USD-MYR") {
  const supabase = await createClient()

  // Verify admin status
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Unauthorized" }
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (profile?.role !== "admin") {
    return { error: "Unauthorized: Admin access required" }
  }

  const { error } = await supabase
    .from("exchange_rates")
    .update({
      rate,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    })
    .eq("currency_pair", pair)

  if (error) {
    console.error("Error updating exchange rate:", error)
    return { error: "Failed to update exchange rate" }
  }

  revalidatePath("/admin/finance")
  revalidatePath("/deposit")
  return { success: true }
}
