import React, { useState, useEffect } from 'react'
import { MapPin, Navigation, Zap, Star, Camera, Globe, ArrowRight, Play, Volume2, Car, Building, TreePine, Coffee } from 'lucide-react'
import { MapView } from '@/components/map/MapView'
import { TourPlanningForm } from '@/components/forms/TourPlanningForm'
import { blink } from '@/blink/client'
import { CreditDisplay } from '@/components/ui/CreditDisplay'
import type { Tour, RouteStop } from '@/types'

interface FrontLoaderProps {
  onStartTour: () => void
}

export function FrontLoader({ onStartTour }: FrontLoaderProps) {
  const [showPlanningForm, setShowPlanningForm] = useState(false)
  const [demoTour, setDemoTour] = useState<Tour | null>(null)
  const [demoStops, setDemoStops] = useState<RouteStop[]>([])
  const [user, setUser] = useState<any>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null)

  useEffect(() => {
    // Initialize auth state
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
    })

    // Create demo route
    createDemoRoute()

    return unsubscribe
  }, [])

  const createDemoRoute = () => {
    const demotour: Tour = {
      id: 'demo_tour',
      userId: 'demo',
      title: 'Pacific Coast Highway Adventure',
      description: 'Stunning coastal route with EV charging optimization',
      startLocation: 'San Francisco, CA',
      endLocation: 'Los Angeles, CA',
      durationDays: 3,
      preferences: JSON.stringify({
        vehicleType: 'electric',
        accommodationType: 'hotels',
        interests: ['nature', 'photography', 'food']
      }),
      routeData: JSON.stringify({}),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const demoRouteStops: RouteStop[] = [
      {
        id: 'demo_stop_1',
        tourId: 'demo_tour',
        type: 'poi',
        name: 'Golden Gate Bridge',
        description: 'Iconic suspension bridge with breathtaking views',
        latitude: 37.8199,
        longitude: -122.4783,
        stopOrder: 1,
        amenities: JSON.stringify(['Photography', 'Walking', 'Scenic Views']),
        createdAt: new Date().toISOString()
      },
      {
        id: 'demo_stop_2',
        tourId: 'demo_tour',
        type: 'charging',
        name: 'Tesla Supercharger - Gilroy',
        description: 'Fast charging with shopping and dining options',
        latitude: 37.0058,
        longitude: -121.5683,
        stopOrder: 2,
        amenities: JSON.stringify(['Fast Charging', 'Shopping', 'Restaurants']),
        createdAt: new Date().toISOString()
      },
      {
        id: 'demo_stop_3',
        tourId: 'demo_tour',
        type: 'poi',
        name: 'Big Sur Coastline',
        description: 'Dramatic coastline with hiking trails and ocean views',
        latitude: 36.2704,
        longitude: -121.8081,
        stopOrder: 3,
        amenities: JSON.stringify(['Hiking', 'Photography', 'Nature', 'Scenic Drives']),
        createdAt: new Date().toISOString()
      },
      {
        id: 'demo_stop_4',
        tourId: 'demo_tour',
        type: 'accommodation',
        name: 'Monterey Bay Resort',
        description: 'Luxury oceanfront resort with EV charging',
        latitude: 36.6002,
        longitude: -121.8947,
        stopOrder: 4,
        amenities: JSON.stringify(['EV Charging', 'Ocean View', 'Spa', 'Restaurant']),
        createdAt: new Date().toISOString()
      }
    ]

    setDemoTour(demotour)
    setDemoStops(demoRouteStops)
  }

  const handlePlanTour = () => {
    setShowPlanningForm(true)
  }

  const createMapWithPreferences = async (preferences: any) => {
    setShowPlanningForm(false)
    setIsGenerating(true)

    try {
      // Generate AI-powered tour based on comprehensive preferences
      const { text } = await blink.ai.generateText({
        prompt: `Create a personalized travel route and itinerary based on these preferences:
        
        Traveler Profile:
        - Name: ${preferences.name}
        - Vehicle Type: ${preferences.vehicleType}
        - Accommodation Preference: ${preferences.accommodationType}
        - Travel Styles: ${preferences.travelStyles.join(', ')}
        - Budget: ${preferences.budget}/day (${preferences.budgetLabel})
        - Interests: ${preferences.interests.join(', ')}
        
        Generate a compelling multi-day journey with:
        1. Suggested start and end locations based on interests
        2. Key points of interest matching their preferences
        3. Vehicle-specific recommendations (charging stations if EV, gas stations if gas, etc.)
        4. Accommodation suggestions matching their preference type
        5. Budget-appropriate activities and dining
        
        Make it personalized and exciting for this specific traveler profile.`,
        maxTokens: 1500
      })

      // Call parent component's onStartTour to show full tour interface
      onStartTour()
    } catch (error) {
      console.error('Failed to generate tour:', error)
      alert('Failed to generate tour. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const features = [
    {
      id: 'route-planning',
      title: 'Intelligent Route Planning',
      description: 'AI-optimized routes with real-time traffic, road work, and vehicle-specific needs',
      icon: Navigation,
      color: 'from-orange-500 to-red-500',
      highlights: [
        'Real-time traffic optimization',
        'EV charging station integration', 
        'Dynamic route adjustments'
      ]
    },
    {
      id: 'discovery',
      title: 'Personalized Discovery',
      description: 'AI travel agent that curates experiences based on your unique interests',
      icon: Globe,
      color: 'from-blue-500 to-cyan-500',
      highlights: [
        'Adventure, luxury, or camping profiles',
        'Tailored activity recommendations',
        'Hidden gem discoveries'
      ]
    },
    {
      id: 'voice-guide',
      title: 'AI Voice Guide',
      description: 'Natural language narration and intuitive navigation assistance',
      icon: Volume2,
      color: 'from-purple-500 to-pink-500',
      highlights: [
        'Contextual POI stories',
        'Complex interchange guidance',
        'Human-like interactions'
      ]
    },
    {
      id: 'content',
      title: 'Curated Content',
      description: 'Hand-picked influencer videos and local insights for each destination',
      icon: Camera,
      color: 'from-green-500 to-teal-500',
      highlights: [
        'YouTube integration',
        'Travel influencer content',
        'Local experiences'
      ]
    },
    {
      id: 'optimization',
      title: 'EV & Fuel Optimization',
      description: 'Smart charging stops and fuel cost management for any vehicle type',
      icon: Zap,
      color: 'from-yellow-500 to-orange-500',
      highlights: [
        'EV charging network access',
        'Fuel price comparisons',
        'Range optimization'
      ]
    },
    {
      id: 'logistics',
      title: 'Safety & Logistics',
      description: 'Emergency contacts, parking info, and essential travel services',
      icon: Star,
      color: 'from-indigo-500 to-purple-500',
      highlights: [
        'Roadside assistance',
        'Real-time parking',
        'Restroom planning'
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        
        {/* Header */}
        <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-border/20 backdrop-blur-sm">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">O</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Odyssey AI</h1>
              <p className="text-sm text-muted-foreground">Your AI Road Trip Companion</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="text-sm text-muted-foreground hover:text-foreground">Settings</button>
            <div className="px-3 py-1 bg-blue-100 text-blue-600 text-sm rounded-full">Beta</div>
            {user && <CreditDisplay />}
            {user ? (
              <button
                onClick={() => blink.auth.logout()}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Sign Out
              </button>
            ) : (
              <button
                onClick={() => blink.auth.login()}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                Sign In
              </button>
            )}
          </div>
        </header>

        {/* Main Content */}
        <div className="relative z-10 px-6 py-16">
          <div className="max-w-6xl mx-auto text-center">
            <div className="animate-slide-up">
              <h1 className="text-6xl font-bold mb-6">
                Turn Every Journey Into<br />
                <span className="bg-gradient-to-r from-orange-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
                  A Tailored Adventure
                </span>
              </h1>
              
              <p className="text-xl text-muted-foreground mb-12 max-w-4xl mx-auto leading-relaxed">
                Experience intelligent route planning, personalized discoveries, and AI-powered guidance that adapts to your travel style and interests.
              </p>
              
              <button
                onClick={handlePlanTour}
                className="bg-gradient-to-r from-orange-500 to-purple-500 text-white px-8 py-4 rounded-2xl text-lg font-semibold shadow-lg btn-glow group inline-flex items-center space-x-2"
              >
                <MapPin className="h-5 w-5" />
                <span>Start Planning Your Trip</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Map Demo */}
      <div className="relative bg-gray-50/50 border-t border-border/20">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">See It In Action</h2>
            <p className="text-xl text-muted-foreground">Interactive route planning with live vehicle tracking</p>
          </div>
          
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-border/20">
            <div className="h-96 relative">
              {demoTour && demoStops.length > 0 ? (
                <MapView 
                  routeStops={demoStops}
                  startLocation={demoTour.startLocation}
                  endLocation={demoTour.endLocation}
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading interactive demo...</p>
                  </div>
                </div>
              )}
              
              {/* Floating Demo Badge */}
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg">
                <div className="flex items-center space-x-2">
                  <Play className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Live Demo Route</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.id}
                  className="group relative bg-white border border-border/50 rounded-2xl p-8 hover:shadow-xl transition-all duration-500 hover:-translate-y-1"
                  onMouseEnter={() => setHoveredFeature(feature.id)}
                  onMouseLeave={() => setHoveredFeature(null)}
                >
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} mb-6`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-semibold mb-3 text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed">{feature.description}</p>
                  
                  <ul className="space-y-2">
                    {feature.highlights.map((highlight, i) => (
                      <li key={i} className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${feature.color}`}></div>
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-5 transition-all duration-500`}></div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Coming Soon Section */}
      <div className="py-16 bg-gradient-to-r from-orange-50 to-purple-50 border-t border-border/20">
        <div className="max-w-4xl mx-auto text-center px-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 shadow-xl border border-border/20">
            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-orange-500 to-purple-500 bg-clip-text text-transparent">
              Coming Soon: AR Tour Guide
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Augmented reality overlays will bring historical reconstructions and digital information directly to your smartphone camera view.
            </p>
          </div>
        </div>
      </div>

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
    </div>
  )
}