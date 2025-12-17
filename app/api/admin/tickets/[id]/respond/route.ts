import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { captureApiError } from "@/lib/utils/error-handler"

export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check admin role using RPC function
    const { data: isAdmin } = await supabase.rpc("is_admin")
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    const { response, status } = await request.json()
    const ticketId = params.id

    // Update ticket with admin response
    const { error: updateError } = await supabase
      .from("tickets")
      .update({
        admin_response: response,
        status: status || "responded",
        responded_by: user.id,
        responded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", ticketId)

    if (updateError) throw updateError

    // Log admin action
    await supabase.from("admin_logs").insert({
      admin_id: user.id,
      action: "respond_ticket",
      target_id: ticketId,
      details: { response, status },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Ticket response error:", error)
    captureApiError(error, { action: "admin_ticket_respond", metadata: { ticketId: params.id } })
    return NextResponse.json({ error: "Failed to respond to ticket" }, { status: 500 })
  }
}
