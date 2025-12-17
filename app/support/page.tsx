import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { SupportClientPage } from "@/components/support/support-client-page"

export default async function SupportPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  const { data: tickets } = await supabase
    .from("tickets")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return <SupportClientPage user={user} profile={profile} tickets={tickets} />
}

