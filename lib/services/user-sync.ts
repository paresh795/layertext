import { supabaseAdmin } from '@/lib/supabase/client'
import type { User } from '@clerk/nextjs/server'
import type { Database } from '@/types/database'

// Type definitions for service responses
type CreditOperationResult = {
  success: boolean
  error?: string
}

type UserInitResult = {
  success: boolean
  userId: string
  error?: string
}

// Input validation helpers
function validateClerkUserId(userId: string): void {
  if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
    throw new Error('Invalid Clerk user ID provided')
  }
}

function validateCreditAmount(amount: number): void {
  if (!Number.isInteger(amount) || amount < 0) {
    throw new Error('Credit amount must be a non-negative integer')
  }
}

/**
 * Initialize a new user in Supabase after Clerk registration
 * This should be called after user signs up via Clerk
 */
export async function initializeUser(clerkUser: User): Promise<UserInitResult> {
  try {
    validateClerkUserId(clerkUser.id)

    // Call the database function to initialize user credits
    const { error } = await supabaseAdmin
      .rpc('initialize_user_credits', {
        clerk_user_id: clerkUser.id
      })

    if (error) {
      console.error('Error initializing user credits:', error)
      return {
        success: false,
        userId: clerkUser.id,
        error: `Failed to initialize user: ${error.message}`
      }
    }

    console.log(`Successfully initialized user ${clerkUser.id} with 0 credits`)
    return {
      success: true,
      userId: clerkUser.id
    }
  } catch (error) {
    console.error('Error in initializeUser:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return {
      success: false,
      userId: clerkUser.id,
      error: errorMessage
    }
  }
}

/**
 * Get user's current credit balance
 */
export async function getUserCredits(clerkUserId: string): Promise<number> {
  try {
    validateClerkUserId(clerkUserId)

    const { data, error } = await supabaseAdmin
      .from('credits')
      .select('credits')
      .eq('user_id', clerkUserId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // User not found, initialize them
        const { error: initError } = await supabaseAdmin.rpc('initialize_user_credits', {
          clerk_user_id: clerkUserId
        })
        
        if (initError) {
          console.error('Error auto-initializing user credits:', initError)
          throw new Error(`Failed to initialize user credits: ${initError.message}`)
        }
        
        return 0
      }
      throw new Error(`Failed to fetch user credits: ${error.message}`)
    }

    return data?.credits || 0
  } catch (error) {
    console.error('Error getting user credits:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to get credits'
    throw new Error(errorMessage)
  }
}

/**
 * Deduct credits from user account (atomic operation)
 * Returns true if successful, false if insufficient credits
 */
export async function deductCredits(clerkUserId: string, amount: number): Promise<CreditOperationResult> {
  try {
    validateClerkUserId(clerkUserId)
    validateCreditAmount(amount)

    const { data, error } = await supabaseAdmin
      .rpc('deduct_user_credits', {
        clerk_user_id: clerkUserId,
        amount: amount
      })

    if (error) {
      console.error('Error deducting credits:', error)
      return {
        success: false,
        error: `Failed to deduct credits: ${error.message}`
      }
    }

    return {
      success: data === true
    }
  } catch (error) {
    console.error('Error in deductCredits:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to deduct credits'
    return {
      success: false,
      error: errorMessage
    }
  }
}

/**
 * Add credits to user account (for payments)
 */
export async function addCredits(clerkUserId: string, amount: number): Promise<CreditOperationResult> {
  try {
    validateClerkUserId(clerkUserId)
    validateCreditAmount(amount)

    const { error } = await supabaseAdmin
      .rpc('add_user_credits', {
        clerk_user_id: clerkUserId,
        amount: amount
      })

    if (error) {
      console.error('Error adding credits:', error)
      return {
        success: false,
        error: `Failed to add credits: ${error.message}`
      }
    }

    console.log(`Successfully added ${amount} credits to user ${clerkUserId}`)
    return {
      success: true
    }
  } catch (error) {
    console.error('Error in addCredits:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to add credits'
    return {
      success: false,
      error: errorMessage
    }
  }
}

/**
 * Get user's payment history
 */
export async function getUserPayments(clerkUserId: string): Promise<Database['public']['Tables']['payments']['Row'][]> {
  try {
    validateClerkUserId(clerkUserId)

    const { data, error } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('user_id', clerkUserId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error getting user payments:', error)
      throw new Error(`Failed to fetch user payments: ${error.message}`)
    }

    return data || []
  } catch (error) {
    console.error('Error in getUserPayments:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to get payments'
    throw new Error(errorMessage)
  }
}

/**
 * Get user's upload history
 */
export async function getUserUploads(clerkUserId: string): Promise<Database['public']['Tables']['uploads']['Row'][]> {
  try {
    validateClerkUserId(clerkUserId)

    const { data, error } = await supabaseAdmin
      .from('uploads')
      .select('*')
      .eq('user_id', clerkUserId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error getting user uploads:', error)
      throw new Error(`Failed to fetch user uploads: ${error.message}`)
    }

    return data || []
  } catch (error) {
    console.error('Error in getUserUploads:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to get uploads'
    throw new Error(errorMessage)
  }
}

/**
 * Get user's export history
 */
export async function getUserExports(clerkUserId: string): Promise<Database['public']['Tables']['exports']['Row'][]> {
  try {
    validateClerkUserId(clerkUserId)

    const { data, error } = await supabaseAdmin
      .from('exports')
      .select('*')
      .eq('user_id', clerkUserId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error getting user exports:', error)
      throw new Error(`Failed to fetch user exports: ${error.message}`)
    }

    return data || []
  } catch (error) {
    console.error('Error in getUserExports:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to get exports'
    throw new Error(errorMessage)
  }
}