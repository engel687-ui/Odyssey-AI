import React, { useCallback, useEffect, useState } from 'react'
import { MapPin, Navigation, Clock, Route, Battery } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { blink } from '@/blink/client'
import { CreditManager } from '@/lib/creditManager'
import type { RouteStop } from '@/types'

interface DirectionsServiceProps {
  startLocation: string
  endLocation: string
  routeStops: RouteStop[]
  onRouteCalculated?: (route: google.maps.DirectionsResult) => void
}

interface RouteInfo {
  distance: string
  duration: string
  estimatedChargeStops: number
  estimatedCost: number
}

export function DirectionsService({ 
  startLocation, 
  endLocation, 
  routeStops, 
  onRouteCalculated 
}: DirectionsServiceProps) {
  const [isCalculating, setIsCalculating] = useState(false)
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null)
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [credits, setCredits] = useState<any>(null)

  // Listen for auth changes
  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged(async (state) => {
      setUser(state.user)
      if (state.user) {
        try {
          const userCredits = await CreditManager.getUserCredits(state.user.id)
          setCredits(userCredits)
        } catch (error) {
          console.error('Error loading credits:', error)
        }
      }
    })
    return unsubscribe
  }, [])

  const calculateRoute = useCallback(async () => {
    if (!window.google || !startLocation || !endLocation) {
      setError('Google Maps not loaded or missing locations')
      return
    }

    if (!user) {
      blink.auth.login(window.location.href)
      return
    }

    const routeCalculationCost = 2 // Each route calculation costs 2 credits
    
    try {
      // Check credits before calculating
      const validation = await CreditManager.validateCreditRequirement(
        user.id,
        routeCalculationCost
      )

      if (!validation.canProceed) {
        setError(validation.message || 'Route calculation requires credits. Please upgrade your plan or contact support.')
        return
      }

      setIsCalculating(true)
      setError(null)

      const directionsService = new window.google.maps.DirectionsService()
      
      // Prepare waypoints from route stops
      const waypoints = routeStops
        .filter(stop => stop.type === 'poi' || stop.type === 'charging')
        .sort((a, b) => a.stopOrder - b.stopOrder)
        .slice(1, -1) // Remove first and last (start/end)
        .map(stop => ({
          location: new window.google.maps.LatLng(stop.latitude, stop.longitude),
          stopover: true
        }))

      const request: google.maps.DirectionsRequest = {
        origin: startLocation,
        destination: endLocation,
        waypoints: waypoints,
        travelMode: window.google.maps.TravelMode.DRIVING,
        optimizeWaypoints: true,
        avoidHighways: false,
        avoidTolls: false
      }

      directionsService.route(request, async (result, status) => {
        if (status === 'OK' && result) {
          setDirections(result)
          
          // Calculate route information
          let totalDistance = 0
          let totalDuration = 0
          
          result.routes[0].legs.forEach(leg => {
            if (leg.distance && leg.duration) {
              totalDistance += leg.distance.value
              totalDuration += leg.duration.value
            }
          })

          const distanceInMiles = Math.round(totalDistance * 0.000621371)
          const durationInHours = Math.round(totalDuration / 3600)
          const estimatedChargeStops = Math.max(1, Math.ceil(distanceInMiles / 250)) // Every 250 miles
          const estimatedCost = Math.round(distanceInMiles * 0.12) // $0.12 per mile for EV

          const routeData: RouteInfo = {
            distance: `${distanceInMiles} miles`,
            duration: `${durationInHours} hours`,
            estimatedChargeStops,
            estimatedCost
          }

          setRouteInfo(routeData)

          // Deduct credits after successful calculation
          try {
            await CreditManager.deductCredits(user.id, routeCalculationCost)
            // Refresh credit balance
            const updatedCredits = await CreditManager.getUserCredits(user.id)
            setCredits(updatedCredits)
          } catch (error) {
            console.error('Failed to deduct credits:', error)
          }

          // Pass result to parent component
          onRouteCalculated?.(result)
        } else {
          setError(`Failed to calculate route: ${status}`)
        }
        setIsCalculating(false)
      })

    } catch (error) {
      console.error('Route calculation error:', error)
      setError('Failed to calculate route. Please try again.')
      setIsCalculating(false)
    }
  }, [startLocation, endLocation, routeStops, user, onRouteCalculated])

  const clearRoute = () => {
    setDirections(null)
    setRouteInfo(null)
    setError(null)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Navigation className="h-5 w-5 mr-2 text-primary" />
          Route Directions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {!routeInfo && !isCalculating && (
          <div className="text-center py-6">
            <Route className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-600 mb-4">Calculate your EV route with charging stops</p>
            <Button onClick={calculateRoute} disabled={!startLocation || !endLocation}>
              <Navigation className="h-4 w-4 mr-2" />
              Calculate Route (2 credits)
            </Button>
          </div>
        )}

        {isCalculating && (
          <div className="text-center py-6">
            <div className="animate-spin h-8 w-8 border-2 border-primary rounded-full mx-auto mb-3"></div>
            <p className="text-gray-600">Calculating optimal route...</p>
          </div>
        )}

        {routeInfo && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 text-gray-600 mr-2" />
                  <span className="text-sm font-medium">Distance</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">{routeInfo.distance}</p>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-gray-600 mr-2" />
                  <span className="text-sm font-medium">Duration</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">{routeInfo.duration}</p>
              </div>
              
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <Battery className="h-4 w-4 text-blue-600 mr-2" />
                  <span className="text-sm font-medium">Charge Stops</span>
                </div>
                <p className="text-lg font-semibold text-blue-900">{routeInfo.estimatedChargeStops}</p>
              </div>
              
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <span className="text-sm font-medium">Est. Cost</span>
                </div>
                <p className="text-lg font-semibold text-green-900">${routeInfo.estimatedCost}</p>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button variant="outline" onClick={clearRoute} className="flex-1">
                Clear Route
              </Button>
              <Button onClick={calculateRoute} className="flex-1">
                <Navigation className="h-4 w-4 mr-2" />
                Recalculate
              </Button>
            </div>
          </div>
        )}

        {directions && (
          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-900 mb-2">Turn-by-turn Directions</h4>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {directions.routes[0].legs.map((leg, legIndex) => 
                leg.steps.map((step, stepIndex) => (
                  <div key={`${legIndex}-${stepIndex}`} className="flex text-sm">
                    <span className="w-8 text-gray-500 flex-shrink-0">{stepIndex + 1}.</span>
                    <div 
                      className="text-gray-700" 
                      dangerouslySetInnerHTML={{ __html: step.instructions || '' }}
                    />
                    <span className="ml-auto text-gray-500 flex-shrink-0">
                      {step.distance?.text}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {credits && (
          <div className="text-xs text-gray-500 text-center">
            Credits remaining: {credits.creditsRemaining}
          </div>
        )}
      </CardContent>
    </Card>
  )
}