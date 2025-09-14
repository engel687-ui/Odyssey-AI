import { blink } from '../blink/client';
import { ParsedPreferences } from '../utils/promptParser';

export interface TourPreferences {
  destination: string;
  duration: number;
  interests: string[];
  accommodationType: 'hotel' | 'camping';
  vehicleRange: number;
  budget: 'low' | 'medium' | 'high';
}

export interface RouteStop {
  id: string;
  tourId: string;
  type: 'poi' | 'charging' | 'accommodation' | 'meal';
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  stopOrder: number;
  amenities?: string[];
}

export interface GeneratedTour {
  id: string;
  title: string;
  description: string;
  startLocation: string;
  endLocation: string;
  durationDays: number;
  stops: RouteStop[];
  routeData: {
    coordinates: [number, number][];
    totalDistance: number;
    estimatedDriving: number;
  };
}

export interface WizardProgress {
  stage: 'analyzing' | 'routing' | 'stops' | 'finalizing';
  message: string;
  progress: number;
}

export class RouteService {
  private updateProgress?: (progress: WizardProgress) => void;

  setProgressCallback(callback: (progress: WizardProgress) => void) {
    this.updateProgress = callback;
  }

  private async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async generateTour(preferences: TourPreferences, userId: string, parsedData?: ParsedPreferences): Promise<GeneratedTour> {
    try {
      // Stage 1: Analyzing preferences
      this.updateProgress?.({
        stage: 'analyzing',
        message: `Crafting a ${preferences.duration}-day adventure to ${preferences.destination}...`,
        progress: 10
      });
      await this.delay(1500);

      // Generate AI-powered itinerary with parsed insights
      const prompt = this.buildPrompt(preferences, parsedData);
      const { text } = await blink.ai.generateText({
        prompt,
        maxTokens: 2000,
        search: parsedData?.confidence?.destination < 0.6 // Use web search for uncertain destinations
      });

      this.updateProgress?.({
        stage: 'analyzing',
        message: 'AI has found the perfect spots for your journey!',
        progress: 25
      });
      await this.delay(1000);

      // Stage 2: Route planning
      this.updateProgress?.({
        stage: 'routing',
        message: 'Calculating scenic routes with EV charging optimization...',
        progress: 40
      });
      await this.delay(2000);

      // Parse AI response and create tour structure
      const parsedTour = this.parseAIResponse(text, preferences);
      
      this.updateProgress?.({
        stage: 'routing',
        message: 'Route calculated! Planning your charging strategy...',
        progress: 55
      });
      await this.delay(1500);

      // Stage 3: Finding stops and amenities
      this.updateProgress?.({
        stage: 'stops',
        message: 'Discovering hidden gems and perfect pit stops...',
        progress: 70
      });
      await this.delay(2000);

      // Add charging stations and accommodation stops
      const enhancedTour = await this.enhanceWithStops(parsedTour, preferences);

      this.updateProgress?.({
        stage: 'stops',
        message: 'Found amazing places to stay and charge up!',
        progress: 85
      });
      await this.delay(1000);

      // Stage 4: Finalizing
      this.updateProgress?.({
        stage: 'finalizing',
        message: 'Adding the final magical touches to your adventure...',
        progress: 95
      });
      await this.delay(1500);

      // Save to database
      const savedTour = await this.saveTour(enhancedTour, userId);

      this.updateProgress?.({
        stage: 'finalizing',
        message: 'Your personalized tour is ready! 🎉',
        progress: 100
      });
      await this.delay(800);

      return savedTour;

    } catch (error) {
      console.error('Error generating tour:', error);
      throw new Error('Failed to generate your tour. Please try again!');
    }
  }

  private buildPrompt(preferences: TourPreferences, parsedData?: ParsedPreferences): string {
    // Enhanced prompt with parsed AI data
    const basePrompt = `Create a detailed ${preferences.duration}-day electric vehicle road trip itinerary to ${preferences.destination}.

REQUIREMENTS:
- Vehicle range: ${preferences.vehicleRange} miles per charge
- Accommodation preference: ${preferences.accommodationType}
- Primary interests: ${preferences.interests.join(', ')}
- Budget level: ${preferences.budget}`;

    // Add AI-parsed insights if available
    let enhancedPrompt = basePrompt;
    if (parsedData) {
      enhancedPrompt += `

AI INSIGHTS FROM USER INPUT:
- Parsed destination confidence: ${(parsedData.confidence?.destination * 100).toFixed(0)}%
- Travel pace preference: ${parsedData.pace || 'moderate'}
- Accommodation type confidence: ${(parsedData.confidence?.accommodationType * 100).toFixed(0)}%
- Interest categories matched: ${parsedData.interests?.length || 0}

PERSONALIZATION NOTES:
${parsedData.pace === 'relaxed' ? '- Focus on leisurely stops with longer stays at each location' : ''}
${parsedData.pace === 'fast' ? '- Include efficient route planning with quick but memorable stops' : ''}
${parsedData.accommodationType === 'camping' ? '- Prioritize scenic campgrounds and outdoor activities' : ''}
${parsedData.accommodationType === 'hotel' ? '- Include comfortable hotels with premium amenities' : ''}
${parsedData.confidence?.interests > 0.7 ? '- Heavily weight activities matching the identified interests' : ''}`;
    }

    enhancedPrompt += `

Please provide a JSON response with this structure:
{
  "title": "Catchy tour name reflecting the specific interests and destination",
  "description": "Brief inspiring description highlighting the personalized experience",
  "startLocation": "Starting city/location",
  "endLocation": "Final destination", 
  "highlights": [
    {
      "name": "Point of interest name",
      "description": "Why it's special and relevant to user interests",
      "latitude": 0.0,
      "longitude": 0.0,
      "type": "poi"
    }
  ],
  "estimatedDistance": 0,
  "estimatedDriving": 0
}

Focus on scenic routes, interesting stops matching the user's specific interests, and EV-friendly locations. Include realistic coordinates for major highlights.`;

    return enhancedPrompt;
  }

  private parseAIResponse(aiResponse: string, preferences: TourPreferences): GeneratedTour {
    try {
      // Extract JSON from AI response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not parse AI response');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Generate route coordinates (simplified for demo)
      const coordinates: [number, number][] = this.generateRouteCoordinates(
        parsed.highlights || []
      );

      return {
        id: `tour_${Date.now()}`,
        title: parsed.title || `${preferences.duration}-Day Adventure`,
        description: parsed.description || 'An amazing EV road trip experience',
        startLocation: parsed.startLocation || preferences.destination,
        endLocation: parsed.endLocation || preferences.destination,
        durationDays: preferences.duration,
        stops: (parsed.highlights || []).map((highlight: any, index: number) => ({
          id: `stop_${index}`,
          tourId: '',
          type: highlight.type || 'poi',
          name: highlight.name,
          description: highlight.description,
          latitude: highlight.latitude,
          longitude: highlight.longitude,
          stopOrder: index,
          amenities: []
        })),
        routeData: {
          coordinates,
          totalDistance: parsed.estimatedDistance || 300,
          estimatedDriving: parsed.estimatedDriving || 6
        }
      };
    } catch (error) {
      console.error('Error parsing AI response:', error);
      
      // Fallback demo tour
      return this.createFallbackTour(preferences);
    }
  }

  private createFallbackTour(preferences: TourPreferences): GeneratedTour {
    return {
      id: `tour_${Date.now()}`,
      title: `${preferences.duration}-Day EV Adventure`,
      description: 'A carefully crafted electric vehicle journey with scenic stops and charging stations',
      startLocation: 'Starting Location',
      endLocation: preferences.destination,
      durationDays: preferences.duration,
      stops: [
        {
          id: 'stop_1',
          tourId: '',
          type: 'poi',
          name: 'Scenic Viewpoint',
          description: 'Beautiful panoramic views perfect for photos',
          latitude: 37.7749,
          longitude: -122.4194,
          stopOrder: 0,
          amenities: ['Parking', 'Restrooms']
        },
        {
          id: 'stop_2', 
          tourId: '',
          type: 'charging',
          name: 'EV Charging Station',
          description: 'Fast charging with amenities nearby',
          latitude: 37.7849,
          longitude: -122.4094,
          stopOrder: 1,
          amenities: ['Fast Charging', 'Food', 'WiFi']
        }
      ],
      routeData: {
        coordinates: [
          [-122.4194, 37.7749],
          [-122.4094, 37.7849]
        ],
        totalDistance: 250,
        estimatedDriving: 5
      }
    };
  }

  private generateRouteCoordinates(highlights: any[]): [number, number][] {
    if (!highlights.length) return [[-122.4194, 37.7749], [-122.4094, 37.7849]];
    
    return highlights.map(h => [h.longitude, h.latitude]);
  }

  private async enhanceWithStops(tour: GeneratedTour, preferences: TourPreferences): Promise<GeneratedTour> {
    // Add charging stations based on vehicle range
    const chargingStops = this.calculateChargingStops(tour, preferences.vehicleRange);
    
    // Add accommodation stops for multi-day trips
    const accommodationStops = preferences.duration > 1 
      ? this.generateAccommodationStops(tour, preferences.accommodationType)
      : [];

    // Combine all stops and reorder
    const allStops = [...tour.stops, ...chargingStops, ...accommodationStops]
      .sort((a, b) => a.stopOrder - b.stopOrder);

    return {
      ...tour,
      stops: allStops
    };
  }

  private calculateChargingStops(tour: GeneratedTour, vehicleRange: number): RouteStop[] {
    // Simplified logic - add charging stops every ~80% of range
    const chargingInterval = vehicleRange * 0.8;
    const totalDistance = tour.routeData.totalDistance;
    const numChargingStops = Math.floor(totalDistance / chargingInterval);

    const chargingStops: RouteStop[] = [];
    
    for (let i = 0; i < numChargingStops; i++) {
      // Position charging stops along the route
      const progress = (i + 1) / (numChargingStops + 1);
      const coords = tour.routeData.coordinates[
        Math.floor(progress * tour.routeData.coordinates.length)
      ];

      chargingStops.push({
        id: `charging_${i}`,
        tourId: tour.id,
        type: 'charging',
        name: `EV Charging Stop ${i + 1}`,
        description: 'Fast charging station with amenities',
        latitude: coords[1],
        longitude: coords[0],
        stopOrder: tour.stops.length + i,
        amenities: ['Fast Charging', 'Restrooms', 'Food']
      });
    }

    return chargingStops;
  }

  private generateAccommodationStops(tour: GeneratedTour, type: 'hotel' | 'camping'): RouteStop[] {
    // For demo, add one accommodation stop per day (except last day)
    const nights = tour.durationDays - 1;
    const accommodationStops: RouteStop[] = [];

    for (let i = 0; i < nights; i++) {
      const progress = (i + 1) / tour.durationDays;
      const coords = tour.routeData.coordinates[
        Math.floor(progress * tour.routeData.coordinates.length)
      ];

      accommodationStops.push({
        id: `accommodation_${i}`,
        tourId: tour.id,
        type: 'accommodation',
        name: type === 'hotel' ? `Eco-Friendly Hotel` : `EV-Ready Campground`,
        description: `Comfortable overnight stay with EV charging facilities`,
        latitude: coords[1],
        longitude: coords[0],
        stopOrder: tour.stops.length + i,
        amenities: type === 'hotel' 
          ? ['EV Charging', 'WiFi', 'Restaurant', 'Spa']
          : ['EV Charging', 'Restrooms', 'Showers', 'Fire Pit']
      });
    }

    return accommodationStops;
  }

  private async saveTour(tour: GeneratedTour, userId: string): Promise<GeneratedTour> {
    try {
      // Save main tour record
      await blink.db.tours.create({
        id: tour.id,
        userId,
        title: tour.title,
        description: tour.description,
        startLocation: tour.startLocation,
        endLocation: tour.endLocation,
        durationDays: tour.durationDays,
        preferences: JSON.stringify({}),
        routeData: JSON.stringify(tour.routeData)
      });

      // Save all stops
      for (const stop of tour.stops) {
        await blink.db.routeStops.create({
          id: stop.id,
          tourId: tour.id,
          type: stop.type,
          name: stop.name,
          description: stop.description || '',
          latitude: stop.latitude,
          longitude: stop.longitude,
          stopOrder: stop.stopOrder,
          amenities: JSON.stringify(stop.amenities || [])
        });
      }

      return tour;
    } catch (error) {
      console.error('Error saving tour:', error);
      throw error;
    }
  }
}