import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getPaginatedUsers } from "@/lib/supabase/admin-queries"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is admin
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const page = Number.parseInt(searchParams.get("page") || "1")
    const pageSize = Number.parseInt(searchParams.get("pageSize") || "20")
    const search = searchParams.get("search") || ""

    const result = await getPaginatedUsers(page, pageSize, search)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("[v0] Admin users API error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
