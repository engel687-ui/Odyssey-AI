import React, { useState, useEffect } from 'react'
import { MapPin, Car, Mountain, Star, Utensils, Camera, Building, ShoppingBag, Palette, Music, TreePine, Dumbbell, Heart, Gamepad2, Home, Tent, ChevronDown, Coins } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { blink } from '@/blink/client'
import type { TourPreferences } from '@/types'

interface TourPlanningFormProps {
  onSubmit: (preferences: any) => void
  onCancel: () => void
}

interface FormData {
  name: string
  vehicleType: string
  accommodationType: string
  travelStyles: string[]
  budget: number
  interests: string[]
}

export function TourPlanningForm({ onSubmit, onCancel }: TourPlanningFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    vehicleType: '',
    accommodationType: '',
    travelStyles: [],
    budget: 300,
    interests: []
  })

  const travelStyles = [
    { id: 'adventure', label: 'Adventure Seeker', icon: Mountain },
    { id: 'luxury', label: 'Luxury Experience', icon: Star },
    { id: 'camping', label: 'Camping & Nature', icon: TreePine },
    { id: 'cultural', label: 'Cultural Explorer', icon: Building },
    { id: 'food', label: 'Food & Drink', icon: Utensils },
    { id: 'budget', label: 'Budget-Friendly', icon: Coins }
  ]

  const interests = [
    { id: 'photography', label: 'Photography', icon: Camera },
    { id: 'history', label: 'History', icon: Building },
    { id: 'art', label: 'Art', icon: Palette },
    { id: 'music', label: 'Music', icon: Music },
    { id: 'food', label: 'Food', icon: Utensils },
    { id: 'nature', label: 'Nature', icon: TreePine },
    { id: 'architecture', label: 'Architecture', icon: Building },
    { id: 'shopping', label: 'Shopping', icon: ShoppingBag },
    { id: 'nightlife', label: 'Nightlife', icon: Music },
    { id: 'museums', label: 'Museums', icon: Building },
    { id: 'sports', label: 'Sports', icon: Dumbbell },
    { id: 'wellness', label: 'Wellness', icon: Heart }
  ]

  const toggleTravelStyle = (styleId: string) => {
    setFormData(prev => ({
      ...prev,
      travelStyles: prev.travelStyles.includes(styleId)
        ? prev.travelStyles.filter(s => s !== styleId)
        : [...prev.travelStyles, styleId]
    }))
  }

  const toggleInterest = (interestId: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interestId)
        ? prev.interests.filter(i => i !== interestId)
        : [...prev.interests, interestId]
    }))
  }

  const getBudgetLabel = (value: number) => {
    if (value < 100) return 'Budget'
    if (value < 200) return 'Moderate'
    if (value < 400) return 'Comfortable'
    if (value < 700) return 'Premium'
    return 'Luxury'
  }

  const isFormValid = () => {
    return formData.name.trim() !== '' && 
           formData.vehicleType !== '' && 
           formData.accommodationType !== ''
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Send comprehensive preferences to map creation function
    const preferences = {
      ...formData,
      budgetLabel: getBudgetLabel(formData.budget)
    }
    
    onSubmit(preferences)
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="text-center py-8 px-6 border-b border-gray-100">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Travel Profile Setup</h1>
          <p className="text-gray-600">Help us personalize your perfect trip</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Basic Information */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name or Travel Handle
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter your name"
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Vehicle Type
                  </label>
                  <Select value={formData.vehicleType} onValueChange={(value) => setFormData(prev => ({ ...prev, vehicleType: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gas">Gas Vehicle</SelectItem>
                      <SelectItem value="electric">Electric Vehicle</SelectItem>
                      <SelectItem value="hybrid">Hybrid Vehicle</SelectItem>
                      <SelectItem value="rv">RV/Motorhome</SelectItem>
                      <SelectItem value="motorcycle">Motorcycle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Accommodation Preference
                  </label>
                  <Select value={formData.accommodationType} onValueChange={(value) => setFormData(prev => ({ ...prev, accommodationType: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hotels">Hotels</SelectItem>
                      <SelectItem value="camping_rv">Camping/RV Parks</SelectItem>
                      <SelectItem value="airbnb">Airbnb/Vacation Rentals</SelectItem>
                      <SelectItem value="hostels">Hostels</SelectItem>
                      <SelectItem value="mix">Mix of Options</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Travel Style Preferences */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Travel Style Preferences</h2>
            <p className="text-sm text-gray-600">Select all that apply to your travel style</p>
            
            <div className="grid grid-cols-2 gap-3">
              {travelStyles.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleTravelStyle(id)}
                  className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                    formData.travelStyles.includes(id)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className="font-medium text-sm">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Budget Preference */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Budget Preference</h2>
            <p className="text-sm text-gray-600">Daily spending range</p>
            
            <div className="space-y-4">
              <div className="px-4">
                <Slider
                  value={[formData.budget]}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, budget: value[0] }))}
                  max={1000}
                  min={50}
                  step={50}
                  className="w-full"
                />
              </div>
              
              <div className="flex justify-between text-sm text-gray-600">
                <span>$50/day</span>
                <span className="font-semibold text-blue-600">
                  ${formData.budget}/day - {getBudgetLabel(formData.budget)}
                </span>
                <span>$1000+/day</span>
              </div>
            </div>
          </div>

          {/* Interests & Activities */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Interests & Activities</h2>
            <p className="text-sm text-gray-600">What excites you most when traveling?</p>
            
            <div className="grid grid-cols-4 gap-2">
              {interests.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleInterest(id)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${
                    formData.interests.includes(id)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-xs font-medium text-center">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-6 border-t border-gray-100">
            <Button 
              type="submit" 
              disabled={!isFormValid()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 text-lg"
            >
              Complete Profile Setup
            </Button>
            <p className="text-center text-sm text-gray-500 mt-3">
              This information will help our AI craft the perfect routes and recommendations for you
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}