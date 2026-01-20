
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
    try {
        const { userId, withdrawalPassword } = await req.json()

        if (!userId || !withdrawalPassword) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const supabase = await createClient()

        // Verify the user is requesting for themselves using their session
        // Or if checking strictly by ID passed in body, ensure it matches session.
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (user.id !== userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        // Fetch hash from profiles
        const { data: profile, error: fetchError } = await supabase
            .from('profiles')
            .select('withdrawal_password')
            .eq('id', userId)
            .single()

        if (fetchError || !profile) {
            return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
        }

        if (!profile.withdrawal_password) {
            return NextResponse.json({ error: 'Withdrawal password not set' }, { status: 400 })
        }

        // Rate limiting: Check for recent failed attempts (last 15 minutes)
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString()
        const { data: recentFailures, error: auditError } = await supabase
            .from('audit_log')
            .select('id')
            .eq('user_id', userId)
            .eq('action', 'WITHDRAWAL_PASSWORD_FAILED')
            .gte('timestamp', fifteenMinutesAgo)

        if (auditError) {
            console.error('Error checking audit log:', auditError)
            // Continue with verification even if audit check fails
        }

        const failedAttempts = recentFailures?.length || 0

        // Block if too many failed attempts (5 or more in 15 minutes)
        if (failedAttempts >= 5) {
            return NextResponse.json(
                {
                    error: 'Too many failed attempts. Please try again later or contact customer service.',
                    retryAfter: 900 // 15 minutes in seconds
                },
                { status: 429 }
            )
        }

        // Compare hash
        const match = await bcrypt.compare(withdrawalPassword, profile.withdrawal_password)

        if (!match) {
            // Log failed attempt to audit log for rate limiting
            await supabase
                .from('audit_log')
                .insert({
                    user_id: userId,
                    action: 'WITHDRAWAL_PASSWORD_FAILED',
                    table_name: 'profiles',
                    record_id: userId,
                    metadata: {
                        ip: req.headers.get('x-forwarded-for') || 'unknown',
                        user_agent: req.headers.get('user-agent') || 'unknown',
                        attempt_number: failedAttempts + 1
                    }
                })

            return NextResponse.json({ error: 'Error: Please contact customer service.' }, { status: 403 })
        }

        // Log successful verification (optional, for security audit trail)
        await supabase
            .from('audit_log')
            .insert({
                user_id: userId,
                action: 'WITHDRAWAL_PASSWORD_VERIFIED',
                table_name: 'profiles',
                record_id: userId,
                metadata: {
                    ip: req.headers.get('x-forwarded-for') || 'unknown',
                    user_agent: req.headers.get('user-agent') || 'unknown'
                }
            })

        return NextResponse.json({ success: true })

    } catch (err: any) {
        console.error('Verify error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
