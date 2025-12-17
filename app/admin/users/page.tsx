import { AdminRoute } from "@/components/admin/admin-route"
import { AdminLayout } from "@/components/layout/admin-layout"
import { createClient } from "@/lib/supabase/server"
import { UserManagementTable } from "@/components/admin/user-management-table"

export default async function AdminUsersPage() {
  const supabase = await createClient()

  const { data: users } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })

  return (
    <AdminRoute>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground mt-1">Manage user accounts, tiers, and permissions</p>
          </div>
          <UserManagementTable users={users || []} />
        </div>
      </AdminLayout>
    </AdminRoute>
  )
}
