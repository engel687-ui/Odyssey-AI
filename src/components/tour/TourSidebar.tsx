import React, { useState, useEffect } from 'react'
import { X, MapPin, Battery, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ChargingPlanner } from './ChargingPlanner'
import { AccommodationFilter } from './AccommodationFilter'
import { AudioNarration } from './AudioNarration'
import { SightsGallery } from './SightsGallery'
import { DirectionsService } from '@/components/map/DirectionsService'
import type { Tour, RouteStop } from '@/types'

interface TourSidebarProps {
  tour: Tour
  routeStops: RouteStop[]
  onClose: () => void
}

export function TourSidebar({ tour, routeStops, onClose }: TourSidebarProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'charging' | 'accommodation' | 'audio' | 'sights' | 'directions'>('overview')
  const [localRouteStops, setLocalRouteStops] = useState<RouteStop[]>(routeStops)
  const [currentStopIndex, setCurrentStopIndex] = useState(0)

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📋' },
    { id: 'directions', label: 'Route', icon: '🗺️' },
    { id: 'charging', label: 'Charging', icon: '⚡' },
    { id: 'accommodation', label: 'Hotels', icon: '🏨' },
    { id: 'audio', label: 'Audio Guide', icon: '🎵' },
    { id: 'sights', label: 'Sights', icon: '📸' }
  ]

  const handleUpdateRoute = (updatedStops: RouteStop[]) => {
    setLocalRouteStops(updatedStops)
  }

  const handleSelectSight = (newStop: RouteStop) => {
    setLocalRouteStops(prev => [...prev, newStop])
  }

  const preferences = tour.preferences ? JSON.parse(tour.preferences) : {}

  const getStopIcon = (type: string) => {
    switch (type) {
      case 'charging':
        return '⚡'
      case 'accommodation':
        return '🏨'
      default:
        return '📍'
    }
  }

  const getStopColor = (type: string) => {
    switch (type) {
      case 'charging':
        return 'text-blue-600 bg-blue-50'
      case 'accommodation':
        return 'text-green-600 bg-green-50'
      default:
        return 'text-amber-600 bg-amber-50'
    }
  }

  // Keep localRouteStops in sync when prop changes
  useEffect(() => {
    setLocalRouteStops(routeStops)
  }, [routeStops])

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-4">
            {/* Tour Description */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Tour Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {tour.description?.slice(0, 300)}...
                </p>
              </CardContent>
            </Card>

            {/* Route Stops */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Route Stops</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {localRouteStops
                  .sort((a, b) => a.stopOrder - b.stopOrder)
                  .slice(0, 5)
                  .map((stop, index) => (
                    <div
                      key={stop.id}
                      className="flex items-start space-x-3 p-2 rounded-lg border cursor-pointer hover:bg-gray-50"
                      onClick={() => setCurrentStopIndex(index)}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${getStopColor(stop.type)}`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm">
                          {stop.name}
                        </h4>
                        <p className="text-xs text-gray-600 mb-2">
                          {stop.description}
                        </p>
                        {stop.amenities && (
                          <div className="flex flex-wrap gap-1">
                            {JSON.parse(stop.amenities).slice(0, 2).map((amenity: string, idx: number) => (
                              <span
                                key={idx}
                                className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                              >
                                {amenity}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-lg">
                        {getStopIcon(stop.type)}
                      </div>
                    </div>
                  ))}
                {localRouteStops.length > 5 && (
                  <p className="text-xs text-gray-500 text-center">
                    +{localRouteStops.length - 5} more stops
                  </p>
                )}
              </CardContent>
            </Card>

            {/* EV Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-sm">
                  <Battery className="h-4 w-4 mr-2 text-primary" />
                  EV Trip Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Charging Stops:</span>
                    <span className="font-medium">
                      {localRouteStops.filter(s => s.type === 'charging').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Accommodations:</span>
                    <span className="font-medium">
                      {localRouteStops.filter(s => s.type === 'accommodation').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Points of Interest:</span>
                    <span className="font-medium">
                      {localRouteStops.filter(s => s.type === 'poi').length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'directions':
        return (
          <DirectionsService
            startLocation={tour.startLocation}
            endLocation={tour.endLocation}
            routeStops={localRouteStops}
            onRouteCalculated={(route) => {
              console.log('Route calculated:', route)
            }}
          />
        )

      case 'charging':
        return (
          <ChargingPlanner
            routeStops={localRouteStops}
            vehicleRange={preferences.vehicleRange || 300}
            onUpdateRoute={handleUpdateRoute}
          />
        )

      case 'accommodation':
        return (
          <AccommodationFilter
            routeStops={localRouteStops}
            accommodationType={preferences.accommodationType || 'both'}
            onUpdateRoute={handleUpdateRoute}
          />
        )

      case 'audio':
        return (
          <AudioNarration
            routeStops={localRouteStops}
            currentStopIndex={currentStopIndex}
            onStopChange={setCurrentStopIndex}
          />
        )

      case 'sights':
        return (
          <SightsGallery
            routeStops={localRouteStops}
            onSelectSight={handleSelectSight}
          />
        )

      default:
        return null
    }
  }

  return (
    <div className="w-96 bg-white border-r h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-900">{tour.title}</h2>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-1" />
            {tour.durationDays} days
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            {localRouteStops.length} stops
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b flex-shrink-0">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-shrink-0 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {renderTabContent()}
      </div>
    </div>
  )
}