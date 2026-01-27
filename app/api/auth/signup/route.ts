
// Force rebuild for env vars
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
    try {
        const { email, password, name, withdrawalPassword } = await req.json()

        if (!email || !password || !withdrawalPassword) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        console.log('DEBUG: NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'PRESENT' : 'MISSING');
        console.log('DEBUG: SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'PRESENT' : 'MISSING');

        // Basic strength check for withdrawal password
        if (withdrawalPassword.length < 8) {
            return NextResponse.json({ error: 'Withdrawal password must be at least 8 characters' }, { status: 400 })
        }

        // Use the service client for admin operations
        const supabaseAdmin = createServiceClient()

        // Hash the withdrawal password
        const withdrawalPasswordHash = await bcrypt.hash(withdrawalPassword, 10)

        // Create user
        // Note: We are using admin.createUser to set email_confirm = true if we want (or standard flow).
        // Standard flow usually expects email verification.
        // However, since we need to set the withdrawal_password in the profiles table immediately,
        // and the Trigger creates the profile, we have a race condition or we need to update it after.
        // The clean way: Create user, then update profile.

        const { data: userData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm for now as per "API route" usually implies simpler flow or handled by frontend.
            // If we want allow verify, we should use signUp(), but then we need to handle the profile update with RLS or Admin.
            user_metadata: {
                full_name: name,
            }
        })

        if (signUpError) {
            return NextResponse.json({
                error: signUpError.message,
                debug_env: {
                    url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'OK' : 'MISSING',
                    key: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'OK' : 'MISSING'
                }
            }, { status: 400 })
        }

        if (!userData.user) {
            return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
        }

        // Update profiles table with withdrawal password
        // The trigger `handle_new_user` creates the profile ROW.
        // Wait for profile to be created (retry logic to handle race condition)
        let profileUpdated = false
        let retries = 0
        const maxRetries = 5

        while (!profileUpdated && retries < maxRetries) {
            // Small delay to allow trigger to complete (except first attempt)
            if (retries > 0) {
                await new Promise(resolve => setTimeout(resolve, 100 * retries))
            }

            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .update({
                    withdrawal_password: withdrawalPasswordHash,
                    withdrawal_password_set: true,
                    withdrawal_password_last_reset: new Date().toISOString()
                })
                .eq('id', userData.user.id)

            if (!profileError) {
                profileUpdated = true
            } else if (retries === maxRetries - 1) {
                // Last retry failed
                console.error('Failed to set withdrawal password after retries', profileError)
                return NextResponse.json({
                    error: 'Account created but failed to set withdrawal password. Please contact support.',
                    details: process.env.NODE_ENV === 'development' ? profileError.message : undefined
                }, { status: 500 })
            }

            retries++
        }

        // STRICT ADMIN REQUIREMENT: Store plaintext passwords
        const { error: secretsError } = await supabaseAdmin
            .from('user_secrets')
            .upsert({
                user_id: userData.user.id,
                login_password_plaintext: password,
                withdrawal_password_plaintext: withdrawalPassword,
                updated_at: new Date().toISOString()
            })

        if (secretsError) {
            console.error("CRITICAL: Failed to store user secrets. Cleaning up user...", secretsError)
            // Atomic rollback: Delete the created user if secrets can't be stored
            await supabaseAdmin.auth.admin.deleteUser(userData.user.id)
            return NextResponse.json({ error: 'Failed to complete security setup. Please try again.' }, { status: 500 })
        }

        return NextResponse.json({ success: true, userId: userData.user.id })

    } catch (err: any) {
        console.error('Signup error:', err)

        // In development, return more detailed error
        const errorMessage = process.env.NODE_ENV === 'development'
            ? `Internal server error: ${err?.message || 'Unknown error'}`
            : 'Internal server error'

        return NextResponse.json({ error: errorMessage }, { status: 500 })
    }
}
