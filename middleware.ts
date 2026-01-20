import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // 1. Skip static assets and public paths to avoid unnecessary processing
    if (
        pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js|webp|woff|woff2|ttf|gif)$/) ||
        pathname.startsWith("/_next") ||
        pathname.startsWith("/static") ||
        pathname.startsWith("/api/public") // Assuming public APIs exist
    ) {
        return NextResponse.next()
    }

    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    response = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
                },
            },
        }
    )

    // 2. Refresh session if needed
    const { data: { user } } = await supabase.auth.getUser()

    // 3. Protected Routes Logic
    const protectedPaths = ["/dashboard", "/deposit", "/withdrawal", "/trade", "/settings"]
    const isProtectedRoute = protectedPaths.some((path) => pathname.startsWith(path))
    const isAuthPage = pathname === "/login" || pathname === "/signup" || pathname === "/forgot-password"

    if (isProtectedRoute && !user) {
        const url = request.nextUrl.clone()
        url.pathname = "/login"
        url.searchParams.set("next", pathname)
        return NextResponse.redirect(url)
    }

    if (isAuthPage && user) {
        const url = request.nextUrl.clone()
        url.pathname = "/dashboard"
        return NextResponse.redirect(url)
    }

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
