import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { type User } from '@clerk/nextjs/server'
import {
  initializeUser,
  getUserCredits,
  deductCredits,
  addCredits,
  getUserPayments,
  getUserUploads,
  getUserExports
} from '../user-sync'

// Mock the Supabase client
vi.mock('@/lib/supabase/client', () => ({
  supabaseAdmin: {
    rpc: vi.fn(),
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
          order: vi.fn(() => ({
            // This would return the final query result
          }))
        }))
      }))
    }))
  }
}))

describe('UserSync Service', () => {
  const mockClerkUser: User = {
    id: 'user_test123',
    firstName: 'John',
    lastName: 'Doe',
    primaryEmailAddress: {
      emailAddress: 'john.doe@example.com'
    }
  } as User

  const mockSupabaseAdmin = vi.mocked(await import('@/lib/supabase/client')).supabaseAdmin

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('initializeUser', () => {
    it('should successfully initialize a new user', async () => {
      mockSupabaseAdmin.rpc.mockResolvedValue({
        data: 'uuid-123',
        error: null
      })

      const result = await initializeUser(mockClerkUser)

      expect(result).toEqual({
        success: true,
        userId: 'user_test123'
      })
      expect(mockSupabaseAdmin.rpc).toHaveBeenCalledWith('initialize_user_credits', {
        clerk_user_id: 'user_test123'
      })
    })

    it('should handle database errors gracefully', async () => {
      mockSupabaseAdmin.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' }
      })

      const result = await initializeUser(mockClerkUser)

      expect(result).toEqual({
        success: false,
        userId: 'user_test123',
        error: 'Failed to initialize user: Database connection failed'
      })
    })

    it('should validate Clerk user ID', async () => {
      const invalidUser = { ...mockClerkUser, id: '' }

      const result = await initializeUser(invalidUser)

      expect(result).toEqual({
        success: false,
        userId: '',
        error: 'Invalid Clerk user ID provided'
      })
    })
  })

  describe('getUserCredits', () => {
    it('should return user credits successfully', async () => {
      const mockQuery = {
        single: vi.fn().mockResolvedValue({
          data: { credits: 150 },
          error: null
        })
      }
      mockSupabaseAdmin.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => mockQuery)
        }))
      })

      const credits = await getUserCredits('user_test123')

      expect(credits).toBe(150)
      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('credits')
    })

    it('should auto-initialize user if not found', async () => {
      const mockQuery = {
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' }
        })
      }
      mockSupabaseAdmin.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => mockQuery)
        }))
      })
      mockSupabaseAdmin.rpc.mockResolvedValue({
        data: 'uuid-123',
        error: null
      })

      const credits = await getUserCredits('user_test123')

      expect(credits).toBe(0)
      expect(mockSupabaseAdmin.rpc).toHaveBeenCalledWith('initialize_user_credits', {
        clerk_user_id: 'user_test123'
      })
    })

    it('should validate user ID input', async () => {
      await expect(getUserCredits('')).rejects.toThrow('Invalid Clerk user ID provided')
      await expect(getUserCredits('   ')).rejects.toThrow('Invalid Clerk user ID provided')
    })
  })

  describe('deductCredits', () => {
    it('should successfully deduct credits', async () => {
      mockSupabaseAdmin.rpc.mockResolvedValue({
        data: true,
        error: null
      })

      const result = await deductCredits('user_test123', 50)

      expect(result).toEqual({ success: true })
      expect(mockSupabaseAdmin.rpc).toHaveBeenCalledWith('deduct_user_credits', {
        clerk_user_id: 'user_test123',
        amount: 50
      })
    })

    it('should handle insufficient credits', async () => {
      mockSupabaseAdmin.rpc.mockResolvedValue({
        data: false,
        error: null
      })

      const result = await deductCredits('user_test123', 100)

      expect(result).toEqual({ success: false })
    })

    it('should validate credit amount', async () => {
      const result = await deductCredits('user_test123', -10)
      expect(result).toEqual({
        success: false,
        error: 'Credit amount must be a non-negative integer'
      })

      const result2 = await deductCredits('user_test123', 1.5)
      expect(result2).toEqual({
        success: false,
        error: 'Credit amount must be a non-negative integer'
      })
    })
  })

  describe('addCredits', () => {
    it('should successfully add credits', async () => {
      mockSupabaseAdmin.rpc.mockResolvedValue({
        data: null,
        error: null
      })

      const result = await addCredits('user_test123', 100)

      expect(result).toEqual({ success: true })
      expect(mockSupabaseAdmin.rpc).toHaveBeenCalledWith('add_user_credits', {
        clerk_user_id: 'user_test123',
        amount: 100
      })
    })

    it('should handle database errors', async () => {
      mockSupabaseAdmin.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Connection timeout' }
      })

      const result = await addCredits('user_test123', 100)

      expect(result).toEqual({
        success: false,
        error: 'Failed to add credits: Connection timeout'
      })
    })
  })

  describe('getUserPayments', () => {
    it('should return user payment history', async () => {
      const mockPayments = [
        {
          id: 'payment-1',
          user_id: 'user_test123',
          amount: 1000,
          credits_granted: 100,
          status: 'success',
          created_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockQuery = {
        order: vi.fn().mockResolvedValue({
          data: mockPayments,
          error: null
        })
      }
      mockSupabaseAdmin.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => mockQuery)
        }))
      })

      const payments = await getUserPayments('user_test123')

      expect(payments).toEqual(mockPayments)
      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('payments')
    })

    it('should return empty array when no payments', async () => {
      const mockQuery = {
        order: vi.fn().mockResolvedValue({
          data: null,
          error: null
        })
      }
      mockSupabaseAdmin.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => mockQuery)
        }))
      })

      const payments = await getUserPayments('user_test123')

      expect(payments).toEqual([])
    })
  })

  describe('getUserUploads', () => {
    it('should return user upload history', async () => {
      const mockUploads = [
        {
          id: 'upload-1',
          user_id: 'user_test123',
          image_url: 'https://example.com/image.jpg',
          status: 'complete',
          credit_used: true,
          created_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockQuery = {
        order: vi.fn().mockResolvedValue({
          data: mockUploads,
          error: null
        })
      }
      mockSupabaseAdmin.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => mockQuery)
        }))
      })

      const uploads = await getUserUploads('user_test123')

      expect(uploads).toEqual(mockUploads)
      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('uploads')
    })
  })

  describe('getUserExports', () => {
    it('should return user export history', async () => {
      const mockExports = [
        {
          id: 'export-1',
          user_id: 'user_test123',
          export_url: 'https://example.com/export.png',
          text_content: 'Hello World',
          font_size: 24,
          font_color: '#000000',
          position_x: 0.5,
          position_y: 0.5,
          created_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockQuery = {
        order: vi.fn().mockResolvedValue({
          data: mockExports,
          error: null
        })
      }
      mockSupabaseAdmin.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => mockQuery)
        }))
      })

      const exports = await getUserExports('user_test123')

      expect(exports).toEqual(mockExports)
      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('exports')
    })
  })
})