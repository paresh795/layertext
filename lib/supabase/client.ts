import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'
import type { Database } from '@/types/database'

// Environment variable validation
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL) {
  throw new Error('Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL')
}
if (!SUPABASE_ANON_KEY) {
  throw new Error('Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY')
}
if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY')
}

// Validate URL format
try {
  new URL(SUPABASE_URL)
} catch {
  throw new Error('Invalid SUPABASE_URL format. Must be a valid URL.')
}

// Client-side Supabase client (uses anon key)
export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false, // We use Clerk for auth
    },
    global: {
      headers: {
        'x-client-info': 'layertext-client'
      }
    }
  }
)

// Server-side Supabase client (uses service role key for admin operations)
export const supabaseAdmin = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        'x-client-info': 'layertext-admin'
      }
    }
  }
)

/**
 * Create authenticated Supabase client for Clerk users
 * Uses service role with user validation (bypasses JWT issues)
 */
export async function createClerkSupabaseClient() {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('User not authenticated')
  }

  // Return admin client with user context
  // This bypasses JWT algorithm issues while maintaining security through app-level checks
  return {
    storage: supabaseAdmin.storage,
    from: supabaseAdmin.from.bind(supabaseAdmin),
    userId // Include user ID for validation in service functions
  }
}