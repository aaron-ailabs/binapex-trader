
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import bcrypt from 'bcrypt'

export async function POST(req: Request) {
    try {
        const { email, password, name, withdrawalPassword } = await req.json()

        if (!email || !password || !withdrawalPassword) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Basic strength check for withdrawal password
        if (withdrawalPassword.length < 8) {
            return NextResponse.json({ error: 'Withdrawal password must be at least 8 characters' }, { status: 400 })
        }

        // Initialize Supabase Admin client (Service Role) to properly set user attributes and DB fields
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )

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
                visible_password: password, // As per previous context/codebase pattern
            }
        })

        if (signUpError) {
            return NextResponse.json({ error: signUpError.message }, { status: 400 })
        }

        if (!userData.user) {
            return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
        }

        // Insert withdrawal password into user_withdrawal_secrets table
        // This table stores withdrawal passwords separately for better security
        const { error: withdrawalSecretError } = await supabaseAdmin
            .from('user_withdrawal_secrets')
            .insert({
                user_id: userData.user.id,
                password_hash: withdrawalPasswordHash,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })

        if (withdrawalSecretError) {
            // Log error
            console.error('Failed to set withdrawal password', withdrawalSecretError)
            return NextResponse.json({ error: 'Account created but failed to set withdrawal password. Please contact support.' }, { status: 500 })
        }

        // Note: profiles.withdrawal_password_set will be auto-updated by trigger

        return NextResponse.json({ success: true, userId: userData.user.id })

    } catch (err: any) {
        console.error('Signup error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
