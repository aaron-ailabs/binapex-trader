import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { UpdateUserSchema } from "@/lib/schemas/admin"
import { captureApiError } from "@/lib/utils/error-handler"

export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check admin role
    const { data: isAdmin, error: roleError } = await supabase.rpc("is_admin")

    if (roleError || !isAdmin) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const validated = UpdateUserSchema.parse(body)
    const { userId, ...updates } = validated

    // Update user profile
    const { data, error } = await supabase.from("profiles").update(updates).eq("id", params.id).select().single()

    if (error) throw error

    // Log admin action
    await supabase.from("admin_logs").insert({
      admin_id: user.id,
      action: "update_user",
      target_user_id: params.id,
      details: updates,
    })

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("[v0] Update user error:", error)
    captureApiError(error, { action: "admin_update_user", userId: params.id })
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}
