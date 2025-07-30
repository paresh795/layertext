import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { stripe, CREDIT_PACKAGE, stripeConfig } from '@/lib/stripe/server'

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user email from request body (optional)
    const body = await request.json().catch(() => ({}))
    const { customerEmail } = body

    console.log('🚀 Creating Stripe checkout session for user:', userId)

    // Create Stripe checkout session using Price ID  
    const session = await stripe.checkout.sessions.create({
      payment_method_types: stripeConfig.paymentMethods,
      line_items: [
        {
          price: CREDIT_PACKAGE.PRICE_ID, // Use Price ID from Stripe Dashboard
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: stripeConfig.successUrl,
      cancel_url: stripeConfig.cancelUrl,
      customer_email: customerEmail,
      client_reference_id: userId, // Link payment to user
      metadata: {
        userId,
        credits: CREDIT_PACKAGE.CREDITS.toString(),
        package: 'standard',
      },
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes
      billing_address_collection: 'auto',
      shipping_address_collection: undefined,
      allow_promotion_codes: true,
    })

    console.log('✅ Stripe session created:', session.id)

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    })

  } catch (error) {
    console.error('❌ Error creating Stripe session:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Payment session creation failed' 
      },
      { status: 500 }
    )
  }
}