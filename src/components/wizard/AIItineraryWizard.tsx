import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Slider } from '../ui/slider';
import { MapPin, Calendar, Zap, Hotel, Tent, DollarSign, Play, Edit3, Check, X } from 'lucide-react';
import WizardAlert, { WizardStage } from './WizardAlert';
import { RouteService, TourPreferences, GeneratedTour, WizardProgress } from '../../services/routeService';
import { useAuth } from '../../hooks/useAuth';
import { AIPromptParser, ParsedPreferences, ClarificationQuestion } from '@/utils/promptParser';
import ClarificationModal from './ClarificationModal';

interface AIItineraryWizardProps {
  onTourGenerated: (tour: GeneratedTour) => void;
  onClose: () => void;
}

const AIItineraryWizard = ({ onTourGenerated, onClose }: AIItineraryWizardProps) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [wizardProgress, setWizardProgress] = useState<WizardProgress>({
    stage: 'analyzing',
    message: '',
    progress: 0
  });

  const [preferences, setPreferences] = useState<TourPreferences>({
    destination: '',
    duration: 3,
    interests: [],
    accommodationType: 'hotel',
    vehicleRange: 300,
    budget: 'medium'
  });

  const [prompt, setPrompt] = useState('');
  const [showDemo, setShowDemo] = useState(false);
  const [demoStage, setDemoStage] = useState<WizardStage>('analyzing');
  const [parsedData, setParsedData] = useState<ParsedPreferences | null>(null);
  const [clarificationQuestions, setClarificationQuestions] = useState<ClarificationQuestion[]>([]);
  const [showClarification, setShowClarification] = useState(false);
  const [showReviewPanel, setShowReviewPanel] = useState(false);

  const routeService = new RouteService();

  // UI interest tags that match the parser mapping
  const interestOptions = [
    'Nature & Wildlife', 'Historical Sites', 'Food & Dining', 'Adventure Sports',
    'Art & Culture', 'Photography', 'Wine & Breweries', 'Museums',
    'Beaches & Coast', 'Mountains', 'Local Markets', 'Music Venues'
  ];

  const toggleInterest = (interest: string) => {
    setPreferences(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleGenerate = async () => {
    if (!user) return;
    
    // Check if we need clarification first
    if (parsedData && parsedData.confidence.overall < 0.6) {
      const questions = AIPromptParser.generateClarificationQuestions(parsedData);
      if (questions.filter(q => q.priority === 'high').length > 0) {
        setClarificationQuestions(questions);
        setShowClarification(true);
        return;
      }
    }
    
    setIsGenerating(true);
    routeService.setProgressCallback(setWizardProgress);

    try {
      // Use parsed data and enhanced preferences
      let finalPreferences = { ...preferences };
      let enhancedParsedData = parsedData;

      if (prompt.trim()) {
        enhancedParsedData = AIPromptParser.parsePrompt(prompt);
        finalPreferences = await parsePromptPreferences(prompt, preferences);
      }

      // Pass parsed data to route service for smarter generation
      const tour = await routeService.generateTour(finalPreferences, user.id, enhancedParsedData);
      onTourGenerated(tour);
      onClose();
    } catch (error) {
      console.error('Failed to generate tour:', error);
      // TODO: Show error toast
    } finally {
      setIsGenerating(false);
    }
  };

  const parsePromptPreferences = async (prompt: string, base: TourPreferences): Promise<TourPreferences> => {
    // Use the enhanced AI prompt parser
    const parsed = AIPromptParser.parsePrompt(prompt);
    
    return {
      ...base,
      // Only use parsed data if confidence is reasonable
      destination: parsed.confidence.destination > 0.5 ? parsed.destination : base.destination,
      duration: parsed.confidence.duration > 0.5 ? parsed.duration : base.duration,
      interests: parsed.confidence.interests > 0.4 ? parsed.interests : base.interests,
      accommodationType: parsed.confidence.accommodationType > 0.6 ? parsed.accommodationType : base.accommodationType,
      // Map pace to budget if available and confident
      ...(parsed.pace && parsed.confidence.pace > 0.6 && {
        budget: parsed.pace === 'relaxed' ? 'high' : 
               parsed.pace === 'fast' ? 'low' : 'medium'
      })
    };
  };

  const handleClarificationAnswer = (field: keyof ParsedPreferences, answer: string) => {
    // Build an updated parsedData object and update both parsedData and preferences
    const currentParsed = parsedData ? { ...parsedData } : AIPromptParser.parsePrompt(prompt || '');
    const updatedParsed: ParsedPreferences = { ...currentParsed } as ParsedPreferences;
    const updatedConf = { ...updatedParsed.confidence };

    if (field === 'destination') {
      updatedParsed.destination = answer;
      updatedConf.destination = 0.95;
    } else if (field === 'duration') {
      const durationMap: Record<string, number> = {
        '2-3 days (weekend)': 3,
        '4-6 days (long trip)': 5,
        '7+ days (extended journey)': 7
      };
      const numeric = durationMap[answer] || parseInt(answer) || updatedParsed.duration || preferences.duration;
      updatedParsed.duration = numeric;
      updatedConf.duration = 0.95;
    } else if (field === 'interests') {
      // Add interest tag (expecting UI tag like 'Food & Dining')
      if (!updatedParsed.interests) updatedParsed.interests = [];
      if (!updatedParsed.interests.includes(answer)) updatedParsed.interests = [...updatedParsed.interests, answer];
      updatedConf.interests = Math.min(0.95, (updatedParsed.confidence?.interests || 0) + 0.25);
    } else if (field === 'accommodationType') {
      const typeMap: Record<string, 'hotel' | 'camping'> = {
        'Hotels (comfort & amenities)': 'hotel',
        'Camping (nature & adventure)': 'camping'
      };
      updatedParsed.accommodationType = typeMap[answer] || (answer === 'camping' ? 'camping' : 'hotel');
      updatedConf.accommodationType = 0.95;
    } else if (field === 'pace') {
      const paceMap: Record<string, 'relaxed' | 'moderate' | 'fast'> = {
        'Relaxed (slow & peaceful)': 'relaxed',
        'Moderate (balanced)': 'moderate',
        'Fast (action-packed)': 'fast'
      };
      updatedParsed.pace = paceMap[answer] || updatedParsed.pace;
      updatedConf.pace = 0.95;
    }

    // Recompute overall confidence
    updatedParsed.confidence = {
      ...updatedConf,
      overall: (
        (updatedConf.destination || 0) +
        (updatedConf.duration || 0) +
        (updatedConf.interests || 0) +
        (updatedConf.accommodationType || 0) +
        (updatedConf.pace || 0)
      ) / 5
    } as any;

    // Commit updates
    setParsedData(updatedParsed);

    // Update form preferences with high-confidence parsed values
    setPreferences(prev => {
      const next = { ...prev };
      if (updatedParsed.confidence.destination > 0.5) next.destination = updatedParsed.destination;
      if (updatedParsed.confidence.duration > 0.5) next.duration = updatedParsed.duration;
      if (updatedParsed.confidence.interests > 0.4 && updatedParsed.interests?.length) {
        // Ensure we only set known UI tags; merge unknowns as custom tags
        const mapped = updatedParsed.interests.filter(tag => interestOptions.includes(tag));
        next.interests = mapped.length ? mapped : Array.from(new Set([...prev.interests, ...updatedParsed.interests]));
      }
      if (updatedParsed.confidence.accommodationType > 0.6 && updatedParsed.accommodationType) next.accommodationType = updatedParsed.accommodationType;
      return next;
    });

    // Remove answered question
    setClarificationQuestions(prev => prev.filter(q => q.field !== field));

    // Hide clarification if no more high-priority questions remain
    if (clarificationQuestions.filter(q => q.field !== field && q.priority === 'high').length === 0) {
      setShowClarification(false);
    }
  };

  const handlePromptChange = (value: string) => {
    setPrompt(value);
    
    // Auto-parse and populate fields if prompt is substantial
    if (value.trim().length > 20) {
      const parsed = AIPromptParser.parsePrompt(value);
      setParsedData(parsed);
      
      // Update form with high-confidence parsed data
      setPreferences(prev => ({
        ...prev,
        destination: parsed.confidence.destination > 0.7 ? parsed.destination : prev.destination,
        duration: parsed.confidence.duration > 0.7 ? parsed.duration : prev.duration,
        interests: parsed.confidence.interests > 0.5 ? parsed.interests : prev.interests,
        accommodationType: parsed.confidence.accommodationType > 0.7 ? parsed.accommodationType : prev.accommodationType
      }));

      // Show confidence indicators and review panel
      if (parsed.confidence.overall < 0.7) {
        const questions = AIPromptParser.generateClarificationQuestions(parsed);
        setClarificationQuestions(questions);
        setShowReviewPanel(true);
      } else {
        setClarificationQuestions([]);
        setShowReviewPanel(false);
      }
    } else {
      setParsedData(null);
      setClarificationQuestions([]);
      setShowReviewPanel(false);
    }
  };

  const handleDemoToggle = () => {
    setShowDemo(!showDemo);
    if (!showDemo) {
      setIsGenerating(true);
      setDemoStage('analyzing');
    } else {
      setIsGenerating(false);
    }
  };

  const handleParsedPreferencesChange = (field: keyof ParsedPreferences, value: any) => {
    if (!parsedData) return;

    const updatedParsed = { ...parsedData };
    if (field === 'destination') {
      updatedParsed.destination = value;
      updatedParsed.confidence.destination = 0.95;
    } else if (field === 'duration') {
      updatedParsed.duration = parseInt(value) || updatedParsed.duration;
      updatedParsed.confidence.duration = 0.95;
    } else if (field === 'interests') {
      updatedParsed.interests = Array.isArray(value) ? value : [value];
      updatedParsed.confidence.interests = 0.9;
    } else if (field === 'accommodationType') {
      updatedParsed.accommodationType = value;
      updatedParsed.confidence.accommodationType = 0.95;
    }

    // Recalculate overall confidence
    const conf = updatedParsed.confidence;
    updatedParsed.confidence.overall = (
      conf.destination + conf.duration + conf.interests + 
      conf.accommodationType + (conf.pace || 0.5)
    ) / 5;

    setParsedData(updatedParsed);

    // Sync with wizard preferences
    setPreferences(prev => ({
      ...prev,
      destination: updatedParsed.destination,
      duration: updatedParsed.duration,
      interests: updatedParsed.interests,
      accommodationType: updatedParsed.accommodationType || prev.accommodationType
    }));
  };

  const toggleReviewInterest = (interest: string) => {
    if (!parsedData) return;
    
    const currentInterests = parsedData.interests || [];
    const updatedInterests = currentInterests.includes(interest)
      ? currentInterests.filter(i => i !== interest)
      : [...currentInterests, interest];
    
    handleParsedPreferencesChange('interests', updatedInterests);
  };

  return (
    <>
      <WizardAlert
        isVisible={isGenerating || showDemo}
        stage={showDemo ? demoStage : wizardProgress.stage}
        message={showDemo ? `Demo: ${demoStage} stage preview` : wizardProgress.message}
        showDemo={showDemo}
        onDemoStageChange={setDemoStage}
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-500 to-cyan-600 p-6 text-white relative">
            <h2 className="text-2xl font-bold mb-2">AI Trip Wizard</h2>
            <p className="text-teal-100">Let's create your perfect electric vehicle adventure!</p>
            
            {/* Controls */}
            <div className="absolute top-4 right-4 flex gap-2">
              {parsedData && (
                <Button
                  onClick={() => setShowReviewPanel(!showReviewPanel)}
                  size="sm"
                  variant="secondary"
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  <Edit3 className="w-3 h-3 mr-1" />
                  {showReviewPanel ? 'Hide Review' : 'Review Parsed'}
                </Button>
              )}
              <Button
                onClick={handleDemoToggle}
                size="sm"
                variant="secondary"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <Play className="w-3 h-3 mr-1" />
                {showDemo ? 'Stop Demo' : 'Demo Wizard'}
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            
            {/* Clarification Questions Modal (replaced with reusable component) */}
            {showClarification && clarificationQuestions.length > 0 && (
              <ClarificationModal
                isOpen={showClarification}
                questions={clarificationQuestions}
                onAnswer={handleClarificationAnswer}
                onClose={() => setShowClarification(false)}
              />
            )}

            {step === 1 && (
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Tell us about your dream trip (optional)
                    {parsedData && (
                      <span className="ml-2 text-xs text-gray-500">
                        Confidence: {(parsedData.confidence.overall * 100).toFixed(0)}%
                      </span>
                    )}
                  </label>
                  <Textarea
                    placeholder="I want to explore the Pacific Coast Highway for 5 days, visiting wineries and coastal towns..."
                    value={prompt}
                    onChange={(e) => handlePromptChange(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                  {clarificationQuestions.length > 0 && !showClarification && (
                    <p className="text-xs text-amber-600 mt-1">
                      💡 I have {clarificationQuestions.length} question(s) to make this perfect for you
                    </p>
                  )}
                </div>

                {/* Inline Review Panel */}
                {showReviewPanel && parsedData && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900">Review Parsed Preferences</h3>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-500">
                          Confidence: {(parsedData.confidence.overall * 100).toFixed(0)}%
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowReviewPanel(false)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Destination
                          <span className="ml-1 text-xs text-gray-500">
                            ({(parsedData.confidence.destination * 100).toFixed(0)}%)
                          </span>
                        </label>
                        <Input
                          value={parsedData.destination}
                          onChange={(e) => handleParsedPreferencesChange('destination', e.target.value)}
                          placeholder="Enter destination..."
                          className="text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Duration (days)
                          <span className="ml-1 text-xs text-gray-500">
                            ({(parsedData.confidence.duration * 100).toFixed(0)}%)
                          </span>
                        </label>
                        <Input
                          type="number"
                          min="1"
                          max="30"
                          value={parsedData.duration}
                          onChange={(e) => handleParsedPreferencesChange('duration', e.target.value)}
                          className="text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Interests
                        <span className="ml-1 text-xs text-gray-500">
                          ({(parsedData.confidence.interests * 100).toFixed(0)}%)
                        </span>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {interestOptions.map(interest => (
                          <Badge
                            key={interest}
                            variant={parsedData.interests.includes(interest) ? "default" : "outline"}
                            className={`cursor-pointer text-xs transition-colors ${
                              parsedData.interests.includes(interest)
                                ? 'bg-teal-600 hover:bg-teal-700 text-white'
                                : 'hover:bg-gray-100'
                            }`}
                            onClick={() => toggleReviewInterest(interest)}
                          >
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Accommodation Type
                        <span className="ml-1 text-xs text-gray-500">
                          ({(parsedData.confidence.accommodationType * 100).toFixed(0)}%)
                        </span>
                      </label>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={parsedData.accommodationType === 'hotel' ? 'default' : 'outline'}
                          onClick={() => handleParsedPreferencesChange('accommodationType', 'hotel')}
                          className="flex-1"
                        >
                          <Hotel className="w-4 h-4 mr-1" />
                          Hotel
                        </Button>
                        <Button
                          size="sm"
                          variant={parsedData.accommodationType === 'camping' ? 'default' : 'outline'}
                          onClick={() => handleParsedPreferencesChange('accommodationType', 'camping')}
                          className="flex-1"
                        >
                          <Tent className="w-4 h-4 mr-1" />
                          Camping
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <p className="text-xs text-gray-500">
                        Changes are automatically applied to your preferences
                      </p>
                      <Button
                        size="sm"
                        onClick={() => setShowReviewPanel(false)}
                        className="bg-teal-600 hover:bg-teal-700"
                      >
                        <Check className="w-3 h-3 mr-1" />
                        Looks Good
                      </Button>
                    </div>
                  </motion.div>
                )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium mb-2">
                      <MapPin className="w-4 h-4" />
                      Destination
                    </label>
                    <Input
                      placeholder="San Francisco, CA"
                      value={preferences.destination}
                      onChange={(e) => setPreferences(prev => ({ ...prev, destination: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium mb-2">
                      <Calendar className="w-4 h-4" />
                      Trip Duration
                    </label>
                    <div className="space-y-2">
                      <Slider
                        value={[preferences.duration]}
                        onValueChange={([value]) => setPreferences(prev => ({ ...prev, duration: value }))}
                        min={1}
                        max={14}
                        step={1}
                        className="w-full"
                      />
                      <div className="text-center text-sm text-gray-600">
                        {preferences.duration} day{preferences.duration !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => setStep(2)}
                  disabled={!preferences.destination.trim()}
                  className="w-full bg-teal-600 hover:bg-teal-700"
                >
                  Next: Preferences
                </Button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-medium mb-3">What interests you?</label>
                  <div className="flex flex-wrap gap-2">
                    {interestOptions.map(interest => (
                      <Badge
                        key={interest}
                        variant={preferences.interests.includes(interest) ? "default" : "outline"}
                        className={`cursor-pointer transition-colors ${
                          preferences.interests.includes(interest)
                            ? 'bg-teal-600 hover:bg-teal-700'
                            : 'hover:bg-gray-100'
                        }`}
                        onClick={() => toggleInterest(interest)}
                      >
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium mb-2">
                      <Zap className="w-4 h-4" />
                      Vehicle Range
                    </label>
                    <div className="space-y-2">
                      <Slider
                        value={[preferences.vehicleRange]}
                        onValueChange={([value]) => setPreferences(prev => ({ ...prev, vehicleRange: value }))}
                        min={150}
                        max={500}
                        step={25}
                        className="w-full"
                      />
                      <div className="text-center text-sm text-gray-600">
                        {preferences.vehicleRange} miles per charge
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium mb-2">
                      <DollarSign className="w-4 h-4" />
                      Budget Level
                    </label>
                    <Select
                      value={preferences.budget}
                      onValueChange={(value: 'low' | 'medium' | 'high') =>
                        setPreferences(prev => ({ ...prev, budget: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Budget-Friendly</SelectItem>
                        <SelectItem value="medium">Moderate</SelectItem>
                        <SelectItem value="high">Luxury</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Accommodation Preference</label>
                  <div className="grid grid-cols-2 gap-3">
                    <Card
                      className={`cursor-pointer transition-colors ${
                        preferences.accommodationType === 'hotel'
                          ? 'border-teal-500 bg-teal-50'
                          : 'border-gray-200'
                      }`}
                      onClick={() => setPreferences(prev => ({ ...prev, accommodationType: 'hotel' }))}
                    >
                      <CardContent className="p-4 text-center">
                        <Hotel className="w-8 h-8 mx-auto mb-2 text-teal-600" />
                        <h3 className="font-medium">Hotels</h3>
                        <p className="text-sm text-gray-600">Comfort & amenities</p>
                      </CardContent>
                    </Card>

                    <Card
                      className={`cursor-pointer transition-colors ${
                        preferences.accommodationType === 'camping'
                          ? 'border-teal-500 bg-teal-50'
                          : 'border-gray-200'
                      }`}
                      onClick={() => setPreferences(prev => ({ ...prev, accommodationType: 'camping' }))}
                    >
                      <CardContent className="p-4 text-center">
                        <Tent className="w-8 h-8 mx-auto mb-2 text-teal-600" />
                        <h3 className="font-medium">Camping</h3>
                        <p className="text-sm text-gray-600">Nature & adventure</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                    Back
                  </Button>
                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating || preferences.interests.length === 0}
                    className="flex-1 bg-teal-600 hover:bg-teal-700"
                  >
                    Create My Adventure ✨
                  </Button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t p-4 flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Step {step} of 2
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
};

export default AIItineraryWizard;