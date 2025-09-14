import React, { useState, useEffect } from 'react'
import { MapPin } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { FrontLoader } from '@/components/pages/FrontLoader'
import { TourPlanningForm } from '@/components/forms/TourPlanningForm'
import { MapView } from '@/components/map/MapView'
import { TourSidebar } from '@/components/tour/TourSidebar'
import { blink } from '@/blink/client'
import { CreditManager } from '@/lib/creditManager'
import { withCreditCheck } from '@/lib/creditManager'
import type { TourPreferences, Tour, RouteStop } from '@/types'

function App() {
  const [showFrontLoader, setShowFrontLoader] = useState(true)
  const [showPlanningForm, setShowPlanningForm] = useState(false)
  const [currentTour, setCurrentTour] = useState<Tour | null>(null)
  const [routeStops, setRouteStops] = useState<RouteStop[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Initialize auth state
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
    })
    return unsubscribe
  }, [])

  const handlePlanTour = () => {
    setShowFrontLoader(false)
    setShowPlanningForm(true)
  }

  const handleStartTourFromFrontLoader = () => {
    setShowFrontLoader(false)
  }

  const createMapWithPreferences = async (preferences: any) => {
    setShowPlanningForm(false)
    setIsGenerating(true)

    try {
      // Use the enhanced MapGenerator for comprehensive tour creation
      const { MapGenerator } = await import('@/components/maps/MapGenerator')
      const result = await MapGenerator.createPersonalizedMap(preferences, user)
      
      setCurrentTour(result.tour)
      setRouteStops(result.routeStops)
    } catch (error) {
      console.error('Failed to generate tour:', error)
      
      let errorMessage = 'Failed to generate tour. Please try again.'
      
      if (error instanceof Error) {
        if (error.message.includes('Insufficient credits')) {
          errorMessage = error.message
        } else if (error.message.includes('sign in')) {
          errorMessage = 'Please sign in to generate tours.'
        }
      }
      
      // Show error to user (you might want to add a toast notification system)
      alert(errorMessage)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCloseTour = () => {
    setCurrentTour(null)
    setRouteStops([])
    setShowFrontLoader(true)
  }

  return (
    <div className="min-h-screen bg-background">
      {showFrontLoader && !currentTour ? (
        <FrontLoader onStartTour={handleStartTourFromFrontLoader} />
      ) : (
        <>
          <Header onStartTour={handlePlanTour} />
          
          <main className="relative">
            {/* Tour Planning Form Modal */}
            {showPlanningForm && (
              <TourPlanningForm
                onSubmit={createMapWithPreferences}
                onCancel={() => setShowPlanningForm(false)}
              />
            )}

            {/* Loading State */}
            {isGenerating && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-card/95 backdrop-blur-md border border-border/20 rounded-3xl p-10 text-center max-w-md mx-4 animate-scale-in">
                  <div className="relative mb-6">
                    <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto"></div>
                    <div className="absolute inset-0 w-16 h-16 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 animate-ping mx-auto"></div>
                  </div>
                  <h3 className="text-2xl font-semibold mb-3 text-foreground">Crafting Your Adventure</h3>
                  <p className="text-muted-foreground leading-relaxed">Our AI is analyzing your preferences and creating the perfect personalized journey...</p>
                </div>
              </div>
            )}

            {/* Map and Tour View */}
            {currentTour && (
              <div className="h-[calc(100vh-4rem)] flex">
                <TourSidebar 
                  tour={currentTour}
                  routeStops={routeStops}
                  onClose={handleCloseTour}
                />
                <div className="flex-1">
                  <MapView 
                    routeStops={routeStops}
                    startLocation={currentTour.startLocation}
                    endLocation={currentTour.endLocation}
                  />
                </div>
              </div>
            )}
          </main>
        </>
      )}
    </div>
  )
}

export default App