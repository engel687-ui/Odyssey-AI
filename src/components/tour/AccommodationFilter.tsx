import React, { useState, useEffect } from 'react'
import { Home, Tent, Zap, Wifi, Car, Star } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { RouteStop } from '@/types'

interface AccommodationFilterProps {
  routeStops: RouteStop[]
  accommodationType: 'hotel' | 'camping' | 'both'
  onUpdateRoute: (updatedStops: RouteStop[]) => void
}

interface Accommodation {
  id: string
  name: string
  type: 'hotel' | 'camping'
  latitude: number
  longitude: number
  rating: number
  priceRange: string
  evCharging: boolean
  amenities: string[]
  description: string
  imageUrl?: string
}

export function AccommodationFilter({ 
  routeStops, 
  accommodationType, 
  onUpdateRoute 
}: AccommodationFilterProps) {
  const [accommodations, setAccommodations] = useState<Accommodation[]>([])
  const [filter, setFilter] = useState<'all' | 'hotel' | 'camping'>(accommodationType === 'both' ? 'all' : accommodationType)

  useEffect(() => {
    // Enhanced accommodation data with EV charging and images
    const accommodationImages = [
      'https://images.unsplash.com/photo-1745393404775-ae350c1677ef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NzI1Njd8MHwxfHNlYXJjaHwxfHxob3RlbCUyMHdpdGglMjBlbGVjdHJpYyUyMHZlaGljbGUlMjBjaGFyZ2luZ3xlbnwwfDB8fHwxNzU2NzQ4MzMzfDA&ixlib=rb-4.1.0&q=80&w=1080',
      'https://images.unsplash.com/photo-1569848893571-5bea842dbf20?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NzI1Njd8MHwxfHNlYXJjaHwyfHxob3RlbCUyMHdpdGglMjBlbGVjdHJpYyUyMHZlaGljbGUlMjBjaGFyZ2luZ3xlbnwwfDB8fHwxNzU2NzQ4MzMzfDA&ixlib=rb-4.1.0&q=80&w=1080',
      'https://images.unsplash.com/photo-1623079399942-368de709ea32?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NzI1Njd8MHwxfHNlYXJjaHwzfHxob3RlbCUyMHdpdGglMjBlbGVjdHJpYyUyMHZlaGljbGUlMjBjaGFyZ2luZ3xlbnwwfDB8fHwxNzU2NzQ4MzMzfDA&ixlib=rb-4.1.0&q=80&w=1080'
    ]

    const mockAccommodations: Accommodation[] = [
      {
        id: 'hotel_1',
        name: 'EcoLodge Inn & Suites',
        type: 'hotel',
        latitude: 37.2431,
        longitude: -121.7910,
        rating: 4.5,
        priceRange: '$120-180',
        evCharging: true,
        imageUrl: accommodationImages[0],
        amenities: ['Level 2 EV Charging', 'WiFi', 'Pool', 'Fitness Center', 'Restaurant'],
        description: 'Sustainable hotel with dedicated EV charging stations in every parking spot.'
      },
      {
        id: 'camping_1',
        name: 'Pine Ridge RV Park & Campground',
        type: 'camping',
        latitude: 36.7783,
        longitude: -119.4179,
        rating: 4.2,
        priceRange: '$35-65',
        evCharging: true,
        imageUrl: accommodationImages[1],
        amenities: ['50A RV Hookups', '240V EV Charging', 'WiFi', 'Showers', 'Laundry'],
        description: 'Full-service campground with EV charging stations and stunning mountain views.'
      },
      {
        id: 'hotel_2',
        name: 'Tesla Destination Hotel',
        type: 'hotel',
        latitude: 35.3733,
        longitude: -119.0187,
        rating: 4.7,
        priceRange: '$200-300',
        evCharging: true,
        imageUrl: accommodationImages[2],
        amenities: ['Tesla Destination Charging', 'Spa', 'Fine Dining', 'Concierge', 'Valet'],
        description: 'Luxury hotel with Tesla Destination Charging and premium amenities.'
      },
      {
        id: 'camping_2',
        name: 'Desert Oasis Campground',
        type: 'camping',
        latitude: 34.4208,
        longitude: -118.6926,
        rating: 4.0,
        priceRange: '$25-45',
        evCharging: true,
        amenities: ['EV Charging Posts', 'Fire Pits', 'Picnic Tables', 'Restrooms', 'Store'],
        description: 'Desert camping experience with modern EV charging infrastructure.'
      },
      {
        id: 'hotel_3',
        name: 'Green Valley Resort',
        type: 'hotel',
        latitude: 34.0522,
        longitude: -118.2437,
        rating: 4.3,
        priceRange: '$150-220',
        evCharging: true,
        amenities: ['Universal EV Charging', 'Golf Course', 'Multiple Restaurants', 'Conference Center'],
        description: 'Full-service resort with comprehensive EV charging facilities.'
      }
    ]
    setAccommodations(mockAccommodations)
  }, [])

  const filteredAccommodations = accommodations.filter(acc => {
    if (filter === 'all') return true
    return acc.type === filter
  })

  const addAccommodationStop = (accommodation: Accommodation) => {
    const newStop: RouteStop = {
      id: `accommodation_${Date.now()}`,
      tourId: routeStops[0]?.tourId || 'temp',
      type: 'accommodation',
      name: accommodation.name,
      description: `${accommodation.description} • ${accommodation.priceRange} • ${accommodation.rating}★`,
      latitude: accommodation.latitude,
      longitude: accommodation.longitude,
      stopOrder: routeStops.length + 1,
      amenities: JSON.stringify(accommodation.amenities),
      createdAt: new Date().toISOString()
    }

    onUpdateRoute([...routeStops, newStop])
  }

  const getTypeIcon = (type: 'hotel' | 'camping') => {
    return type === 'hotel' ? Home : Tent
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Home className="h-5 w-5 mr-2 text-primary" />
            Accommodations
          </div>
          <div className="flex rounded-lg border p-1">
            {[
              { value: 'all', label: 'All', icon: null },
              { value: 'hotel', label: 'Hotels', icon: Home },
              { value: 'camping', label: 'Camping', icon: Tent }
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setFilter(value as any)}
                className={`px-3 py-1 rounded text-sm flex items-center space-x-1 transition-colors ${
                  filter === value
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {Icon && <Icon className="h-3 w-3" />}
                <span>{label}</span>
              </button>
            ))}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {filteredAccommodations.map((accommodation) => {
          const TypeIcon = getTypeIcon(accommodation.type)
          
          return (
            <div key={accommodation.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
              {accommodation.imageUrl && (
                <div className="relative h-48 bg-gray-200">
                  <img
                    src={accommodation.imageUrl}
                    alt={accommodation.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3">
                    <span className={`px-2 py-1 text-white text-xs rounded-full flex items-center ${
                      accommodation.type === 'hotel' ? 'bg-blue-600' : 'bg-green-600'
                    }`}>
                      <TypeIcon className="h-3 w-3 mr-1" />
                      {accommodation.type === 'hotel' ? 'Hotel' : 'Camping'}
                    </span>
                  </div>
                  {accommodation.evCharging && (
                    <div className="absolute top-3 right-3">
                      <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full flex items-center">
                        <Zap className="h-3 w-3 mr-1" />
                        EV Charging
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 text-lg mb-1">
                      {accommodation.name}
                    </h4>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center">
                        {renderStars(accommodation.rating)}
                        <span className="ml-1 text-sm text-gray-600">{accommodation.rating}</span>
                      </div>
                      <span className="text-sm text-gray-400">•</span>
                      <span className="text-sm font-medium text-green-600">
                        {accommodation.priceRange}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => addAccommodationStop(accommodation)}
                    className="ml-3"
                  >
                    Add Stop
                  </Button>
                </div>

                <p className="text-sm text-gray-600 mb-3">{accommodation.description}</p>

                <div className="flex flex-wrap gap-2">
                  {accommodation.amenities.map((amenity, index) => {
                    const isEvCharging = amenity.toLowerCase().includes('charging') || amenity.toLowerCase().includes('ev')
                    return (
                      <span
                        key={index}
                        className={`px-2 py-1 text-xs rounded-full flex items-center ${
                          isEvCharging
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {isEvCharging && <Zap className="h-3 w-3 mr-1" />}
                        {amenity}
                      </span>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}

        {filteredAccommodations.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Home className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p>No accommodations found for the selected filter.</p>
          </div>
        )}

        {/* Current Accommodation Stops */}
        {routeStops.filter(stop => stop.type === 'accommodation').length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="font-medium text-gray-900 mb-2">Selected Accommodations</h4>
            <div className="space-y-2">
              {routeStops
                .filter(stop => stop.type === 'accommodation')
                .map((stop) => (
                  <div key={stop.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Home className="h-4 w-4 text-blue-600" />
                      <div>
                        <span className="text-sm font-medium text-blue-900">{stop.name}</span>
                        <p className="text-xs text-blue-700">{stop.description?.split('•')[0]}</p>
                      </div>
                    </div>
                    <span className="text-xs text-blue-700">Night #{Math.ceil(stop.stopOrder / 2)}</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}