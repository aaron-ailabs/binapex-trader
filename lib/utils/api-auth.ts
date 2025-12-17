import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function requireAuth() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    },
  )

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return { user: null, supabase, error: "Unauthorized" }
  }

  return { user, supabase, error: null }
}

export async function requireAdmin() {
  const { user, supabase, error } = await requireAuth()

  if (error || !user) {
    return { user: null, supabase, error: error || "Unauthorized", isAdmin: false }
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (profile?.role !== "admin") {
    return { user, supabase, error: "Forbidden: Admin access required", isAdmin: false }
  }

  return { user, supabase, error: null, isAdmin: true }
}

export function unauthorizedResponse(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 })
}

export function forbiddenResponse(message = "Forbidden") {
  return NextResponse.json({ error: message }, { status: 403 })
}

export function badRequestResponse(message = "Bad Request") {
  return NextResponse.json({ error: message }, { status: 400 })
}

export function serverErrorResponse(message = "Internal Server Error") {
  return NextResponse.json({ error: message }, { status: 500 })
}
