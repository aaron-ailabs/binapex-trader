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
    // Get transaction details
    const { data: transaction, error: fetchError } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", transactionId)
      .single()

    if (fetchError || !transaction) {
      captureBusinessLogicError("Transaction not found for approval", {
        action: "approve-deposit",
        metadata: { transactionId },
      })
      return { success: false, error: "Transaction not found" }
    }

    // Update transaction status
    const { error: updateError } = await supabase
      .from("transactions")
      .update({ status: "completed", updated_at: new Date().toISOString() })
      .eq("id", transactionId)

    if (updateError) {
      captureApiError(updateError, {
        action: "approve-deposit-update",
        metadata: { transactionId },
      })
      return { success: false, error: updateError.message }
    }

    const { data: creditResult, error: balanceError } = await supabase.rpc("credit_user_balance", {
      p_user_id: transaction.user_id,
      p_amount: transaction.amount,
    })

    if (balanceError || !creditResult?.success) {
      // Rollback transaction status
      await supabase.from("transactions").update({ status: "pending" }).eq("id", transactionId)

      const errorMsg = balanceError?.message || creditResult?.error || "Failed to credit balance"
      captureApiError(balanceError || new Error(errorMsg), {
        action: "approve-deposit-credit",
        metadata: { transactionId, userId: transaction.user_id, amount: transaction.amount },
      })

      return { success: false, error: errorMsg }
    }

    return { success: true }
  } catch (error) {
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
  const supabase = await createClient()

  const { error } = await supabase
    .from("transactions")
    .update({ status: "completed", updated_at: new Date().toISOString() })
    .eq("id", transactionId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function rejectWithdrawal(transactionId: string, reason: string) {
  const supabase = await createClient()

  try {
    // Get transaction details
    const { data: transaction, error: fetchError } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", transactionId)
      .single()

    if (fetchError || !transaction) {
      captureBusinessLogicError("Transaction not found for rejection", {
        action: "reject-withdrawal",
        metadata: { transactionId },
      })
      return { success: false, error: "Transaction not found" }
    }

    // Update transaction status
    const { error: updateError } = await supabase
      .from("transactions")
      .update({
        status: "rejected",
        metadata: { rejection_reason: reason },
        updated_at: new Date().toISOString(),
      })
      .eq("id", transactionId)

    if (updateError) {
      captureApiError(updateError, {
        action: "reject-withdrawal-update",
        metadata: { transactionId },
      })
      return { success: false, error: updateError.message }
    }

    // Refund user balance using SQL function
    const { error: refundError } = await supabase.rpc("credit_user_balance", {
      p_user_id: transaction.user_id,
      p_amount: transaction.amount,
    })

    if (refundError) {
      captureApiError(refundError, {
        action: "reject-withdrawal-refund",
        metadata: { transactionId, userId: transaction.user_id, amount: transaction.amount },
      })
      return { success: false, error: "Failed to refund balance" }
    }

    return { success: true }
  } catch (error) {
    captureApiError(error, {
      action: "reject-withdrawal",
      metadata: { transactionId },
    })
    return { success: false, error: "Unexpected error during withdrawal rejection" }
  }
}
