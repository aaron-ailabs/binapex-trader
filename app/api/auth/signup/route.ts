import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    const cookieStore = cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        cookieStore.set(name, value, options)
                    })
                },
            },
        }
    )

    try {
        const { email, password, name, withdrawalPassword } = await req.json()

        if (!email || !password || !withdrawalPassword) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }
        
        // Basic strength check for withdrawal password
        if (withdrawalPassword.length < 8) {
            return NextResponse.json({ error: 'Withdrawal password must be at least 8 characters' }, { status: 400 })
        }

        const { data: userData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: name,
                }
            }
        })

        if (signUpError) {
            return NextResponse.json({ error: signUpError.message }, { status: 400 })
        }

        if (!userData.user) {
            return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
        }

        // FIXME: The original implementation used a privileged RPC 'admin_set_withdrawal_password'.
        // This is no longer possible without the service role key. A new, secure RPC needs to be created
        // that allows a user to set their own withdrawal password upon signup.
        // For now, this functionality is disabled.
        if (withdrawalPassword) {
            console.warn(`Withdrawal password was provided for user ${userData.user.id} but could not be set due to security refactoring.`);
        }


        return NextResponse.json({ success: true, userId: userData.user.id })

    } catch (err: any) {
        console.error('Signup error details:', err.message, err.stack)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}