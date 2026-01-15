"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { PlatformBankAccount, RealtimePayload } from "@/lib/types/admin-shared"

/**
 * Hook to fetch and subscribe to platform bank accounts
 *
 * This hook provides real-time updates when admin adds/modifies/removes
 * bank account options for deposits. Used in deposit page to show
 * available payment options.
 *
 * @returns {object} - Object containing banks, loading state, and error
 */
export function usePlatformBanks() {
  const [banks, setBanks] = useState<PlatformBankAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    // Initial fetch
    async function fetchBanks() {
      try {
        setLoading(true)
        setError(null)

        const { data, error: fetchError } = await supabase
          .from("platform_bank_accounts")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: true })

        if (fetchError) {
          throw fetchError
        }

        setBanks(data || [])
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch bank accounts"
        setError(errorMessage)
        console.error("[usePlatformBanks] Fetch error:", errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchBanks()

    // Subscribe to realtime updates
    const channel = supabase
      .channel("platform-banks-changes")
      .on<PlatformBankAccount>(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "platform_bank_accounts"
        },
        (payload: RealtimePayload<PlatformBankAccount>) => {
          console.log("[usePlatformBanks] New bank account added:", payload.new)
          if (payload.new.is_active) {
            setBanks((prev) => [...prev, payload.new])
          }
        }
      )
      .on<PlatformBankAccount>(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "platform_bank_accounts"
        },
        (payload: RealtimePayload<PlatformBankAccount>) => {
          console.log("[usePlatformBanks] Bank account updated:", payload.new)
          setBanks((prev) =>
            prev
              .map((bank) => (bank.id === payload.new.id ? payload.new : bank))
              .filter((bank) => bank.is_active) // Remove inactive banks
          )
        }
      )
      .on<PlatformBankAccount>(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "platform_bank_accounts"
        },
        (payload: RealtimePayload<PlatformBankAccount>) => {
          console.log("[usePlatformBanks] Bank account deleted:", payload.old)
          setBanks((prev) => prev.filter((bank) => bank.id !== payload.old.id))
        }
      )
      .subscribe((status) => {
        console.log("[usePlatformBanks] Subscription status:", status)
      })

    // Cleanup
    return () => {
      console.log("[usePlatformBanks] Unsubscribing from realtime channel")
      supabase.removeChannel(channel)
    }
  }, [])

  return { banks, loading, error, refetch: () => setLoading(true) }
}

/**
 * Hook to get a single platform bank account by ID
 */
export function usePlatformBank(bankId: string | null) {
  const [bank, setBank] = useState<PlatformBankAccount | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!bankId) {
      setLoading(false)
      return
    }

    const supabase = createClient()

    async function fetchBank() {
      try {
        setLoading(true)
        setError(null)

        const { data, error: fetchError } = await supabase
          .from("platform_bank_accounts")
          .select("*")
          .eq("id", bankId)
          .single()

        if (fetchError) {
          throw fetchError
        }

        setBank(data)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch bank account"
        setError(errorMessage)
        console.error("[usePlatformBank] Fetch error:", errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchBank()
  }, [bankId])

  return { bank, loading, error }
}
