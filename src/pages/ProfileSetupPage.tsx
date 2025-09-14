import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { blink } from '@/blink/client'
import toast from 'react-hot-toast'

const travelStyles = [
  'Adventure Seeker',
  'Luxury Experience',
  'Camping & Nature',
  'Cultural Explorer',
  'Food & Drink',
  'Budget-Friendly'
]

const interestsList = [
  'Photography','History','Art','Music','Food','Nature','Architecture','Shopping','Nightlife','Museums','Sports','Wellness'
]

export default function ProfileSetupPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const [name, setName] = useState('')
  const [vehicleType, setVehicleType] = useState('electric')
  const [accommodation, setAccommodation] = useState('hotel')
  const [selectedStyles, setSelectedStyles] = useState<string[]>([])
  const [budget, setBudget] = useState(500)
  const [interests, setInterests] = useState<string[]>([])

  useEffect(() => {
    const unsub = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      if (state.user) {
        // Try to load existing preferences
        (async () => {
          try {
            const prefs = await (blink.db as any).userPreferences.list({ where: { userId: state.user.id }, limit: 1 })
            if (prefs && prefs.length) {
              const p = prefs[0]
              setName(state.user.displayName || '')
              setVehicleType(p.vehicleType || 'electric')
              setAccommodation(p.accommodationPreference || 'hotel')
              setSelectedStyles((p.interests || []).slice(0,3))
              setBudget(Number(p.budgetRange) || 500)
              setInterests(p.interests || [])
            }
          } catch (e) {
            console.error('Failed to load preferences', e)
          }
        })()
      }
    })

    return unsub
  }, [])

  const toggleStyle = (s: string) => {
    setSelectedStyles(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  const toggleInterest = (i: string) => {
    setInterests(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!user) {
      blink.auth.login(window.location.href)
      return
    }

    setLoading(true)
    try {
      const payload = {
        id: `prefs_${user.id}`,
        userId: user.id,
        vehicleType,
        accommodationPreference: accommodation,
        interests: JSON.stringify(interests),
        travelStyles: JSON.stringify(selectedStyles),
        budgetRange: String(budget),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      // Upsert: try create, fallback to update
      try {
        await (blink.db as any).userPreferences.create(payload)
      } catch (err) {
        // attempt update
        await (blink.db as any).userPreferences.update(payload.id, payload)
      }

      toast.success('Profile saved')
      navigate('/')
    } catch (error) {
      console.error('Save failed', error)
      toast.error('Failed to save profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-semibold mb-2">Travel Profile Setup</h1>
        <p className="text-muted-foreground mb-6">Help us personalize your perfect trip</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Name or Travel Handle</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="What should we call you?" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Primary Vehicle Type</label>
                    <select value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
                      <option value="electric">Electric</option>
                      <option value="hybrid">Hybrid</option>
                      <option value="gas">Gas</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Accommodation Preference</label>
                    <select value={accommodation} onChange={(e) => setAccommodation(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
                      <option value="hotel">Hotel</option>
                      <option value="camping">Camping</option>
                      <option value="both">Both</option>
                    </select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Travel Style Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Select all travel styles that appeal to you (choose multiple)</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {travelStyles.map(s => (
                  <button type="button" key={s} onClick={() => toggleStyle(s)} className={`p-4 border rounded-lg text-left transition ${selectedStyles.includes(s) ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 bg-white'}`}>
                    <div className="font-medium">{s}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Budget Preference</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">Daily budget per person (excluding transportation)</p>
              <div>
                <input type="range" min={50} max={1000} value={budget} onChange={(e) => setBudget(Number(e.target.value))} className="w-full" />
                <div className="flex items-center justify-between text-sm mt-2">
                  <span>$50/day</span>
                  <span className="font-semibold text-primary">${budget}/day</span>
                  <span>$1000+/day</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Interests & Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">What activities and experiences interest you most?</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {interestsList.map(i => (
                  <button key={i} type="button" onClick={() => toggleInterest(i)} className={`px-3 py-2 border rounded-lg text-sm ${interests.includes(i) ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 bg-white'}`}>
                    {i}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="bg-gradient-to-r from-primary/5 to-accent/5 p-6 rounded-lg border border-border text-center">
            <h3 className="text-xl font-semibold text-foreground mb-2">Ready to Create Amazing Journeys?</h3>
            <p className="text-muted-foreground mb-4">Your personalized travel profile will help our AI create the perfect routes and recommendations just for you.</p>
            <div className="flex justify-center">
              <Button type="button" onClick={handleSubmit} disabled={loading} className="px-8 bg-gradient-to-r from-primary to-accent text-white">
                Complete Profile Setup
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}