import { supabaseAdmin } from '@/lib/supabase/client'

export interface CreditBalance {
  credits: number
  userId: string
}

/**
 * Initialize user with starting credits (called when user first signs up)
 */
export async function initializeUserCredits(userId: string): Promise<CreditBalance> {
  try {
    // Check if user already has a profile
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('credits')
      .eq('user_id', userId)
      .single()

    if (existingProfile) {
      return {
        credits: existingProfile.credits,
        userId
      }
    }

    // Create new profile with starting credits
    const { data: newProfile, error } = await supabaseAdmin
      .from('profiles')
      .insert({
        user_id: userId,
        credits: 10 // Start with 10 free credits
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to initialize user credits: ${error.message}`)
    }

    return {
      credits: newProfile.credits,
      userId
    }
  } catch (error) {
    console.error('Error initializing user credits:', error)
    throw error
  }
}

/**
 * Get user's current credit balance
 */
export async function getUserCredits(userId: string): Promise<number> {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('credits')
      .eq('user_id', userId)
      .single()

    if (error) {
      // If user doesn't exist, initialize them
      if (error.code === 'PGRST116') {
        const initialized = await initializeUserCredits(userId)
        return initialized.credits
      }
      throw error
    }

    return data.credits
  } catch (error) {
    console.error('Error getting user credits:', error)
    throw error
  }
}

/**
 * Add credits to user account (for testing or admin purposes)
 */
export async function addUserCredits(userId: string, amount: number): Promise<number> {
  try {
    // Ensure user has a profile first
    await initializeUserCredits(userId)

    // Get current credits and add the amount
    const currentCredits = await getUserCredits(userId)
    const newCredits = currentCredits + amount

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({
        credits: newCredits,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select('credits')
      .single()

    if (error) {
      throw new Error(`Failed to add credits: ${error.message}`)
    }

    return data.credits
  } catch (error) {
    console.error('Error adding user credits:', error)
    throw error
  }
}

/**
 * Deduct credits from user account (atomic operation)
 */
export async function deductUserCredits(userId: string, amount: number = 1): Promise<number> {
  try {
    const { data, error } = await supabaseAdmin
      .rpc('decrement_user_credits', {
        user_id_param: userId,
        amount: amount
      })

    if (error) {
      throw new Error(`Failed to deduct credits: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error('Error deducting user credits:', error)
    throw error
  }
}

/**
 * Check if user has sufficient credits for an operation
 */
export async function hasCredits(userId: string, required: number = 1): Promise<boolean> {
  try {
    const credits = await getUserCredits(userId)
    return credits >= required
  } catch (error) {
    console.error('Error checking user credits:', error)
    return false
  }
}