"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ForgotPasswordSchema, type ForgotPasswordInput } from "@/lib/schemas/auth"
import { createClient } from "@/lib/supabase/client"
import { AuthLayout } from "@/components/auth/auth-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, AlertCircle } from "lucide-react"

export default function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(ForgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordInput) => {
    try {
      setIsSubmitting(true)
      setError(null)

      const supabase = createClient()
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (resetError) throw resetError

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reset email. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Reset Password" subtitle="Enter your email to receive a password reset link">
      {success ? (
        <div className="space-y-4">
          <Alert className="bg-emerald-500/10 border-emerald-500/20">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <AlertDescription className="text-emerald-500">
              Password reset link sent! Check your email inbox.
            </AlertDescription>
          </Alert>
          <Button asChild variant="outline" className="w-full border-white/10 hover:bg-white/5 bg-transparent">
            <Link href="/login">Back to Login</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="trader@binapex.com"
              {...register("email")}
              className="bg-black/20 border-white/10 focus:border-binapex-gold"
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-binapex-gold hover:bg-binapex-gold-dark text-binapex-dark font-semibold"
          >
            {isSubmitting ? "Sending..." : "Send Reset Link"}
          </Button>

          {/* Footer */}
          <p className="text-center text-sm text-muted-foreground">
            Remember your password?{" "}
            <Link
              href="/login"
              className="text-binapex-gold hover:text-binapex-gold-dark font-medium transition-colors"
            >
              Sign in
            </Link>
          </p>
        </form>
      )}
    </AuthLayout>
  )
}
