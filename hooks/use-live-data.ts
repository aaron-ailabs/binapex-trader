"use client"

import { useEffect, useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import type { RealtimeChannel } from "@supabase/supabase-js"
import { useAuth } from "@/contexts/auth-context"

export function useLiveData<T>(table: string, initialData: T[], orderBy?: { column: string; ascending: boolean }) {
  const [data, setData] = useState<T[]>(initialData)
  const { user } = useAuth()
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    if (!user) return
    let channel: RealtimeChannel

    const setupChannel = () => {
      channel = supabase
        .channel(`${table}-changes`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: table,
          },
          (payload) => {
            console.log(`[v0] New ${table} insert:`, payload)
            setData((current) => {
              const newData = [payload.new as T, ...current]
              if (orderBy) {
                return newData.sort((a: any, b: any) => {
                  const aVal = a[orderBy.column]
                  const bVal = b[orderBy.column]
                  if (orderBy.ascending) {
                    return aVal > bVal ? 1 : -1
                  }
                  return aVal < bVal ? 1 : -1
                })
              }
              return newData
            })
          },
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: table,
          },
          (payload) => {
            console.log(`[v0] ${table} update:`, payload)
            setData((current) => current.map((item: any) => (item.id === payload.new.id ? (payload.new as T) : item)))
          },
        )
        .on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: table,
          },
          (payload) => {
            console.log(`[v0] ${table} delete:`, payload)
            setData((current) => current.filter((item: any) => item.id !== payload.old.id))
          },
        )
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR') {
            console.error(`Realtime subscription error for ${table}-changes`)
          }
        })
    }

    setupChannel()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [table, user, supabase, orderBy])

  return data
}
