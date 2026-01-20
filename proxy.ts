import { NextResponse, type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/proxy"

export default async function proxy(request: NextRequest) {
  const hostname = request.nextUrl.hostname
  const pathname = request.nextUrl.pathname

  // Domain Enforcement
  if (process.env.NODE_ENV === "production") {
    if (hostname !== "binapex.my" && hostname !== "www.binapex.my") {
      console.warn(`[Trader Proxy] Unauthorized domain: ${hostname}. Redirecting to https://binapex.my`)
      return NextResponse.redirect(new URL(pathname, "https://binapex.my"), 301)
    }
  }

  // Admin redirection
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return NextResponse.redirect("https://admin.binapex.my/login", 301)
  }

  // Consolidate session update and auth logic
  const response = await updateSession(request)

  // Add Security Headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
