# Sentry Error Tracking Setup

## Overview

Sentry is integrated into Binapex to track errors, monitor performance, and help debug issues in production.

## Environment Variables

Add these to your Vercel project or `.env.local`:

```bash
# Required for Sentry error tracking
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_ORG=binapex
SENTRY_PROJECT=binapex-trading
```

## Getting Your Sentry DSN

1. Go to your Sentry project: https://binapex.sentry.io
2. Navigate to **Settings** → **Projects** → **binapex-trading**
3. Go to **Client Keys (DSN)**
4. Copy the DSN and add it to your environment variables

## What's Being Tracked

### Automatic Error Tracking
- Unhandled exceptions in components
- API route errors
- Database query failures
- Authentication failures

### Manual Error Tracking
- Business logic failures (insufficient balance, unauthorized access)
- Admin operations (deposit/withdrawal approvals)
- Order matching failures

### Performance Monitoring
- API endpoint response times
- Database query performance
- Page load times

## Using Sentry in Your Code

### Track Errors in API Routes
```typescript
import { captureApiError } from "@/lib/utils/error-handler"

try {
  // Your code
} catch (error) {
  captureApiError(error, {
    userId: user.id,
    endpoint: "/api/orders",
    action: "create-order",
    metadata: { orderId: "123" },
  })
}
```

### Track Business Logic Issues
```typescript
import { captureBusinessLogicError } from "@/lib/utils/error-handler"

if (balance < requiredAmount) {
  captureBusinessLogicError("Insufficient balance", {
    action: "place-order",
    metadata: { balance, required: requiredAmount },
  })
}
```

## Viewing Errors

1. Go to https://binapex.sentry.io
2. Navigate to **Issues** to see all errors
3. Click on any issue to see:
   - Stack trace
   - User context
   - Request details
   - Breadcrumbs (user actions before error)

## Testing Sentry

To test if Sentry is working, trigger a test error:

```typescript
throw new Error("Sentry test error")
```

You should see this error appear in your Sentry dashboard within seconds.
