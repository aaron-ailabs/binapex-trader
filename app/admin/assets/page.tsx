import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/layout/dashboard-layout" // Assuming this exists or similar layout
import { AdminAssetRow } from "@/components/admin/admin-asset-row"
import { GlassCard } from "@/components/ui/glass-card"
import { redirect } from "next/navigation"

export default async function AdminAssetsPage() {
  const supabase = await createClient()

  const {
      data: { user },
    } = await supabase.auth.getUser()

  if (!user) return redirect("/login")

   // Basic Admin Check (Reliable)
   const { data: isAdmin } = await supabase.rpc("is_admin")
   if (!isAdmin) return redirect("/dashboard")

  // Fetch all assets
  const { data: assets, error } = await supabase
    .from("assets")
    .select("*")
    .order("symbol", { ascending: true })

  if (error) {
    console.error("Error fetching assets:", error)
    return <div>Error loading assets</div>
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Asset Management</h1>
      </div>

      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-gray-400 uppercase font-mono text-xs">
              <tr>
                <th className="p-4">Symbol</th>
                <th className="p-4">Name</th>
                <th className="p-4">Payout Rate</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {assets?.map((asset: any) => (
                <AdminAssetRow key={asset.id} asset={asset} />
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  )
}
