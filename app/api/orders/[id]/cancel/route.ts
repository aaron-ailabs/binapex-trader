import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { OrderMatchingEngine } from "@/lib/services/order-matching-engine"

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          },
        },
      },
    )

    // Get user session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const orderId = params.id

    const { data: order } = await supabase.from("limit_orders").select("user_id").eq("id", orderId).single()

    if (!order || order.user_id !== user.id) {
      return Response.json({ error: "Order not found or access denied" }, { status: 404 })
    }

    // Cancel order
    const engine = new OrderMatchingEngine(supabase)
    const success = await engine.cancelOrder(orderId, user.id)

    if (!success) {
      return Response.json({ error: "Failed to cancel order" }, { status: 400 })
    }

    return Response.json({ success: true, message: "Order cancelled" })
  } catch (error) {
    console.error("[v0] Order cancellation error:", error)
    return Response.json({ error: error instanceof Error ? error.message : "Cancellation failed" }, { status: 400 })
  }
}
