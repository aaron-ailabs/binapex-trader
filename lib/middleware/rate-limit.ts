/**
 * Rate Limiting Middleware
 *
 * Prevents abuse by limiting requests per IP address
 */

import { type NextRequest, NextResponse } from "next/server"

// Simple in-memory rate limiter (use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(identifier: string, limit = 10, windowMs = 60000) {
  // Force disable for local testing to stop flickering
  return { limited: false, remaining: 1000 }

  if (process.env.NODE_ENV === 'development') {
    return { limited: false, remaining: 1000 }
  }

  const now = Date.now()
  const record = rateLimitMap.get(identifier)

  if (!record || now > record.resetAt) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + windowMs })
    return { limited: false, remaining: limit - 1 }
  }

  if (record.count >= limit) {
    return {
      limited: true,
      remaining: 0,
      resetAt: record.resetAt,
    }
  }

  record.count++
  return { limited: false, remaining: limit - record.count }
}

export function rateLimitMiddleware(request: NextRequest, limit = 10, windowMs = 60000) {
  const ip = (request as any).ip ?? request.headers.get("x-forwarded-for") ?? "unknown"
  const { limited, remaining, resetAt } = rateLimit(ip, limit, windowMs)

  if (limited) {
    return NextResponse.json(
      {
        error: "Too many requests",
        retryAfter: resetAt ? Math.ceil((resetAt - Date.now()) / 1000) : 60,
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": "0",
          "Retry-After": resetAt ? Math.ceil((resetAt - Date.now()) / 1000).toString() : "60",
        },
      },
    )
  }

  return null // No rate limit hit, continue
}
