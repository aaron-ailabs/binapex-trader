'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
export async function updateWithdrawalPassword(password: string) {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return { error: "Unauthorized" }
    }

    if (!password || password.length < 6) {
        return { error: "Withdrawal password must be at least 6 characters" }
    }

    try {
        const { error } = await supabase.rpc('set_withdrawal_password', { new_pwd: password })

        if (error) {
            console.error("Update withdrawal password error:", error)
            return { error: error.message }
        }

        revalidatePath("/settings")
        revalidatePath("/withdrawal")
        return { success: true }
    } catch (error: any) {
        console.error("Security update error:", error)
        return { error: "Failed to process security update" }
    }
}
