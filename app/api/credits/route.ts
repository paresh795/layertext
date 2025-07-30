import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getUserCredits, initializeUserCredits, addUserCredits } from '@/lib/services/credits'

/**
 * GET /api/credits
 * Get user's current credit balance
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
      credits,
      userId: user.id
    })

  } catch (error) {
    console.error('Credits API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch credits' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/credits
 * Add credits to user account (for testing/admin purposes)
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

    const { amount } = await request.json()

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount. Must be positive number.' },
        { status: 400 }
      )
    }

    // For now, this is open to any user for testing
    // In production, you'd want admin-only access or payment verification
    const newBalance = await addUserCredits(user.id, amount)

    return NextResponse.json({
      success: true,
      credits: newBalance,
      added: amount
    })

  } catch (error) {
    console.error('Add credits API error:', error)
    return NextResponse.json(
      { error: 'Failed to add credits' },
      { status: 500 }
    )
  }
}