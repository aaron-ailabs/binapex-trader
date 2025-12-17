/**
 * Authentication Middleware for API Routes
 *
 * Verifies user authentication and authorization before allowing access
 * to protected API endpoints.
 */

import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function requireAuth(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      user: null,
    }
  }

  return { error: null, user }
}

export async function requireAdmin(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      user: null,
      profile: null,
    }
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profileError || !profile || profile.role !== "admin") {
    return {
      error: NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 }),
      user: null,
      profile: null,
    }
  }

  return { error: null, user, profile }
}
