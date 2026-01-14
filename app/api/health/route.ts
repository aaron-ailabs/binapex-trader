import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
    try {
        const supabase = await createClient()
        const { error } = await supabase.from("assets").select("count", { count: "exact", head: true })

        if (error) throw error

        return NextResponse.json({
            status: "UP",
            timestamp: new Date().toISOString(),
            database: "connected"
        })
    } catch (error: any) {
        return NextResponse.json({
            status: "DOWN",
            error: error.message,
            timestamp: new Date().toISOString()
        }, { status: 503 })
    }
}
