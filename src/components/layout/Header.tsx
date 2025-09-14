import React from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Zap, Route } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HeaderProps {
  onStartTour: () => void
}

export function Header({ onStartTour }: HeaderProps) {
  return (
    <header className="bg-card/95 backdrop-blur-md border-b border-border/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-primary to-accent rounded-xl shadow-lg">
              <Route className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Odyssey AI
            </h1>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors font-medium">Discover</Link>
            <Link to="/profile-setup" className="text-muted-foreground hover:text-foreground transition-colors font-medium">Profile</Link>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors font-medium">Community</a>
          </nav>
          
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" className="hidden sm:flex text-muted-foreground hover:text-foreground">
              <Zap className="h-4 w-4 mr-2" />
              Charging
            </Button>
            <Button onClick={onStartTour} size="sm" className="bg-gradient-to-r from-primary to-accent text-white shadow-md hover:shadow-lg transition-all btn-glow">
              <MapPin className="h-4 w-4 mr-2" />
              Plan Journey
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}