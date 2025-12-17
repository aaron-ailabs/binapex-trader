import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { rejectDeposit } from "@/lib/supabase/admin-queries"
import { captureApiError } from "@/lib/utils/error-handler"

export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  let userId: string | undefined

  try {
    const supabase = await createClient()

    // Check admin authorization
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    userId = user.id

    const { data: isAdmin, error: roleError } = await supabase.rpc("is_admin")

    if (roleError || !isAdmin) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    const { reason } = await request.json()
    const result = await rejectDeposit(params.id, reason)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    captureApiError(error, {
      userId,
      endpoint: "reject-deposit",
      action: "admin-reject-deposit",
      metadata: { depositId: params.id },
    })

    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
