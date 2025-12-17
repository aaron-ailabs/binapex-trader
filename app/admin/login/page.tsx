"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { LoginSchema, type LoginInput } from "@/lib/schemas/auth"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Shield, Lock, Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function AdminLoginPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isChecking, setIsChecking] = useState(true)
  const [authStage, setAuthStage] = useState<string>("")
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
  })

  // Check if user is already authenticated as admin
  useEffect(() => {
    const checkExistingAuth = async () => {
      console.log("[Admin Auth] Checking existing authentication...")
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          console.log("[Admin Auth] User found:", user.email)
          const { data: isAdmin, error: rpcError } = await supabase.rpc("is_admin")
          
          if (rpcError) {
            console.error("[Admin Auth] is_admin RPC error:", rpcError.message, rpcError)
          } else if (isAdmin === true) {
            console.log("[Admin Auth] User is already authenticated as admin, redirecting...")
            window.location.href = "/admin"
            return
          } else {
            console.log("[Admin Auth] User exists but is not admin. isAdmin:", isAdmin)
          }
        } else {
          console.log("[Admin Auth] No existing session")
        }
        return true
      } catch (err) {
        console.error("[Admin Auth] Error checking existing auth:", err)
      } finally {
        setIsChecking(false)
      }
    }

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Auth check timed out")), 5000)
    )

    Promise.race([checkExistingAuth(), timeoutPromise])
      .catch((err) => {
        console.warn("[Admin Auth] Auth check warning:", err)
        setIsChecking(false)
      })


  }, [router])

  const onSubmit = async (data: LoginInput) => {
    try {
      setIsSubmitting(true)
      setError(null)
      setAuthStage("Signing in...")
      console.log("[Admin Auth] Starting login for:", data.email)

      const supabase = createClient()

      // Step 1: Sign in with email and password
      console.log("[Admin Auth] Step 1: Calling signInWithPassword...")
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (signInError) {
        console.error("[Admin Auth] Sign in error:", signInError.message)
        throw new Error("Invalid email or password.")
      }

      if (!authData?.user) {
        console.error("[Admin Auth] No user in auth response")
        throw new Error("Authentication failed. Please try again.")
      }

      console.log("[Admin Auth] Step 1 complete: User authenticated:", authData.user.email)

      // Step 2: Wait for session to be established
      setAuthStage("Establishing session...")
      console.log("[Admin Auth] Step 2: Waiting for session...")
      await new Promise((resolve) => setTimeout(resolve, 500))

      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        console.error("[Admin Auth] Session error:", sessionError.message)
        throw new Error("Session could not be established. Please try again.")
      }

      if (!session) {
        console.error("[Admin Auth] No session after sign in")
        throw new Error("Session not established. Please try again.")
      }

      console.log("[Admin Auth] Step 2 complete: Session established")

      // Step 3: Verify admin role
      setAuthStage("Verifying admin access...")
      console.log("[Admin Auth] Step 3: Verifying admin role via RPC...")
      
      const { data: isAdmin, error: rpcError } = await supabase.rpc("is_admin")

      if (rpcError) {
        console.error("[Admin Auth] is_admin RPC error:", rpcError.message, rpcError)
        // Don't throw here, try get_user_role as fallback
      }

      console.log("[Admin Auth] is_admin result:", isAdmin)

      // Double-check with get_user_role
      const { data: role, error: roleError } = await supabase.rpc("get_user_role")
      console.log("[Admin Auth] get_user_role result:", role, "error:", roleError?.message)

      if (roleError) {
        console.error("[Admin Auth] get_user_role error:", roleError.message, roleError)
        // If both RPC calls fail, it might be a database issue
        if (rpcError) {
          throw new Error("Could not verify admin permissions. Database functions may not be set up correctly. Please contact support.")
        }
        throw new Error("Could not verify admin permissions. Please contact support.")
      }

      if (role !== "admin" && isAdmin !== true) {
        console.warn("[Admin Auth] User is not an admin. Role:", role, "isAdmin:", isAdmin)
        toast.error("Access denied. You do not have admin permissions.")
        setError("Access denied. You do not have admin permissions.")
        // Sign out since they're not an admin
        await supabase.auth.signOut()
        // Use hard navigation for sign out redirect
        window.location.href = "/dashboard"
        return
      }

      // Step 4: Success - redirect to admin dashboard
      console.log("[Admin Auth] Step 4: Admin verified, redirecting to /admin...")
      setAuthStage("Access granted! Redirecting...")
      toast.success("Welcome to Admin Portal")
      
      // Small delay to ensure session is fully established
      await new Promise((resolve) => setTimeout(resolve, 300))
      
      // Use hard navigation to ensure server-side validation runs
      console.log("[Admin Auth] Initiating hard navigation to /admin")
      window.location.href = "/admin"
      
    } catch (err) {
      console.error("[Admin Auth] Login error:", err)
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
      setAuthStage("")
    }
  }

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Admin Portal</h1>
          <p className="text-muted-foreground mt-1">Restricted Access</p>
        </div>

        {/* Login Form */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-lg">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">
                Admin Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                {...register("email")}
                className="bg-background border-border"
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register("password")}
                  className="bg-background border-border pr-10"
                  disabled={isSubmitting}
                />
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            {/* Auth Stage Indicator */}
            {authStage && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{authStage}</span>
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 text-base disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying Admin Access...
                </>
              ) : (
                "Access Control Panel"
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-border">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2"
            >
              ← Back to User Login
            </Link>
          </div>
        </div>

        {/* Security Badge */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Protected by 2048-bit encryption
        </p>
      </div>
    </div>
  )
}
