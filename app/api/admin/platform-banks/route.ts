import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { AddPlatformBankSchema } from "@/lib/schemas/admin"
import { captureApiError } from "@/lib/utils/error-handler"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check admin role
    const { data: isAdmin } = await supabase.rpc("is_admin")
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const validated = AddPlatformBankSchema.parse(body)

    const { data, error } = await supabase.from("platform_banks").insert([validated]).select().single()

    if (error) throw error

    // Log admin action
    await supabase.from("admin_logs").insert({
      admin_id: user.id,
      action: "add_platform_bank",
      target_id: data.id,
      details: validated,
    })

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("[v0] Add platform bank error:", error)
    captureApiError(error, { action: "admin_add_platform_bank" })
    return NextResponse.json({ error: "Failed to add platform bank" }, { status: 500 })
  }
}
