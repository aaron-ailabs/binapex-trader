import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/sonner"
import { AuthProvider } from "@/contexts/auth-context"
import { TawkProvider } from "@/components/providers/tawk-provider"
import { ErrorBoundary } from "@/components/error-boundary" // Added import for ErrorBoundary
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
})

export const metadata: Metadata = {
  title: "Binapex - Trade the Future of Finance",
  description: "Professional multi-asset trading platform for Crypto, Forex, Stocks, and Commodities",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0a0a0a",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark bg-binapex-dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased bg-binapex-dark text-foreground`}
      >
        <ErrorBoundary>
          <AuthProvider>
            <TawkProvider
              propertyId={process.env.NEXT_PUBLIC_TAWK_PROPERTY_ID || ""}
              widgetId={process.env.NEXT_PUBLIC_TAWK_WIDGET_ID || ""}
            >
              {children}
            </TawkProvider>
          </AuthProvider>
        </ErrorBoundary>
        <Analytics />
        <Toaster position="top-right" />
      </body>
    </html>
  )
}
