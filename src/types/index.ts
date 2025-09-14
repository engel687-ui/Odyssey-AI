export interface Tour {
  id: string
  userId: string
  title: string
  description?: string
  startLocation: string
  endLocation: string
  durationDays: number
  preferences?: string
  routeData?: string
  createdAt: string
  updatedAt: string
}

export interface RouteStop {
  id: string
  tourId: string
  type: 'poi' | 'charging' | 'accommodation' | 'service'
  name: string
  description?: string
  latitude: number
  longitude: number
  stopOrder: number
  amenities?: string
  createdAt: string
}

export interface UserPreferences {
  id: string
  userId: string
  vehicleType: string
  accommodationPreference: 'hotel' | 'camping' | 'both'
  interests?: string
  budgetRange: string
  createdAt: string
  updatedAt: string
}

export interface TourPreferences {
  startLocation: string
  endLocation: string
  durationDays: number
  interests: string[]
  accommodationType: 'hotel' | 'camping' | 'both'
  vehicleRange: number
  budgetRange: 'low' | 'medium' | 'high'
}

export interface MapMarker {
  id: string
  type: 'poi' | 'charging' | 'accommodation'
  position: [number, number]
  title: string
  description: string
  amenities?: string[]
}

export interface UserCredits {
  id: string
  userId: string
  creditsRemaining: number
  totalCredits: number
  lastUpdated: string
}

export interface CreditCosts {
  tourGeneration: number
  audioGeneration: number
  routeCalculation: number
  aiDescriptions: number
}