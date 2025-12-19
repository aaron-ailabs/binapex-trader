import { createClient } from "./server"
import { captureApiError, captureBusinessLogicError } from "../utils/error-handler"

export async function getAdminStats() {
  const supabase = await createClient()

  const [{ count: totalUsers }, { count: pendingDeposits }, { count: pendingWithdrawals }, { data: recentActivity }] =
    await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase
        .from("transactions")
        .select("*", { count: "exact", head: true })
        .eq("type", "deposit")
        .eq("status", "pending"),
      supabase
        .from("transactions")
        .select("*", { count: "exact", head: true })
        .eq("type", "withdrawal")
        .eq("status", "pending"),
      supabase
        .from("transactions")
        .select("id, type, amount, status, created_at, user_id, profiles(full_name, email)")
        .order("created_at", { ascending: false })
        .limit(10),
    ])

  return {
    totalUsers: totalUsers || 0,
    pendingDeposits: pendingDeposits || 0,
    pendingWithdrawals: pendingWithdrawals || 0,
    recentActivity: recentActivity || [],
  }
}

export async function getPaginatedUsers(page = 1, pageSize = 20, search = "") {
  const supabase = await createClient()

  let query = supabase
    .from("profiles")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
  }

  const { data, count, error } = await query

  return {
    users: data || [],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
    error,
  }
}

export async function approveDeposit(transactionId: string) {
  const supabase = await createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Unauthorized" }
    }

    // Call the atomic RPC
    const { error } = await supabase.rpc("approve_deposit", {
      transaction_id: transactionId,
      admin_id: user.id
    })

    if (error) {
      captureApiError(error, {
        action: "approve-deposit",
        metadata: { transactionId },
      })
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    captureApiError(error, {
      action: "approve-deposit",
      metadata: { transactionId },
    })
    return { success: false, error: "Unexpected error during deposit approval" }
  }
}

export async function rejectDeposit(transactionId: string, reason: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("transactions")
    .update({
      status: "rejected",
      metadata: { rejection_reason: reason },
      updated_at: new Date().toISOString(),
    })
    .eq("id", transactionId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function approveWithdrawal(transactionId: string) {
  // Using the new secure RPC for approvals is also recommended if it exists, 
  // but for now the original was basic update. 
  // Wait, I created approve_withdrawal RPC earlier!
  const supabase = await createClient()

  const { error } = await supabase.rpc("approve_withdrawal", {
    transaction_id: transactionId
  })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function rejectWithdrawal(transactionId: string, reason: string) {
  const supabase = await createClient()

  try {
    const { error } = await supabase.rpc("reject_withdrawal", {
      transaction_id: transactionId,
      reason: reason
    })

    if (error) {
       captureApiError(error, {
        action: "reject-withdrawal",
        metadata: { transactionId },
      })
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    captureApiError(error, {
      action: "reject-withdrawal",
      metadata: { transactionId },
    })
    return { success: false, error: "Unexpected error during withdrawal rejection" }
  }
}
