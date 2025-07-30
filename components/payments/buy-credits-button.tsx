'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CreditCard, Loader2 } from 'lucide-react'
import getStripe from '@/lib/stripe/client'
import { useUser } from '@clerk/nextjs'

interface BuyCreditsButtonProps {
  disabled?: boolean
  size?: 'sm' | 'default' | 'lg'
  variant?: 'default' | 'outline' | 'secondary'
  className?: string
}

export function BuyCreditsButton({ 
  disabled = false, 
  size = 'default',
  variant = 'default',
  className = ''
}: BuyCreditsButtonProps) {
  const [loading, setLoading] = useState(false)
  const { user } = useUser()

  const handlePurchase = async () => {
    if (!user) {
      console.error('User not authenticated')
      return
    }

    try {
      setLoading(true)
      console.log('🚀 Starting credit purchase...')

      // Create checkout session
      const response = await fetch('/api/payments/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerEmail: user.primaryEmailAddress?.emailAddress,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to create payment session')
      }

      console.log('✅ Payment session created:', result.sessionId)

      // Redirect to Stripe Checkout
      const stripe = await getStripe()
      if (!stripe) {
        throw new Error('Stripe failed to load')
      }

      const { error } = await stripe.redirectToCheckout({
        sessionId: result.sessionId,
      })

      if (error) {
        console.error('Stripe redirect error:', error)
        throw error
      }

    } catch (error) {
      console.error('❌ Payment error:', error)
      // You could add toast notification here
      alert(error instanceof Error ? error.message : 'Payment failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handlePurchase}
      disabled={disabled || loading}
      size={size}
      variant={variant}
      className={className}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <CreditCard className="h-4 w-4 mr-2" />
          Buy 400 Credits ($8)
        </>
      )}
    </Button>
  )
}