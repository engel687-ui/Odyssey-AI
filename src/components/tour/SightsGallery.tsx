import React, { useState, useEffect } from 'react'
import { Camera, MapPin, Clock, Star, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { RouteStop } from '@/types'

interface SightsGalleryProps {
  routeStops: RouteStop[]
  onSelectSight: (stop: RouteStop) => void
}

interface FamousSight {
  id: string
  name: string
  description: string
  location: string
  category: string
  rating: number
  visitDuration: string
  imageUrl?: string
  facts: string[]
  coordinates: [number, number]
  bestTimeToVisit: string
}

export function SightsGallery({ routeStops, onSelectSight }: SightsGalleryProps) {
  const [sights, setSights] = useState<FamousSight[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedSight, setSelectedSight] = useState<FamousSight | null>(null)

  const generateFamousSights = React.useCallback(async () => {
    if (routeStops.length === 0) return

    setIsLoading(true)
    
    try {
      // Get scenic images from Unsplash for visual appeal
      const scenicImages = [
        'https://images.unsplash.com/photo-1596693097925-9d818cc9692d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NzI1Njd8MHwxfHNlYXJjaHwxfHxzY2VuaWMlMjBtb3VudGFpbiUyMGxhbmRzY2FwZXxlbnwwfDB8fHwxNzU2NzQ4MjgzfDA&ixlib=rb-4.1.0&q=80&w=1080',
        'https://images.unsplash.com/photo-1596688380752-d417edaef75f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NzI1Njd8MHwxfHNlYXJjaHwyfHxzY2VuaWMlMjBtb3VudGFpbiUyMGxhbmRzY2FwZXxlbnwwfDB8fHwxNzU2NzQ4MjgzfDA&ixlib=rb-4.1.0&q=80&w=1080',
        'https://images.unsplash.com/photo-1596688382313-5c9be3417f73?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NzI1Njd8MHwxfHNlYXJjaHwzfHxzY2VuaWMlMjBtb3VudGFpbiUyMGxhbmRzY2FwZXxlbnwwfDB8fHwxNzU2NzQ4MjgzfDA&ixlib=rb-4.1.0&q=80&w=1080',
        'https://images.unsplash.com/photo-1596689126162-3042a030a37e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NzI1Njd8MHwxfHNlYXJjaHw0fHxzY2VuaWMlMjBtb3VudGFpbiUyMGxhbmRzY2FwZXxlbnwwfDB8fHwxNzU2NzQ4MjgzfDA&ixlib=rb-4.1.0&q=80&w=1080',
        'https://images.unsplash.com/photo-1595453548566-f18b9bd31254?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NzI1Njd8MHwxfHNlYXJjaHw1fHxzY2VuaWMlMjBtb3VudGFpbiUyMGxhbmRzY2FwZXxlbnwwfDB8fHwxNzU2NzQ4MjgzfDA&ixlib=rb-4.1.0&q=80&w=1080'
      ]
      
      const sightsWithImages: FamousSight[] = [
        {
          id: 'sight_1',
          name: 'Golden Gate Bridge',
          description: 'Iconic Art Deco suspension bridge connecting San Francisco to Marin County',
          location: 'San Francisco, CA',
          category: 'Landmark',
          rating: 4.8,
          visitDuration: '1-2 hours',
          imageUrl: scenicImages[0],
          coordinates: [37.8199, -122.4783],
          bestTimeToVisit: 'Early morning for fewer crowds',
          facts: [
            'Completed in 1937 after 4 years of construction',
            'Total length of 8,980 feet (2,737 m)',
            'International Orange color chosen for visibility in fog',
            'About 120,000 vehicles cross daily'
          ]
        },
        {
          id: 'sight_2',
          name: 'Monterey Bay Aquarium',
          description: 'World-renowned public aquarium showcasing marine life from Monterey Bay',
          location: 'Monterey, CA',
          category: 'Museum',
          rating: 4.7,
          visitDuration: '2-3 hours',
          imageUrl: scenicImages[1],
          coordinates: [36.6177, -121.9018],
          bestTimeToVisit: 'Weekday mornings',
          facts: [
            'Built on site of former sardine cannery',
            'Home to over 80,000 plants and animals',
            'First aquarium to exhibit great white sharks',
            'Pioneer in ocean conservation efforts'
          ]
        },
        {
          id: 'sight_3',
          name: 'Hearst Castle',
          description: 'Opulent mansion and estate of newspaper magnate William Randolph Hearst',
          location: 'San Simeon, CA',
          category: 'Historic Site',
          rating: 4.6,
          visitDuration: '2-4 hours',
          imageUrl: scenicImages[2],
          coordinates: [35.6850, -121.1681],
          bestTimeToVisit: 'Spring and fall',
          facts: [
            'Construction began in 1919, never truly completed',
            'Features 165 rooms and 127 acres of gardens',
            'Hosted Hollywood stars and world leaders',
            'Donated to California in 1957'
          ]
        },
        {
          id: 'sight_4',
          name: 'Big Sur Coastline',
          description: 'Dramatic rugged coastline with redwood forests and pristine beaches',
          location: 'Big Sur, CA',
          category: 'Natural Wonder',
          rating: 4.9,
          visitDuration: '3+ hours',
          imageUrl: scenicImages[3],
          coordinates: [36.2704, -121.8081],
          bestTimeToVisit: 'Late spring to early fall',
          facts: [
            'Stretches 90 miles along Highway 1',
            'Home to California condors and sea otters',
            'McWay Falls drops 80 feet onto pristine beach',
            'Inspiration for countless artists and writers'
          ]
        },
        {
          id: 'sight_5',
          name: 'Getty Center',
          description: 'Architectural marvel housing impressive art collections and gardens',
          location: 'Los Angeles, CA',
          category: 'Museum',
          rating: 4.5,
          visitDuration: '2-3 hours',
          imageUrl: scenicImages[4],
          coordinates: [34.0781, -118.4743],
          bestTimeToVisit: 'Tuesday-Sunday (closed Mondays)',
          facts: [
            'Designed by architect Richard Meier',
            'Cost $1.3 billion to construct',
            'Free admission, but parking fees apply',
            'Houses works by Van Gogh, Monet, and Renoir'
          ]
        }
      ]

      setSights(sightsWithImages)
    } catch (error) {
      console.error('Failed to fetch sights:', error)
      // Fallback without images
      const mockSights: FamousSight[] = [
        {
          id: 'sight_1',
          name: 'Golden Gate Bridge',
          description: 'Iconic Art Deco suspension bridge connecting San Francisco to Marin County',
          location: 'San Francisco, CA',
          category: 'Landmark',
          rating: 4.8,
          visitDuration: '1-2 hours',
          coordinates: [37.8199, -122.4783],
          bestTimeToVisit: 'Early morning for fewer crowds',
          facts: [
            'Completed in 1937 after 4 years of construction',
            'Total length of 8,980 feet (2,737 m)',
            'International Orange color chosen for visibility in fog',
            'About 120,000 vehicles cross daily'
          ]
        }
      ]
      setSights(mockSights)
    }
    
    setIsLoading(false)
  }, [routeStops])

  useEffect(() => {
    generateFamousSights()
  }, [generateFamousSights])

  const categories = ['all', 'Landmark', 'Museum', 'Historic Site', 'Natural Wonder']

  const filteredSights = sights.filter(sight => 
    selectedCategory === 'all' || sight.category === selectedCategory
  )

  const handleSightClick = (sight: FamousSight) => {
    setSelectedSight(sight)
    
    // Create a route stop for this sight
    const routeStop: RouteStop = {
      id: `poi_${sight.id}`,
      tourId: 'current_tour',
      type: 'poi',
      name: sight.name,
      description: sight.description,
      latitude: sight.coordinates[0],
      longitude: sight.coordinates[1],
      stopOrder: routeStops.length + 1,
      amenities: JSON.stringify(['Photography', 'Sightseeing', 'Walking']),
      createdAt: new Date().toISOString()
    }
    
    onSelectSight(routeStop)
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
            <Camera className="h-5 w-5 mr-2 text-primary" />
            Famous Sights & Attractions
          </div>
        </CardTitle>
        
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="capitalize"
            >
              {category}
            </Button>
          ))}
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-500">Loading famous sights...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredSights.map((sight) => (
              <div
                key={sight.id}
                className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleSightClick(sight)}
              >
                {sight.imageUrl && (
                  <div className="relative h-48 bg-gray-200">
                    <img
                      src={sight.imageUrl}
                      alt={sight.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="px-2 py-1 bg-black/70 text-white text-xs rounded-full">
                        {sight.category}
                      </span>
                    </div>
                  </div>
                )}
                
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 text-lg">{sight.name}</h3>
                    <div className="flex items-center space-x-1">
                      {renderStars(sight.rating)}
                      <span className="text-sm text-gray-600 ml-1">{sight.rating}</span>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-3 truncate">
                    {sight.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {sight.location}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {sight.visitDuration}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-xs text-gray-600">
                      <strong>Best time:</strong> {sight.bestTimeToVisit}
                    </p>
                    
                    <div className="bg-blue-50 p-2 rounded text-xs">
                      <strong className="text-blue-800">Did you know?</strong>
                      <p className="text-blue-700 mt-1">{sight.facts[0]}</p>
                    </div>
                  </div>
                  
                  <Button
                    size="sm"
                    className="w-full mt-3"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSightClick(sight)
                    }}
                  >
                    <MapPin className="h-4 w-4 mr-1" />
                    Add to Route
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredSights.length === 0 && !isLoading && (
          <div className="text-center py-8 text-gray-500">
            <Camera className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p>No sights found for the selected category.</p>
          </div>
        )}
        
        {/* Detailed View Modal */}
        {selectedSight && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader className="relative">
                {selectedSight.imageUrl && (
                  <div className="w-full h-64 bg-gray-200 rounded-lg overflow-hidden mb-4">
                    <img
                      src={selectedSight.imageUrl}
                      alt={selectedSight.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardTitle className="flex items-center justify-between">
                  {selectedSight.name}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedSight(null)}
                  >
                    ✕
                  </Button>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      {renderStars(selectedSight.rating)}
                      <span className="ml-1 text-sm">{selectedSight.rating}</span>
                    </div>
                    <span className="px-2 py-1 bg-primary/10 text-primary text-sm rounded">
                      {selectedSight.category}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <Clock className="h-4 w-4 inline mr-1" />
                    {selectedSight.visitDuration}
                  </div>
                </div>

                <p className="text-gray-700">{selectedSight.description}</p>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Fascinating Facts</h4>
                  <ul className="space-y-1">
                    {selectedSight.facts.map((fact, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start">
                        <span className="text-primary mr-2">•</span>
                        {fact}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-yellow-50 p-3 rounded-lg">
                  <h4 className="font-semibold text-yellow-800 mb-1">Travel Tip</h4>
                  <p className="text-yellow-700 text-sm">
                    Best time to visit: {selectedSight.bestTimeToVisit}
                  </p>
                </div>

                <Button
                  className="w-full"
                  onClick={() => {
                    handleSightClick(selectedSight)
                    setSelectedSight(null)
                  }}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Add to Route
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  )
}