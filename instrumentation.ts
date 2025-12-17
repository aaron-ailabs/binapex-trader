export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initSentryServer } = await import("./lib/sentry/server")
    initSentryServer()
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    const { initSentryServer } = await import("./lib/sentry/server")
    initSentryServer()
  }
}
