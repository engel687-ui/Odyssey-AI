export interface ParsedPreferences {
  destination: string;
  duration: number;
  interests: string[];
  accommodationType?: 'hotel' | 'camping';
  pace?: 'relaxed' | 'moderate' | 'fast';
  confidence: ParsingConfidence;
}

export interface ParsingConfidence {
  overall: number; // 0-1 confidence score
  destination: number;
  duration: number;
  interests: number;
  accommodationType: number;
  pace: number;
}

export interface ClarificationQuestion {
  field: keyof ParsedPreferences;
  question: string;
  suggestions?: string[];
  priority: 'high' | 'medium' | 'low';
}

export class AIPromptParser {
  private static destinations = [
    // US States & Regions
    'california', 'florida', 'texas', 'new york', 'washington', 'oregon', 'colorado', 'arizona',
    'nevada', 'utah', 'montana', 'wyoming', 'north carolina', 'south carolina', 'georgia',
    'virginia', 'maine', 'new hampshire', 'vermont', 'massachusetts', 'connecticut', 'rhode island',
    'new england', 'pacific northwest', 'southwest', 'midwest', 'great lakes', 'appalachian',
    
    // Major Cities
    'san francisco', 'los angeles', 'seattle', 'portland', 'denver', 'chicago', 'new york city',
    'boston', 'washington dc', 'miami', 'orlando', 'austin', 'dallas', 'houston', 'phoenix',
    'las vegas', 'salt lake city', 'minneapolis', 'detroit', 'atlanta', 'charlotte', 'nashville',
    
    // National Parks & Landmarks
    'yellowstone', 'yosemite', 'grand canyon', 'zion', 'arches', 'bryce canyon', 'glacier',
    'great smoky mountains', 'acadia', 'olympic', 'mount rainier', 'crater lake', 'sequoia',
    'joshua tree', 'death valley', 'big sur', 'napa valley', 'blue ridge parkway',
    
    // International
    'europe', 'france', 'germany', 'italy', 'spain', 'england', 'scotland', 'ireland', 'norway',
    'sweden', 'denmark', 'netherlands', 'switzerland', 'austria', 'canada', 'british columbia',
    'alberta', 'ontario', 'quebec', 'australia', 'new zealand', 'japan'
  ];

  private static interests = [
    'nature', 'hiking', 'national parks', 'beaches', 'mountains', 'forests', 'wildlife', 'camping',
    'history', 'museums', 'architecture', 'culture', 'art', 'galleries', 'monuments', 'historic sites',
    'food', 'restaurants', 'wineries', 'breweries', 'local cuisine', 'farmers markets',
    'adventure', 'outdoor activities', 'rock climbing', 'kayaking', 'fishing', 'skiing', 'cycling',
    'photography', 'scenic drives', 'viewpoints', 'landscapes', 'sunsets', 'waterfalls',
    'cities', 'urban exploration', 'nightlife', 'shopping', 'entertainment', 'theaters',
    'relaxation', 'spas', 'hot springs', 'meditation', 'wellness', 'yoga retreats',
    'family', 'kids', 'theme parks', 'zoos', 'aquariums', 'family-friendly',
    'budget', 'luxury', 'off the beaten path', 'hidden gems', 'local experiences'
  ];

  private static durationPatterns = [
    // Direct numbers
    { pattern: /(\d+)\s*days?/gi, multiplier: 1 },
    { pattern: /(\d+)\s*weeks?/gi, multiplier: 7 },
    { pattern: /(\d+)\s*months?/gi, multiplier: 30 },
    
    // Written numbers
    { pattern: /(one|a)\s+day/gi, value: 1 },
    { pattern: /(two)\s+days?/gi, value: 2 },
    { pattern: /(three)\s+days?/gi, value: 3 },
    { pattern: /(four)\s+days?/gi, value: 4 },
    { pattern: /(five)\s+days?/gi, value: 5 },
    { pattern: /(six)\s+days?/gi, value: 6 },
    { pattern: /(seven|a\s+week)\s+days?/gi, value: 7 },
    { pattern: /(one|a)\s+week/gi, value: 7 },
    { pattern: /(two)\s+weeks?/gi, value: 14 },
    
    // Range patterns
    { pattern: /(\d+)-(\d+)\s*days?/gi, range: true },
    { pattern: /(\d+)\s*to\s*(\d+)\s*days?/gi, range: true },
    
    // Common phrases
    { pattern: /weekend/gi, value: 2 },
    { pattern: /long\s+weekend/gi, value: 3 },
    { pattern: /short\s+trip/gi, value: 2 },
    { pattern: /quick\s+trip/gi, value: 1 },
    { pattern: /extended\s+trip/gi, value: 10 },
    { pattern: /road\s+trip/gi, value: 7 }
  ];

  static parsePrompt(prompt: string): ParsedPreferences {
    const lowerPrompt = prompt.toLowerCase();
    
    // Extract all preferences with confidence tracking
    const destination = this.extractDestination(lowerPrompt);
    const duration = this.extractDuration(lowerPrompt);
    const interests = this.extractInterests(lowerPrompt);
    const accommodationType = this.extractAccommodationType(lowerPrompt);
    const pace = this.extractPace(lowerPrompt);

    // Calculate confidence scores
    const confidence = this.calculateConfidence(prompt, {
      destination, duration, interests, accommodationType, pace
    });
    
    return {
      destination,
      duration,
      interests: this.mapInterestsToUITags(interests),
      accommodationType,
      pace,
      confidence
    };
  }

  private static extractDestination(prompt: string): string {
    // Try to find explicit destination mentions
    for (const dest of this.destinations) {
      if (prompt.includes(dest)) {
        return dest.split(' ').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
      }
    }

    // Try to extract from common patterns
    const patterns = [
      /(?:to|visit|explore|see|trip to|travel to|drive to|go to)\s+([a-zA-Z\s,]+?)(?:\s|,|\.|\?|!|$)/gi,
      /(?:around|through|across)\s+([a-zA-Z\s,]+?)(?:\s|,|\.|\?|!|$)/gi,
      /(?:in|from)\s+([a-zA-Z\s,]+?)(?:\s|,|\.|\?|!|$)/gi
    ];

    for (const pattern of patterns) {
      const match = pattern.exec(prompt);
      if (match && match[1]) {
        const extracted = match[1].trim();
        // Check if it's likely a location (not too generic)
        if (extracted.length > 2 && extracted.length < 50 && 
            !['the', 'and', 'or', 'with', 'for', 'my', 'a', 'an'].includes(extracted)) {
          return extracted.split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ');
        }
      }
    }

    return 'California'; // Default fallback
  }

  private static extractDuration(prompt: string): number {
    for (const { pattern, multiplier, value, range } of this.durationPatterns) {
      const match = pattern.exec(prompt);
      if (match) {
        if (value !== undefined) {
          return value;
        }
        if (range) {
          // Take the average of the range
          const min = parseInt(match[1]);
          const max = parseInt(match[2]);
          return Math.ceil((min + max) / 2);
        }
        if (multiplier !== undefined) {
          return parseInt(match[1]) * multiplier;
        }
      }
      // Reset regex for next iteration
      pattern.lastIndex = 0;
    }

    // Default fallback based on prompt length and complexity
    if (prompt.includes('quick') || prompt.includes('short')) return 2;
    if (prompt.includes('extended') || prompt.includes('long')) return 10;
    if (prompt.includes('weekend')) return 2;
    if (prompt.includes('week')) return 7;
    
    return 5; // Default 5 days
  }

  private static extractInterests(prompt: string): string[] {
    const foundInterests: string[] = [];
    
    for (const interest of this.interests) {
      if (prompt.includes(interest)) {
        foundInterests.push(interest);
      }
    }

    // Add some intelligent defaults based on patterns
    if (prompt.includes('electric') || prompt.includes('ev')) {
      foundInterests.push('eco-friendly', 'sustainable travel');
    }
    if (prompt.includes('family') || prompt.includes('kids')) {
      foundInterests.push('family-friendly');
    }
    if (prompt.includes('romantic') || prompt.includes('couple')) {
      foundInterests.push('romantic', 'intimate');
    }
    if (prompt.includes('solo') || prompt.includes('alone')) {
      foundInterests.push('solo travel', 'self-discovery');
    }

    // If no interests found, provide some defaults
    if (foundInterests.length === 0) {
      return ['scenic drives', 'nature', 'photography'];
    }

    // Remove duplicates and limit to top 5
    return [...new Set(foundInterests)].slice(0, 5);
  }

  private static extractAccommodationType(prompt: string): 'hotel' | 'camping' | undefined {
    if (prompt.includes('camp') || prompt.includes('tent') || prompt.includes('rv') || 
        prompt.includes('outdoors') || prompt.includes('wilderness')) {
      return 'camping';
    }
    if (prompt.includes('hotel') || prompt.includes('resort') || prompt.includes('luxury') ||
        prompt.includes('comfort') || prompt.includes('spa')) {
      return 'hotel';
    }
    return undefined;
  }

  private static extractPace(prompt: string): 'relaxed' | 'moderate' | 'fast' | undefined {
    if (prompt.includes('relax') || prompt.includes('slow') || prompt.includes('leisure') ||
        prompt.includes('peaceful') || prompt.includes('calm')) {
      return 'relaxed';
    }
    if (prompt.includes('fast') || prompt.includes('quick') || prompt.includes('efficient') ||
        prompt.includes('packed') || prompt.includes('busy')) {
      return 'fast';
    }
    if (prompt.includes('moderate') || prompt.includes('balanced')) {
      return 'moderate';
    }
    return undefined;
  }

  // Map parsed interests to UI tags for exact matches and synonyms
  private static mapInterestsToUITags(interests: string[]): string[] {
    const uiTagMap: Record<string, string[]> = {
      'Nature & Wildlife': ['nature', 'wildlife', 'outdoors', 'forests', 'animals', 'parks', 'scenic drives', 'waterfalls'],
      'Historical Sites': ['history', 'historic sites', 'monuments', 'heritage', 'ancient', 'historical', 'historic'],
      'Food & Dining': ['food', 'restaurants', 'cuisine', 'dining', 'local food', 'culinary', 'farmers markets', 'coffee', 'local cuisine'],
      'Adventure Sports': ['adventure', 'rock climbing', 'kayaking', 'skiing', 'outdoor activities', 'sports', 'extreme', 'rafting', 'climbing'],
      'Art & Culture': ['art', 'culture', 'galleries', 'cultural', 'museums', 'exhibitions', 'theaters', 'performances'],
      'Photography': ['photography', 'photo', 'scenic', 'viewpoints', 'landscapes', 'instagram', 'sunsets'],
      'Wine & Breweries': ['wine', 'wineries', 'breweries', 'beer', 'tasting', 'vineyards'],
      'Museums': ['museums', 'exhibits', 'collections', 'science', 'technology'],
      'Beaches & Coast': ['beaches', 'coast', 'ocean', 'seaside', 'coastal', 'waterfront', 'coastline', 'surfing'],
      'Mountains': ['mountains', 'peaks', 'alpine', 'elevation', 'summit', 'hiking', 'trails'],
      'Local Markets': ['markets', 'shopping', 'local', 'crafts', 'souvenirs'],
      'Music Venues': ['music', 'concerts', 'venues', 'live music', 'festivals', 'entertainment'],
      'Wellness & Relaxation': ['relaxation', 'spas', 'hot springs', 'wellness', 'yoga'],
      'Family Friendly': ['family', 'kids', 'theme parks', 'zoos', 'aquariums', 'family-friendly']
    };

    const mappedTags = new Set<string>();

    // Direct UI tag matches first
    for (const [uiTag, synonyms] of Object.entries(uiTagMap)) {
      for (const interest of interests) {
        if (synonyms.includes(interest.toLowerCase()) || 
            interest.toLowerCase().includes(uiTag.toLowerCase()) ||
            uiTag.toLowerCase().includes(interest.toLowerCase())) {
          mappedTags.add(uiTag);
          break;
        }
      }
    }

    // Add unmapped interests as custom tags
    for (const interest of interests) {
      const isAlreadyMapped = Array.from(mappedTags).some(tag => 
        uiTagMap[tag]?.includes(interest.toLowerCase())
      );
      if (!isAlreadyMapped && !mappedTags.has(interest)) {
        // Capitalize properly
        const formatted = interest.split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        mappedTags.add(formatted);
      }
    }

    return Array.from(mappedTags).slice(0, 6); // Limit to 6 tags
  }

  // Calculate parsing confidence for each field
  private static calculateConfidence(prompt: string, extracted: any): ParsingConfidence {
    const lowerPrompt = prompt.toLowerCase();
    
    // Destination confidence
    let destinationConfidence = 0.3; // Base low confidence
    if (this.destinations.some(dest => lowerPrompt.includes(dest))) {
      destinationConfidence = 0.9;
    } else if (/(?:to|visit|explore|see|trip to|travel to|drive to|go to)\s+[a-zA-Z\s,]+/.test(lowerPrompt)) {
      destinationConfidence = 0.7;
    } else if (extracted.destination !== 'California') {
      destinationConfidence = 0.6;
    }

    // Duration confidence
    let durationConfidence = 0.4;
    for (const { pattern } of this.durationPatterns) {
      if (pattern.test(lowerPrompt)) {
        durationConfidence = 0.9;
        break;
      }
      pattern.lastIndex = 0;
    }

    // Interests confidence
    const interestsConfidence = Math.min(0.9, 0.3 + (extracted.interests.length * 0.15));

    // Accommodation confidence
    let accommodationConfidence = extracted.accommodationType ? 0.8 : 0.2;

    // Pace confidence
    let paceConfidence = extracted.pace ? 0.7 : 0.3;

    const overall = (destinationConfidence + durationConfidence + interestsConfidence + 
                    accommodationConfidence + paceConfidence) / 5;

    return {
      overall,
      destination: destinationConfidence,
      duration: durationConfidence,
      interests: interestsConfidence,
      accommodationType: accommodationConfidence,
      pace: paceConfidence
    };
  }

  // Generate clarifying questions when confidence is low
  static generateClarificationQuestions(parsed: ParsedPreferences): ClarificationQuestion[] {
    const questions: ClarificationQuestion[] = [];
    const threshold = 0.6; // Ask for clarification below 60% confidence

    if (parsed.confidence.destination < threshold) {
      questions.push({
        field: 'destination',
        question: "Where would you like to go? I wasn't sure about the destination.",
        suggestions: ['California', 'Pacific Northwest', 'New England', 'Southwest USA', 'Florida'],
        priority: 'high'
      });
    }

    if (parsed.confidence.duration < threshold) {
      questions.push({
        field: 'duration',
        question: "How many days do you have for this trip?",
        suggestions: ['2-3 days (weekend)', '4-6 days (long trip)', '7+ days (extended journey)'],
        priority: 'high'
      });
    }

    if (parsed.confidence.interests < threshold) {
      questions.push({
        field: 'interests',
        question: "What activities or attractions interest you most?",
        suggestions: ['Nature & Wildlife', 'Food & Dining', 'Art & Culture', 'Adventure Sports', 'Photography'],
        priority: 'medium'
      });
    }

    if (parsed.confidence.accommodationType < threshold) {
      questions.push({
        field: 'accommodationType',
        question: "Do you prefer hotels or camping?",
        suggestions: ['Hotels (comfort & amenities)', 'Camping (nature & adventure)'],
        priority: 'medium'
      });
    }

    if (parsed.confidence.pace < threshold) {
      questions.push({
        field: 'pace',
        question: "What's your preferred travel pace?",
        suggestions: ['Relaxed (slow & peaceful)', 'Moderate (balanced)', 'Fast (action-packed)'],
        priority: 'low'
      });
    }

    // Sort by priority
    return questions.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  // Test method for development
  static testParser() {
    const testCases = [
      "I want a 7-day road trip through California visiting national parks and wineries",
      "Plan a weekend getaway to Seattle with good food and coffee", 
      "Create a 2-week adventure trip across the Pacific Northwest with camping and hiking",
      "I'd like to explore New York City for 4 days, focusing on art museums and Broadway shows",
      "Plan a relaxed 5-day trip to Yellowstone with family-friendly activities",
      "Quick 3-day trip to Vegas for nightlife and entertainment",
      "I want to go somewhere nice", // Low confidence test
      "Trip next month" // Very low confidence test
    ];

    console.log('=== AI Prompt Parser Test Results ===');
    testCases.forEach((testCase, index) => {
      console.log(`\nTest ${index + 1}: "${testCase}"`);
      const result = this.parsePrompt(testCase);
      console.log('Parsed:', result);
      console.log('Confidence:', result.confidence);
      
      const questions = this.generateClarificationQuestions(result);
      if (questions.length > 0) {
        console.log('Clarification needed:', questions.map(q => q.question));
      }
    });
  }
}