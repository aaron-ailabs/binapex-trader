"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ResetPasswordSchema, type ResetPasswordInput } from "@/lib/schemas/auth"
import { createClient } from "@/lib/supabase/client"
import { AuthLayout } from "@/components/auth/auth-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

export default function ResetPasswordPage() {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ResetPasswordInput>({
        resolver: zodResolver(ResetPasswordSchema),
    })

    useEffect(() => {
        // Check if we have a hash fragment (token) - Supabase implicit flow
        // or if we are already logged in (session recovery)
        const handleSessionRecovery = async () => {
            const supabase = createClient()
            const { data: { session }, error } = await supabase.auth.getSession()
            if (error) {
                console.error("Session error:", error)
            }
        }
        handleSessionRecovery()
    }, [])

    const onSubmit = async (data: ResetPasswordInput) => {
        try {
            setIsSubmitting(true)
            setError(null)

            const supabase = createClient()
            const { error: updateError } = await supabase.auth.updateUser({
                password: data.password
            })

            if (updateError) throw updateError

            setSuccess(true)
            toast.success("Password updated successfully!")

            // Redirect to login after 2 seconds
            setTimeout(() => {
                router.push("/login")
            }, 2000)

        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to reset password. Please try again.")
            toast.error("Failed to reset password")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <AuthLayout title="Set New Password" subtitle="Enter your new secure password">
            {success ? (
                <div className="space-y-4">
                    <Alert className="bg-emerald-500/10 border-emerald-500/20">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <AlertDescription className="text-emerald-500">
                            Your password has been reset successfully! Redirecting to login...
                        </AlertDescription>
                    </Alert>
                    <Button asChild variant="outline" className="w-full border-white/10 hover:bg-white/5 bg-transparent">
                        <Link href="/login">Go to Login Now</Link>
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

                    {/* Password */}
                    <div className="space-y-2">
                        <Label htmlFor="password">New Password</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            {...register("password")}
                            className="bg-black/20 border-white/10 focus:border-binapex-gold"
                        />
                        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="••••••••"
                            {...register("confirmPassword")}
                            className="bg-black/20 border-white/10 focus:border-binapex-gold"
                        />
                        {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
                    </div>

                    {/* Submit */}
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-binapex-gold hover:bg-binapex-gold-dark text-binapex-dark font-semibold"
                    >
                        {isSubmitting ? "Updating Password..." : "Reset Password"}
                    </Button>
                </form>
            )}
        </AuthLayout>
    )
}
