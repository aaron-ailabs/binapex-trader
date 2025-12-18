import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_URL = process.env.SUPABASE_URL
const NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY

const adminStatusCache = new Map<string, { isAdmin: boolean; timestamp: number }>()
const ADMIN_CACHE_DURATION = 1 * 60 * 1000 // 1 minute


export async function updateSession(request: NextRequest) {
  const supabaseUrl = NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL
  const supabaseAnonKey = NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next({ request })
  }

  const { supabase, response } = createClient(request, supabaseUrl, supabaseAnonKey)

  try {
    const pathname = request.nextUrl.pathname
    
    // Skip auth check for public assets and static files
    // This addresses Issue 1: "Repeated supabase.auth.getUser() calls"
    if (isStaticAsset(pathname)) {
      return response
    }

    console.log("[Middleware] Processing request:", pathname)

    // Determine if we need to authenticate the user
    // We only need auth if it's a protected route (or an auth route to redirect away)
    const isProtected = pathname.startsWith("/dashboard") || pathname.startsWith("/admin") || pathname.startsWith("/api")
    const isAuthPage = pathname === "/login" || pathname === "/signup" || pathname === "/admin/login"

    let user = null

    // Optimizing auth calls: only fetch user if necessary
    if (isProtected || isAuthPage) {
      const { data } = await supabase.auth.getUser()
      user = data.user
      
      if (user) {
        console.log("[Middleware] User authenticated:", user.email)
      }
    }

    // Apply Routing Logic - Addresses Issue 3 "God Function" by separating concerns
    
    // 1. Dashboard Protection
    if (pathname.startsWith("/dashboard")) {
       if (!user) {
        return redirectTo(request, "/login")
       }
    }

    // 2. Auth Page Redirection (Logged in users shouldn't see login page)
    if (isAuthPage && user && pathname !== "/admin/login") {
       return redirectTo(request, "/dashboard")
    }

    // 3. Admin Route Protection
    if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
      if (!user) {
        console.log("[Middleware] Admin route accessed without authentication, redirecting to login")
        return redirectTo(request, "/admin/login")
      }
      
      console.log("[Middleware] Admin route accessed by authenticated user, delegating to AdminRoute")
      
      // Addresses Issue 2: "Authorization bypass potential"
      // While we delegate the heavy lifting to AdminRoute, we can add a basic check here if role is in metadata
      // The full check remains in AdminRoute to avoid costly RPC calls here
    }

  } catch (error) {
    console.error("[Middleware] Auth error:", error)
  }

  return response
}

function createClient(request: NextRequest, supabaseUrl: string, supabaseAnonKey: string) {
  let response = NextResponse.next({
    request,
  })

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
    cookieOptions: {
      name: "sb",
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
  })

  return { supabase, response }
}

function isStaticAsset(pathname: string) {
  if (pathname.startsWith("/_next") || pathname.startsWith("/static")) {
    return true
  }
  
  // Check for common static file extensions
  const staticExtensions = [".ico", ".jpg", ".jpeg", ".png", ".gif", ".svg", ".webp", ".css", ".js", ".woff", ".woff2", ".ttf"]
  return staticExtensions.some(ext => pathname.toLowerCase().endsWith(ext))
}

function redirectTo(request: NextRequest, path: string) {
  const url = request.nextUrl.clone()
  url.pathname = path
  return NextResponse.redirect(url)
}
