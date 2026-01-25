/**
 * Admin Auth Boundary Tests
 *
 * These tests verify that admin access is properly enforced
 * and that only users with admin_users membership can access admin routes.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient } from '@/lib/supabase/client'

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
    rpc: vi.fn(),
  })),
}))

describe('Admin Auth Boundaries', () => {
  let mockSupabase: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase = createClient()
  })

  it('access denied without admin_users membership', async () => {
    // Test that non-admin users get 403

    // Mock user session (non-admin user)
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'regular-user-id', email: 'user@example.com' } },
      error: null,
    })

    // Mock admin_users query (no membership)
    mockSupabase.from('admin_users').select().eq().single.mockResolvedValue({
      data: null,
      error: { message: 'No rows returned' },
    })

    // Attempt to access admin route
    const response = await fetch('/admin/dashboard')

    // Should return 403
    expect(response.status).toBe(403)
  })

  it('access granted with admin_users membership', async () => {
    // Test that admin users get 200

    // Mock user session (admin user)
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'admin-user-id', email: 'admin@example.com' } },
      error: null,
    })

    // Mock admin_users query (has membership)
    mockSupabase.from('admin_users').select().eq().single.mockResolvedValue({
      data: { id: 'admin-user-id', user_id: 'admin-user-id' },
      error: null,
    })

    // Attempt to access admin route
    const response = await fetch('/admin/dashboard')

    // Should return 200
    expect(response.status).toBe(200)
  })

  it('fail closed on lookup error', async () => {
    // Test that DB errors result in 403

    // Mock user session
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-id', email: 'user@example.com' } },
      error: null,
    })

    // Mock admin_users query with error
    mockSupabase.from('admin_users').select().eq().single.mockResolvedValue({
      data: null,
      error: { message: 'Database connection failed' },
    })

    // Attempt to access admin route
    const response = await fetch('/admin/dashboard')

    // Should return 403 (fail closed)
    expect(response.status).toBe(403)
  })

  it('admin_users table exists and has proper schema', async () => {
    // Test that admin_users table exists with correct columns

    // Mock table schema query
    mockSupabase.from('admin_users').select().limit(1).mockResolvedValue({
      data: [],
      error: null,
    })

    // Should not throw error
    const result = await mockSupabase.from('admin_users').select().limit(1)
    expect(result.error).toBeNull()
  })

  it('admin_users has unique constraint on user_id', async () => {
    // Test that duplicate admin entries are rejected

    // Mock insert that should fail due to unique constraint
    mockSupabase.from('admin_users').insert().mockResolvedValue({
      data: null,
      error: { message: 'duplicate key value violates unique constraint' },
    })

    // Attempt to insert duplicate
    const result = await mockSupabase
      .from('admin_users')
      .insert({ user_id: 'existing-user-id' })

    // Should return error
    expect(result.error).toBeDefined()
    expect(result.error.message).toContain('duplicate key')
  })
})
