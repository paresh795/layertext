import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { initializeUser, getUserCredits } from '@/lib/services/user-sync'

/**
 * POST /api/user/sync
 * Initialize or sync user data with Supabase
 */
export async function POST(request: NextRequest) {
  try {
    const user = await currentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Initialize user in Supabase if not exists
    const initResult = await initializeUser(user)
    if (!initResult.success) {
      console.error('Failed to initialize user:', initResult.error)
      return NextResponse.json(
        { error: 'Failed to initialize user data' },
        { status: 500 }
      )
    }
    
    // Get current credit balance
    const credits = await getUserCredits(user.id)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.primaryEmailAddress?.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName,
        credits: credits
      }
    })
  } catch (error) {
    console.error('Error in user sync:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/user/sync
 * Get current user data and credit balance
 */
export async function GET(request: NextRequest) {
  try {
    const user = await currentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const credits = await getUserCredits(user.id)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.primaryEmailAddress?.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName,
        credits: credits
      }
    })
  } catch (error) {
    console.error('Error getting user data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}