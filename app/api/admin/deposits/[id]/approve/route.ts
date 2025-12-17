import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { approveDeposit } from "@/lib/supabase/admin-queries"
import * as Sentry from "@sentry/nextjs"

export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const supabase = await createClient()

    // Check admin authorization
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: isAdmin, error: roleError } = await supabase.rpc("is_admin")

    if (roleError || !isAdmin) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    const result = await approveDeposit(params.id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    Sentry.captureException(error, {
      contexts: {
        api: {
          endpoint: "approve-deposit",
          depositId: params.id,
        },
      },
    })
    console.error("[v0] Approve deposit error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
