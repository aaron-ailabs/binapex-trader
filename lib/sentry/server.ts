import * as Sentry from "@sentry/nextjs"

export const initSentryServer = () => {
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 1.0,
      beforeSend(event) {
        // Filter out sensitive data on server
        if (event.request) {
          delete event.request.cookies
          delete event.request.headers
        }
        return event
      },
    })
  }
}

export const captureError = (error: Error, context?: Record<string, any>) => {
  Sentry.captureException(error, {
    contexts: { custom: context },
  })
}
