import React, { useState, useEffect, useRef } from 'react'
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { blink } from '@/blink/client'
import { CreditManager } from '@/lib/creditManager'
import type { RouteStop } from '@/types'

interface AudioNarrationProps {
  routeStops: RouteStop[]
  currentStopIndex: number
  onStopChange: (index: number) => void
}

interface NarrationScript {
  id: string
  stopId: string
  title: string
  script: string
  audioUrl?: string
  duration: number
  isGenerating: boolean
}

export function AudioNarration({ routeStops, currentStopIndex, onStopChange }: AudioNarrationProps) {
  const [scripts, setScripts] = useState<NarrationScript[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  const generateNarrationScripts = React.useCallback(async () => {
    if (routeStops.length === 0) return

    setIsGenerating(true)
    const newScripts: NarrationScript[] = []

    for (const stop of routeStops.slice(0, 3)) { // Limit to first 3 for demo
      try {
        const { text } = await blink.ai.generateText({
          prompt: `Create an engaging, informative narration script (2-3 sentences) about ${stop.name}. 
          
          Location: ${stop.description}
          Type: ${stop.type}
          
          Focus on:
          - Historical significance or interesting facts
          - What makes this location special
          - Practical travel tips if relevant
          
          Keep it conversational and engaging, as if you're a knowledgeable tour guide speaking to EV travelers.`,
          maxTokens: 200
        })

        const script: NarrationScript = {
          id: `script_${stop.id}`,
          stopId: stop.id,
          title: `About ${stop.name}`,
          script: text,
          duration: Math.floor(text.length / 10), // Rough estimate: 10 chars per second
          isGenerating: false
        }

        newScripts.push(script)
      } catch (error) {
        console.error('Failed to generate script for', stop.name, error)
      }
    }

    setScripts(newScripts)
    setIsGenerating(false)
  }, [routeStops])

  useEffect(() => {
    generateNarrationScripts()
  }, [generateNarrationScripts])

  const generateAudio = async (script: NarrationScript) => {
    try {
      // Get current user
      const currentUser = await blink.auth.me().catch(() => null)
      if (!currentUser) {
        alert('Please sign in to generate audio narration')
        return
      }

      // Check credits before generating audio
      const validation = await CreditManager.validateCreditRequirement(
        currentUser.id,
        'audioGeneration'
      )

      if (!validation.canProceed) {
        alert(validation.message || 'Generating audio narration requires credits. Please upgrade your plan.')
        return
      }

      setScripts(prev => prev.map(s => 
        s.id === script.id ? { ...s, isGenerating: true } : s
      ))

      // Deduct credits and generate audio
      await CreditManager.deductCredits(currentUser.id, 2) // Cost for audio generation

      const { url } = await blink.ai.generateSpeech({
        text: script.script,
        voice: 'nova' // Choose from available voices
      })

      setScripts(prev => prev.map(s => 
        s.id === script.id ? { ...s, audioUrl: url, isGenerating: false } : s
      ))
    } catch (error) {
      console.error('Failed to generate audio:', error)
      
      let errorMessage = 'Failed to generate audio. Please try again.'
      
      if (error instanceof Error && error.message.includes('Insufficient credits')) {
        errorMessage = error.message
      }
      
      alert(errorMessage)
      
      setScripts(prev => prev.map(s => 
        s.id === script.id ? { ...s, isGenerating: false } : s
      ))
    }
  }

  const currentScript = scripts.find(s => s.stopId === routeStops[currentStopIndex]?.id)

  const togglePlayPause = () => {
    if (!currentScript?.audioUrl || !audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const goToPreviousStop = React.useCallback(() => {
    if (currentStopIndex > 0) {
      onStopChange(currentStopIndex - 1)
      setIsPlaying(false)
      setCurrentTime(0)
    }
  }, [currentStopIndex, onStopChange])

  const goToNextStop = React.useCallback(() => {
    if (currentStopIndex < routeStops.length - 1) {
      onStopChange(currentStopIndex + 1)
      setIsPlaying(false)
      setCurrentTime(0)
    }
  }, [currentStopIndex, routeStops.length, onStopChange])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
      // Auto-advance to next stop
      if (currentStopIndex < routeStops.length - 1) {
        setTimeout(() => goToNextStop(), 1000)
      }
    }

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [currentStopIndex, routeStops.length, goToNextStop])

  if (routeStops.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Volume2 className="h-5 w-5 mr-2 text-primary" />
            Audio Tour Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-4">
            Generate a tour to enable audio narration
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Volume2 className="h-5 w-5 mr-2 text-primary" />
            Audio Tour Guide
          </div>
          {isGenerating && (
            <div className="flex items-center text-sm text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
              Generating...
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentScript ? (
          <>
            {/* Current Stop Info */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-1">{currentScript.title}</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                {currentScript.script}
              </p>
            </div>

            {/* Audio Controls */}
            <div className="space-y-3">
              {currentScript.audioUrl ? (
                <>
                  <audio
                    ref={audioRef}
                    src={currentScript.audioUrl}
                    preload="metadata"
                  />
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${audioRef.current?.duration ? (currentTime / audioRef.current.duration) * 100 : 0}%`
                      }}
                    />
                  </div>

                  {/* Time Display */}
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(audioRef.current?.duration || 0)}</span>
                  </div>
                </>
              ) : (
                <Button
                  onClick={() => generateAudio(currentScript)}
                  disabled={currentScript.isGenerating}
                  className="w-full"
                >
                  {currentScript.isGenerating ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating Audio...
                    </div>
                  ) : (
                    <>
                      <Volume2 className="h-4 w-4 mr-2" />
                      Generate Audio
                    </>
                  )}
                </Button>
              )}

              {/* Control Buttons */}
              <div className="flex items-center justify-center space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousStop}
                  disabled={currentStopIndex === 0}
                >
                  <SkipBack className="h-4 w-4" />
                </Button>

                <Button
                  onClick={togglePlayPause}
                  disabled={!currentScript.audioUrl}
                  className="px-6"
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5 ml-1" />
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextStop}
                  disabled={currentStopIndex === routeStops.length - 1}
                >
                  <SkipForward className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleMute}
                  disabled={!currentScript.audioUrl}
                >
                  {isMuted ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-4 text-gray-500">
            <Volume2 className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p>Select a stop on the map to hear narration</p>
          </div>
        )}

        {/* Stop Navigation */}
        {routeStops.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="font-medium text-gray-900 mb-3">Tour Stops</h4>
            <div className="space-y-2">
              {routeStops.slice(0, 5).map((stop, index) => {
                const hasScript = scripts.some(s => s.stopId === stop.id)
                const isActive = index === currentStopIndex
                
                return (
                  <button
                    key={stop.id}
                    onClick={() => onStopChange(index)}
                    className={`w-full text-left p-2 rounded-lg border transition-colors ${
                      isActive
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{stop.name}</span>
                      <div className="flex items-center space-x-1">
                        {hasScript && (
                          <Volume2 className="h-3 w-3 text-green-600" />
                        )}
                        <span className="text-xs text-gray-500">#{index + 1}</span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}