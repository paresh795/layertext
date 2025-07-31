'use client'

import React, { useState, useEffect } from 'react'
import { CreditCard } from 'lucide-react'
import { BuyCreditsButton } from '@/components/payments/buy-credits-button'

interface CreditBalanceProps {
  showAddButton?: boolean
  className?: string
}

export function CreditBalance({ showAddButton = false, className = '' }: CreditBalanceProps) {
  const [credits, setCredits] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCredits = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/credits')
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch credits')
      }

      setCredits(result.credits)
      setError(null)
    } catch (err) {
      console.error('Error fetching credits:', err)
      setError(err instanceof Error ? err.message : 'Failed to load credits')
    } finally {
      setLoading(false)
    }
  }


  useEffect(() => {
    fetchCredits()
  }, [])

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <CreditCard className="h-4 w-4 text-gray-400" />
        <span className="text-sm text-gray-500">Loading...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <CreditCard className="h-4 w-4 text-red-500" />
        <span className="text-sm text-red-500">Error loading credits</span>
      </div>
    )
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <CreditCard className="h-4 w-4 text-gray-600" />
      <span className={`text-sm font-medium ${
        credits === 0 ? 'text-red-600' : 
        credits < 5 ? 'text-yellow-600' : 
        'text-gray-900'
      }`}>
        {credits} credits
      </span>
      {showAddButton && credits < 10 && (
        <BuyCreditsButton
          size="sm"
          variant="outline"
          className="ml-2 h-6 text-xs"
        />
      )}
    </div>
  )
}