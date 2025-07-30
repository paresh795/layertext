import Stripe from 'stripe'

// Validate environment variables
const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET

if (!stripeSecretKey) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable')
}

if (!stripeWebhookSecret) {
  throw new Error('Missing STRIPE_WEBHOOK_SECRET environment variable')
}

// Create Stripe instance
export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
})

// Credit package configuration
export const CREDIT_PACKAGE = {
  PRICE_ID: process.env.STRIPE_PRICE_ID!, // Price ID from Stripe Dashboard
  PRICE: 800, // $8.00 in cents
  CREDITS: 400, // 400 credits
  CURRENCY: 'usd' as const,
  DESCRIPTION: '400 LayerText Credits ($8.00)',
} as const

// Validate required Stripe Price ID
if (!process.env.STRIPE_PRICE_ID) {
  throw new Error('Missing STRIPE_PRICE_ID environment variable')
}

// Webhook secret for signature validation
export const webhookSecret = stripeWebhookSecret

// Stripe configuration
export const stripeConfig = {
  successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success`,
  cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=cancelled`,
  allowedCountries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'IT', 'ES', 'NL', 'SE', 'NO', 'DK', 'FI'] as const,
  paymentMethods: ['card'] as const,
}