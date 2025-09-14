import React from 'react'
import { blink } from '@/blink/client'
import type { Tour, RouteStop } from '@/types'

interface TourPreferences {
  name: string
  vehicleType: 'gas' | 'electric' | 'hybrid' | 'rv' | 'motorcycle'
  accommodationType: 'hotels' | 'camping_rv' | 'airbnb' | 'hostels' | 'mix'
  travelStyles: string[]
  budget: number
  budgetLabel: string
  interests: string[]
}

interface MapGeneratorResult {
  tour: Tour
  routeStops: RouteStop[]
}

class MapGenerator {
  static async createPersonalizedMap(preferences: TourPreferences, user: any): Promise<MapGeneratorResult> {
    const tourId = `tour_${Date.now()}`
    
    // Generate intelligent start/end locations based on preferences
    const locations = this.getOptimalLocations(preferences)
    
    // Create AI-powered tour description
    const tourDescription = await this.generateTourDescription(preferences)
    
    // Create tour record
    const tour: Tour = {
      id: tourId,
      userId: user?.id || 'anonymous',
      title: this.generateTourTitle(preferences),
      description: tourDescription,
      startLocation: locations.start,
      endLocation: locations.end,
      durationDays: this.calculateDuration(preferences),
      preferences: JSON.stringify(preferences),
      routeData: JSON.stringify({}),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Generate intelligent route stops
    const routeStops = await this.generateIntelligentRouteStops(tourId, preferences, locations)

    // Save to database
    await (blink.db as any).tours.create(tour)
    await (blink.db as any).routeStops.createMany(routeStops)

    return { tour, routeStops }
  }

  private static getOptimalLocations(preferences: TourPreferences): { start: string; end: string } {
    // Smart location selection based on interests and vehicle type
    const locationSets = {
      nature: {
        start: 'Seattle, WA',
        end: 'San Diego, CA'
      },
      culture: {
        start: 'San Francisco, CA',
        end: 'Los Angeles, CA'
      },
      adventure: {
        start: 'Denver, CO',
        end: 'Las Vegas, NV'
      },
      food: {
        start: 'Portland, OR',
        end: 'San Francisco, CA'
      },
      default: {
        start: 'San Francisco, CA',
        end: 'Los Angeles, CA'
      }
    }

    // Select based on primary interest
    const primaryInterest = preferences.interests[0] || 'default'
    const locationKey = Object.keys(locationSets).find(key => 
      preferences.interests.includes(key)
    ) || 'default'
    
    return locationSets[locationKey as keyof typeof locationSets] || locationSets.default
  }

  private static generateTourTitle(preferences: TourPreferences): string {
    const vehicleAdjectives = {
      electric: 'Eco-Friendly',
      gas: 'Classic',
      hybrid: 'Efficient',
      rv: 'Luxury',
      motorcycle: 'Thrilling'
    }

    const styleAdjectives = {
      adventure: 'Adventure',
      luxury: 'Luxury',
      camping: 'Wilderness',
      cultural: 'Cultural',
      food: 'Culinary',
      budget: 'Budget'
    }

    const vehicleAdj = vehicleAdjectives[preferences.vehicleType] || 'Personalized'
    const styleAdj = preferences.travelStyles[0] ? 
      styleAdjectives[preferences.travelStyles[0] as keyof typeof styleAdjectives] || 'Custom' :
      'Custom'

    return `${preferences.name}'s ${vehicleAdj} ${styleAdj} Journey`
  }

  private static calculateDuration(preferences: TourPreferences): number {
    // Duration based on budget and travel style
    if (preferences.budget < 100) return 3 // Budget trips are shorter
    if (preferences.budget > 500) return 7 // Luxury trips are longer
    if (preferences.travelStyles.includes('adventure')) return 5
    if (preferences.travelStyles.includes('camping')) return 6
    return 4 // Default
  }

  private static async generateTourDescription(preferences: TourPreferences): Promise<string> {
    try {
      const { text } = await blink.ai.generateText({
        prompt: `Create an engaging travel itinerary description for ${preferences.name}'s personalized trip:
        
        Profile:
        - Vehicle: ${preferences.vehicleType}
        - Budget: $${preferences.budget}/day (${preferences.budgetLabel})
        - Accommodation: ${preferences.accommodationType}
        - Travel Styles: ${preferences.travelStyles.join(', ')}
        - Interests: ${preferences.interests.join(', ')}
        
        Write a compelling 2-3 paragraph description that:
        1. Captures the excitement of the journey
        2. Highlights vehicle-specific advantages
        3. Mentions accommodation style
        4. References their interests and budget level
        
        Make it personal and inspiring!`,
        maxTokens: 400
      })
      return text
    } catch (error) {
      console.error('Failed to generate tour description:', error)
      return this.getFallbackDescription(preferences)
    }
  }

  private static getFallbackDescription(preferences: TourPreferences): string {
    return `Embark on ${preferences.name}'s personalized ${preferences.budgetLabel.toLowerCase()} adventure with your ${preferences.vehicleType} vehicle. This carefully crafted journey combines ${preferences.interests.join(', ')} experiences with ${preferences.accommodationType.replace('_', '/')} accommodations that match your ${preferences.travelStyles.join(' and ')} travel style. Every stop is optimized for your vehicle type and budget, ensuring an unforgettable road trip experience.`
  }

  private static async generateIntelligentRouteStops(
    tourId: string, 
    preferences: TourPreferences, 
    locations: { start: string; end: string }
  ): Promise<RouteStop[]> {
    try {
      const { object: routeData } = await blink.ai.generateObject({
        prompt: `Generate a detailed route from ${locations.start} to ${locations.end} for:
        
        Vehicle: ${preferences.vehicleType}
        Budget: $${preferences.budget}/day (${preferences.budgetLabel})
        Accommodation: ${preferences.accommodationType}
        Interests: ${preferences.interests.join(', ')}
        Travel Style: ${preferences.travelStyles.join(', ')}
        
        Create 5-7 stops with:
        - Vehicle-appropriate service stops (charging for EV, gas stations for gas vehicles, RV parks for RVs)
        - Points of interest matching their interests
        - Accommodations matching their preference and budget
        - Real GPS coordinates for the route
        - Appropriate amenities for each stop type`,
        schema: {
          type: 'object',
          properties: {
            stops: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string', enum: ['poi', 'charging', 'accommodation', 'service'] },
                  name: { type: 'string' },
                  description: { type: 'string' },
                  latitude: { type: 'number' },
                  longitude: { type: 'number' },
                  stopOrder: { type: 'number' },
                  amenities: { type: 'array', items: { type: 'string' } }
                },
                required: ['type', 'name', 'description', 'latitude', 'longitude', 'stopOrder', 'amenities']
              }
            }
          },
          required: ['stops']
        }
      })

      return routeData.stops.map((stop: any, index: number) => ({
        id: `stop_${Date.now()}_${index}`,
        tourId: tourId,
        type: stop.type,
        name: stop.name,
        description: stop.description,
        latitude: stop.latitude,
        longitude: stop.longitude,
        stopOrder: stop.stopOrder,
        amenities: JSON.stringify(stop.amenities),
        createdAt: new Date().toISOString()
      }))
    } catch (error) {
      console.error('Failed to generate intelligent route stops:', error)
      return this.getFallbackRouteStops(tourId, preferences)
    }
  }

  private static getFallbackRouteStops(tourId: string, preferences: TourPreferences): RouteStop[] {
    const baseStops: Partial<RouteStop>[] = []
    
    // Starting POI
    baseStops.push({
      type: 'poi',
      name: 'Golden Gate Bridge',
      description: 'Iconic starting point with breathtaking views',
      latitude: 37.8199,
      longitude: -122.4783,
      stopOrder: 1,
      amenities: JSON.stringify(['Photography', 'Walking', 'Scenic Views'])
    })

    // Vehicle-specific stops
    if (preferences.vehicleType === 'electric') {
      baseStops.push({
        type: 'charging',
        name: 'Tesla Supercharger - Gilroy',
        description: 'Fast EV charging with shopping options',
        latitude: 37.0058,
        longitude: -121.5683,
        stopOrder: 2,
        amenities: JSON.stringify(['Fast Charging', 'Shopping', 'Restaurants', 'WiFi'])
      })
    } else if (preferences.vehicleType === 'rv') {
      baseStops.push({
        type: 'service',
        name: 'RV Service Center - Salinas',
        description: 'Full RV services and supplies',
        latitude: 36.6777,
        longitude: -121.6555,
        stopOrder: 2,
        amenities: JSON.stringify(['RV Services', 'Supplies', 'Dump Station', 'Fuel'])
      })
    } else if (preferences.vehicleType === 'motorcycle') {
      baseStops.push({
        type: 'service',
        name: 'Motorcycle Rest Area - Monterey',
        description: 'Scenic rest stop with motorcycle parking',
        latitude: 36.6002,
        longitude: -121.8947,
        stopOrder: 2,
        amenities: JSON.stringify(['Motorcycle Parking', 'Scenic Views', 'Restrooms', 'Food'])
      })
    } else {
      baseStops.push({
        type: 'service',
        name: 'Highway Rest Area - Gilroy',
        description: 'Convenient fuel and refreshment stop',
        latitude: 37.0058,
        longitude: -121.5683,
        stopOrder: 2,
        amenities: JSON.stringify(['Gas Station', 'Convenience Store', 'Restrooms'])
      })
    }

    // Interest-based POI
    if (preferences.interests.includes('nature')) {
      baseStops.push({
        type: 'poi',
        name: 'Big Sur National Forest',
        description: 'Stunning coastal redwood forests and hiking trails',
        latitude: 36.2704,
        longitude: -121.8081,
        stopOrder: 3,
        amenities: JSON.stringify(['Hiking', 'Wildlife Viewing', 'Photography', 'Nature Trails'])
      })
    } else if (preferences.interests.includes('art')) {
      baseStops.push({
        type: 'poi',
        name: 'Hearst Castle',
        description: 'Historic art collection and architecture',
        latitude: 35.6850,
        longitude: -121.1681,
        stopOrder: 3,
        amenities: JSON.stringify(['Art Gallery', 'Historic Tours', 'Architecture', 'Gardens'])
      })
    } else if (preferences.interests.includes('food')) {
      baseStops.push({
        type: 'poi',
        name: 'Paso Robles Wine Country',
        description: 'World-class wineries and farm-to-table dining',
        latitude: 35.6269,
        longitude: -120.6906,
        stopOrder: 3,
        amenities: JSON.stringify(['Wine Tasting', 'Fine Dining', 'Local Produce', 'Vineyard Tours'])
      })
    } else {
      baseStops.push({
        type: 'poi',
        name: 'Monterey Bay Aquarium',
        description: 'World-renowned marine life exhibits',
        latitude: 36.6182,
        longitude: -121.9016,
        stopOrder: 3,
        amenities: JSON.stringify(['Aquarium', 'Education', 'Family Friendly', 'Gift Shop'])
      })
    }

    // Accommodation based on preference and budget
    let accommodationStop: Partial<RouteStop>
    
    if (preferences.accommodationType === 'camping_rv') {
      accommodationStop = {
        type: 'accommodation',
        name: 'Hearst San Simeon State Park',
        description: preferences.budget < 100 ? 'Budget-friendly campground' : 'Premium camping with ocean views',
        latitude: 35.6440,
        longitude: -121.1905,
        stopOrder: 4,
        amenities: JSON.stringify(['Camping', 'RV Sites', 'Showers', 'Beach Access', 'Fire Pits'])
      }
    } else if (preferences.accommodationType === 'hostels') {
      accommodationStop = {
        type: 'accommodation',
        name: 'HI Monterey Hostel',
        description: 'Social accommodation with shared amenities',
        latitude: 36.6002,
        longitude: -121.8947,
        stopOrder: 4,
        amenities: JSON.stringify(['Shared Kitchen', 'Common Areas', 'WiFi', 'Laundry', 'Bicycle Storage'])
      }
    } else if (preferences.budget > 400) {
      accommodationStop = {
        type: 'accommodation',
        name: 'Luxury Resort & Spa - Santa Barbara',
        description: 'Premium accommodation with full amenities',
        latitude: 34.4208,
        longitude: -119.6982,
        stopOrder: 4,
        amenities: JSON.stringify(['Spa', 'Fine Dining', 'Pool', 'Ocean View', 'Concierge', 'EV Charging'])
      }
    } else {
      accommodationStop = {
        type: 'accommodation',
        name: 'Comfort Inn - San Luis Obispo',
        description: 'Comfortable mid-range accommodation',
        latitude: 35.2828,
        longitude: -120.6596,
        stopOrder: 4,
        amenities: JSON.stringify(['WiFi', 'Breakfast', 'Pool', 'Parking', 'Fitness Center'])
      }
    }
    
    baseStops.push(accommodationStop)

    // Final destination POI
    baseStops.push({
      type: 'poi',
      name: 'Santa Monica Pier',
      description: 'Iconic pier with entertainment and dining',
      latitude: 34.0089,
      longitude: -118.4973,
      stopOrder: 5,
      amenities: JSON.stringify(['Amusement Park', 'Dining', 'Shopping', 'Beach Access', 'Entertainment'])
    })

    // Convert to full RouteStop objects
    return baseStops.map((stop, index) => ({
      id: `stop_${Date.now()}_${index}`,
      tourId: tourId,
      type: stop.type as 'poi' | 'charging' | 'accommodation' | 'service',
      name: stop.name!,
      description: stop.description,
      latitude: stop.latitude!,
      longitude: stop.longitude!,
      stopOrder: stop.stopOrder!,
      amenities: stop.amenities,
      createdAt: new Date().toISOString()
    }))
  }
}

export { MapGenerator }