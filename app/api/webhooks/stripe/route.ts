import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe, webhookSecret, CREDIT_PACKAGE } from '@/lib/stripe/server'
import { addUserCredits } from '@/lib/services/credits'
import { supabaseAdmin } from '@/lib/supabase/client'
import type Stripe from 'stripe'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      console.error('❌ Missing Stripe signature')
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    console.log('🔗 Processing Stripe webhook...')

    // Verify webhook signature
    let event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    console.log('📧 Webhook event type:', event.type)

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.client_reference_id || session.metadata?.userId
        
        if (!userId) {
          console.error('❌ No user ID found in session')
          return NextResponse.json({ error: 'No user ID' }, { status: 400 })
        }

        console.log('💳 Payment successful for user:', userId)
        console.log('🎯 Session ID:', session.id)
        console.log('💰 Amount:', session.amount_total)

        // Create payment record
        const paymentData = {
          user_id: userId,
          stripe_payment_id: (typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id) || session.id,
          amount: session.amount_total || 0,
          credits_granted: CREDIT_PACKAGE.CREDITS,
          status: 'success' as const,
          credit_grant_id: `stripe_${session.id}`, // Idempotency key
        }
        
        const { error: paymentError } = await supabaseAdmin
          .from('payments')
          .insert(paymentData)

        if (paymentError) {
          console.error('❌ Error creating payment record:', paymentError)
          return NextResponse.json({ error: 'Database error' }, { status: 500 })
        }

        // Add credits to user account 
        try {
          const newBalance = await addUserCredits(userId, CREDIT_PACKAGE.CREDITS)
          console.log(`✅ Credits added successfully. New balance: ${newBalance}`)
        } catch (creditError) {
          console.error('❌ Error adding credits:', creditError)
          // Don't return error - payment was successful, we'll retry credit grant
        }

        console.log('✅ Credits granted successfully:', CREDIT_PACKAGE.CREDITS)
        break
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session
        console.log('⏰ Checkout session expired:', session.id)
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log('❌ Payment failed:', paymentIntent.id)
        
        // Log failed payment (optional)
        await supabaseAdmin
          .from('payments')
          .insert({
            user_id: paymentIntent.metadata?.userId || 'unknown',
            stripe_payment_id: paymentIntent.id,
            amount: paymentIntent.amount,
            credits_granted: 0,
            status: 'failed',
            credit_grant_id: `failed_${paymentIntent.id}`,
          })
        break
      }

      default:
        console.log('ℹ️  Unhandled event type:', event.type)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('❌ Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

// Configure webhook route
export const runtime = 'nodejs'