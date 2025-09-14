import { blink } from '@/blink/client'
import type { UserCredits, CreditCosts } from '@/types'

// Define credit costs for different operations
export const CREDIT_COSTS: CreditCosts = {
  tourGeneration: 3, // Tour generation uses AI text + object generation
  audioGeneration: 2, // Speech synthesis
  routeCalculation: 1, // Route planning and optimization
  aiDescriptions: 1  // AI-generated descriptions for POIs
}

export class CreditManager {
  /**
   * Get user's current credit balance
   */
  static async getUserCredits(userId: string): Promise<UserCredits | null> {
    try {
      const credits = await (blink.db as any).userCredits.list({
        where: { userId },
        limit: 1
      })
      
      if (credits.length === 0) {
        // Create new user credits record with default 10 credits
        const newCredits: UserCredits = {
          id: `credits_${Date.now()}`,
          userId,
          creditsRemaining: 10,
          totalCredits: 10,
          lastUpdated: new Date().toISOString()
        }
        
        await (blink.db as any).userCredits.create(newCredits)
        return newCredits
      }
      
      return credits[0] as UserCredits
    } catch (error) {
      console.error('Error fetching user credits:', error)
      return null
    }
  }

  /**
   * Check if user has enough credits for an operation
   */
  static async hasEnoughCredits(userId: string, requiredCredits: number): Promise<boolean> {
    const userCredits = await this.getUserCredits(userId)
    if (!userCredits) return false
    
    return userCredits.creditsRemaining >= requiredCredits
  }

  /**
   * Deduct credits from user's balance
   */
  static async deductCredits(userId: string, amount: number): Promise<boolean> {
    try {
      const userCredits = await this.getUserCredits(userId)
      if (!userCredits) return false
      
      if (userCredits.creditsRemaining < amount) {
        throw new Error(`Insufficient credits. You need ${amount} credits but only have ${userCredits.creditsRemaining} remaining.`)
      }
      
      await (blink.db as any).userCredits.update(userCredits.id, {
        creditsRemaining: userCredits.creditsRemaining - amount,
        lastUpdated: new Date().toISOString()
      })
      
      return true
    } catch (error) {
      console.error('Error deducting credits:', error)
      throw error
    }
  }

  /**
   * Add credits to user's balance (for admin/testing purposes)
   */
  static async addCredits(userId: string, amount: number): Promise<boolean> {
    try {
      const userCredits = await this.getUserCredits(userId)
      if (!userCredits) return false
      
      await (blink.db as any).userCredits.update(userCredits.id, {
        creditsRemaining: userCredits.creditsRemaining + amount,
        totalCredits: Math.max(userCredits.totalCredits, userCredits.creditsRemaining + amount),
        lastUpdated: new Date().toISOString()
      })
      
      return true
    } catch (error) {
      console.error('Error adding credits:', error)
      return false
    }
  }

  /**
   * Calculate total credits needed for tour generation
   */
  static calculateTourGenerationCost(preferences: any): number {
    let cost = CREDIT_COSTS.tourGeneration // Base cost for tour generation
    
    // Add cost for route calculation
    if (preferences.durationDays > 1) {
      cost += CREDIT_COSTS.routeCalculation
    }
    
    // Add cost for additional AI descriptions based on interests
    const interestCount = preferences.interests?.length || 0
    cost += Math.floor(interestCount / 3) * CREDIT_COSTS.aiDescriptions
    
    return cost
  }

  /**
   * Validate credit requirements before operation
   */
  static async validateCreditRequirement(
    userId: string, 
    operation: keyof CreditCosts | number,
    customMessage?: string
  ): Promise<{ canProceed: boolean; message?: string; creditsNeeded?: number; creditsRemaining?: number }> {
    try {
      const creditsNeeded = typeof operation === 'number' ? operation : CREDIT_COSTS[operation]
      const userCredits = await this.getUserCredits(userId)
      
      if (!userCredits) {
        return {
          canProceed: false,
          message: 'Unable to check credit balance. Please try again.',
          creditsNeeded,
          creditsRemaining: 0
        }
      }
      
      if (userCredits.creditsRemaining < creditsNeeded) {
        return {
          canProceed: false,
          message: customMessage || `Insufficient credits. This operation requires ${creditsNeeded} credits, but you only have ${userCredits.creditsRemaining} remaining.`,
          creditsNeeded,
          creditsRemaining: userCredits.creditsRemaining
        }
      }
      
      return {
        canProceed: true,
        creditsNeeded,
        creditsRemaining: userCredits.creditsRemaining
      }
    } catch (error) {
      console.error('Error validating credit requirement:', error)
      return {
        canProceed: false,
        message: 'Error checking credit balance. Please try again.',
        creditsNeeded: typeof operation === 'number' ? operation : CREDIT_COSTS[operation],
        creditsRemaining: 0
      }
    }
  }
}

// Utility function for credit-aware operations
export async function withCreditCheck<T>(
  userId: string,
  operation: keyof CreditCosts | number,
  asyncFunction: () => Promise<T>,
  customMessage?: string
): Promise<T> {
  const validation = await CreditManager.validateCreditRequirement(userId, operation, customMessage)
  
  if (!validation.canProceed) {
    throw new Error(validation.message || 'Insufficient credits')
  }
  
  // Deduct credits before operation
  const creditsNeeded = typeof operation === 'number' ? operation : CREDIT_COSTS[operation]
  await CreditManager.deductCredits(userId, creditsNeeded)
  
  try {
    return await asyncFunction()
  } catch (error) {
    // On failure, refund the credits
    await CreditManager.addCredits(userId, creditsNeeded)
    throw error
  }
}