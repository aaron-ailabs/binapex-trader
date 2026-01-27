import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_URL = process.env.SUPABASE_URL
const NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY

const adminStatusCache = new Map<string, { isAdmin: boolean; timestamp: number }>()
const ADMIN_CACHE_DURATION = 1 * 60 * 1000 // 1 minute


const settingsCache = {
  maintenance: false,
  timestamp: 0
}
const SETTINGS_CACHE_TTL = 30 * 1000 // 30 seconds

export async function updateSession(request: NextRequest) {
  const supabaseUrl = NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL
  const supabaseAnonKey = NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next({ request })
  }

  const { supabase, response } = createClient(request, supabaseUrl, supabaseAnonKey)

  try {
    const pathname = request.nextUrl.pathname

    if (isStaticAsset(pathname)) {
      return response
    }

    console.log("[Middleware] Processing request:", pathname)

    // --- MAINTENANCE MODE CHECK ---
    const now = Date.now()
    if (now - settingsCache.timestamp > SETTINGS_CACHE_TTL) {
      // Refresh settings
      const { data } = await supabase.from('system_settings').select('value').eq('key', 'maintenance_mode').single()
      if (data) {
        settingsCache.maintenance = data.value === 'true'
      }
      settingsCache.timestamp = now
    }

    if (settingsCache.maintenance) {
      // Allow access to maintenance page and static assets
      if (!pathname.startsWith('/maintenance') && !pathname.startsWith('/_next') && !pathname.startsWith('/api/')) {
        return NextResponse.redirect(new URL('/maintenance', request.url))
      }
    } else {
      // If NOT in maintenance mode, redirect away from maintenance page
      if (pathname.startsWith('/maintenance')) {
        return NextResponse.redirect(new URL('/', request.url))
      }
    }
    // -----------------------------

    // Determine if we need to authenticate the user
    // Protected paths from both middleware.ts and lib/supabase/proxy.ts
    const protectedPaths = ["/dashboard", "/deposit", "/withdrawal", "/trade", "/settings", "/admin", "/api"]
    const isProtected = protectedPaths.some((path) => pathname.startsWith(path))

    // Explicitly allow public API routes
    const isPublicApi = pathname.startsWith("/api/auth/") || pathname.startsWith("/api/public/")

    const isAuthPage = pathname === "/login" || pathname === "/signup" || pathname === "/forgot-password" || pathname === "/admin/login"

    let user = null

    // Optimizing auth calls: only fetch user if necessary
    if ((isProtected && !isPublicApi) || isAuthPage) {
      const { data } = await supabase.auth.getUser()
      user = data.user

      if (user) {
        console.log("[Middleware] User authenticated:", user.email)
      }
    }

    // Apply Routing Logic

    // 1. Protected Route Protection
    if (isProtected && !isPublicApi) {
      if (!user) {
        // Special handling for API routes
        if (pathname.startsWith("/api/")) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        return redirectTo(request, "/login", pathname)
      } else {
        // Check if user is Admin - Block access to Trader Dashboard
        const cacheKey = user.id
        const cachedStatus = adminStatusCache.get(cacheKey)
        const now = Date.now()
        let isAdmin = false

        if (cachedStatus && (now - cachedStatus.timestamp) < ADMIN_CACHE_DURATION) {
          isAdmin = cachedStatus.isAdmin
        } else {
          // Fetch role from DB
          const { data: role } = await supabase.rpc("get_user_role")
          isAdmin = role === "admin"
          adminStatusCache.set(cacheKey, { isAdmin, timestamp: now })
        }

        if (isAdmin) {
          console.warn("[Middleware] Admin attempted to access trader dashboard:", user.email)
          // Redirect to Admin Portal
          return NextResponse.redirect(new URL("https://admin.binapex.my/admin/dashboard"))
        }
      }
    }

    // 2. Auth Page Redirection (Logged in users shouldn't see login page)
    if (isAuthPage && user && pathname !== "/admin/login") {
      return redirectTo(request, "/dashboard")
    }

    // 3. Admin Route Protection (if they somehow bypass the proxy.ts redirect)
    if ((pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) && pathname !== "/admin/login" && pathname !== "/admin/setup") {
      if (!user) {
        if (pathname.startsWith("/api/")) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        return redirectTo(request, "/admin/login")
      }

      const cacheKey = user.id
      const cachedStatus = adminStatusCache.get(cacheKey)
      const now = Date.now()

      let isAdmin = false

      if (cachedStatus && (now - cachedStatus.timestamp) < ADMIN_CACHE_DURATION) {
        isAdmin = cachedStatus.isAdmin
      } else {
        // Fetch role from DB
        const { data: role } = await supabase.rpc("get_user_role")
        isAdmin = role === "admin"

        // Update cache
        adminStatusCache.set(cacheKey, { isAdmin, timestamp: now })
      }

      if (!isAdmin) {
        console.warn("[Middleware] Non-admin user attempted to access admin route:", user.email)
        if (pathname.startsWith("/api/")) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }
        return redirectTo(request, "/dashboard")
      }

      console.log("[Middleware] Admin access verified at edge for:", user.email)
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

function redirectTo(request: NextRequest, path: string, next?: string) {
  const url = request.nextUrl.clone()
  url.pathname = path
  if (next) {
    url.searchParams.set("next", next)
  }
  return NextResponse.redirect(url)
}
