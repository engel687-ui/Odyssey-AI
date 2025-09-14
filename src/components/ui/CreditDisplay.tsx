import React, { useState, useEffect } from 'react'
import { Coins, AlertTriangle, Info } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CreditManager } from '@/lib/creditManager'
import type { UserCredits } from '@/types'

interface CreditDisplayProps {
  userId: string | null
  className?: string
  showDetails?: boolean
}

export function CreditDisplay({ userId, className = '', showDetails = false }: CreditDisplayProps) {
  const [credits, setCredits] = useState<UserCredits | null>(null)
  const [loading, setLoading] = useState(true)
  const [showInfo, setShowInfo] = useState(false)

  const loadCredits = async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    try {
      const userCredits = await CreditManager.getUserCredits(userId)
      setCredits(userCredits)
    } catch (error) {
      console.error('Error loading credits:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCredits()
  }, [userId])

  if (loading) {
    return (
      <div className={`flex items-center ${className}`}>
        <div className="animate-pulse flex items-center">
          <Coins className="h-4 w-4 mr-1 text-gray-400" />
          <span className="text-sm text-gray-400">Loading...</span>
        </div>
      </div>
    )
  }

  if (!userId) {
    return (
      <div className={`flex items-center ${className}`}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.href = '/login'}
          className="text-xs"
        >
          Sign in for credits
        </Button>
      </div>
    )
  }

  if (!credits) {
    return (
      <div className={`flex items-center text-red-600 ${className}`}>
        <AlertTriangle className="h-4 w-4 mr-1" />
        <span className="text-sm">Credit error</span>
      </div>
    )
  }

  const isLowCredits = credits.creditsRemaining <= 2
  const isOutOfCredits = credits.creditsRemaining === 0

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center">
        <Coins className={`h-4 w-4 mr-1 ${
          isOutOfCredits ? 'text-red-500' : 
          isLowCredits ? 'text-amber-500' : 
          'text-emerald-500'
        }`} />
        <span className={`text-sm font-medium ${
          isOutOfCredits ? 'text-red-600' : 
          isLowCredits ? 'text-amber-600' : 
          'text-gray-700'
        }`}>
          {credits.creditsRemaining}
        </span>
        
        {showDetails && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowInfo(!showInfo)}
            className="ml-1 p-1 h-6 w-6"
          >
            <Info className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Low credits warning */}
      {isLowCredits && (
        <div className="absolute top-full left-0 mt-1 z-10">
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-3 text-xs">
              <div className="flex items-center text-amber-800">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {isOutOfCredits ? (
                  <span>Out of credits! Upgrade to continue.</span>
                ) : (
                  <span>Low credits remaining</span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Credit info popup */}
      {showInfo && showDetails && (
        <div className="absolute top-full right-0 mt-1 z-20">
          <Card className="w-64 shadow-lg">
            <CardContent className="p-4 space-y-3">
              <div className="text-sm font-medium text-gray-900">Credit Usage</div>
              
              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Tour Generation:</span>
                  <span>3 credits</span>
                </div>
                <div className="flex justify-between">
                  <span>Audio Narration:</span>
                  <span>2 credits</span>
                </div>
                <div className="flex justify-between">
                  <span>Route Planning:</span>
                  <span>1 credit</span>
                </div>
                <div className="flex justify-between">
                  <span>AI Descriptions:</span>
                  <span>1 credit</span>
                </div>
              </div>
              
              <div className="pt-2 border-t">
                <div className="flex justify-between text-sm font-medium">
                  <span>Remaining:</span>
                  <span className={isLowCredits ? 'text-amber-600' : 'text-emerald-600'}>
                    {credits.creditsRemaining} credits
                  </span>
                </div>
              </div>

              {isLowCredits && (
                <Button size="sm" className="w-full text-xs">
                  Upgrade Plan
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}