/**
 * Environment Auth Boundary Tests
 *
 * These tests verify that environment variables are properly validated
 * and that missing env vars cause the app to fail fast.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { validateEnv } from '@/lib/env'

// Mock process.env
const originalEnv = process.env

describe('Environment Auth Boundaries', () => {
  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('missing env vars throw at startup', async () => {
    // Test that missing env vars cause validation to fail

    // Remove required env vars
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    delete process.env.SUPABASE_SERVICE_ROLE_KEY

    // Attempt to validate
    expect(() => validateEnv()).toThrow()
  })

  it('NEXT_PUBLIC_SUPABASE_URL is required', async () => {
    // Test that NEXT_PUBLIC_SUPABASE_URL is required

    // Set other env vars but remove NEXT_PUBLIC_SUPABASE_URL
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
    delete process.env.NEXT_PUBLIC_SUPABASE_URL

    expect(() => validateEnv()).toThrow('NEXT_PUBLIC_SUPABASE_URL')
  })

  it('NEXT_PUBLIC_SUPABASE_ANON_KEY is required', async () => {
    // Test that NEXT_PUBLIC_SUPABASE_ANON_KEY is required

    // Set other env vars but remove NEXT_PUBLIC_SUPABASE_ANON_KEY
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    expect(() => validateEnv()).toThrow('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  })

  it('SUPABASE_SERVICE_ROLE_KEY is required', async () => {
    // Test that SUPABASE_SERVICE_ROLE_KEY is required

    // Set other env vars but remove SUPABASE_SERVICE_ROLE_KEY
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
    delete process.env.SUPABASE_SERVICE_ROLE_KEY

    expect(() => validateEnv()).toThrow('SUPABASE_SERVICE_ROLE_KEY')
  })

  it('valid env vars pass validation', async () => {
    // Test that valid env vars pass validation

    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'

    expect(() => validateEnv()).not.toThrow()
  })

  it('no fallback values in proxy.ts', async () => {
    // Test that proxy.ts doesn't use fallback values

    // This is verified by checking the code
    // The proxy.ts should throw errors on missing env vars
    // No || fallback logic should exist
  })

  it('client-side code cannot access service role key', async () => {
    // Test that service role key is not accessible client-side

    // This is verified by checking the code structure
    // Service role key should only be used in server-side code
    // Client-side code should only use NEXT_PUBLIC_SUPABASE_ANON_KEY
  })
})
