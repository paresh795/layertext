'use client'

import React, { useState, useEffect } from 'react'
import { CreditCard, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

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

  const addTestCredits = async () => {
    try {
      const response = await fetch('/api/credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: 10 }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to add credits')
      }

      setCredits(result.credits)
    } catch (err) {
      console.error('Error adding credits:', err)
      setError(err instanceof Error ? err.message : 'Failed to add credits')
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
      {showAddButton && (
        <Button
          variant="outline"
          size="sm"
          onClick={addTestCredits}
          className="ml-2 px-2 py-1 h-6 text-xs"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add 10
        </Button>
      )}
    </div>
  )
}