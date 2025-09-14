import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type WizardStage = 'analyzing' | 'routing' | 'stops' | 'accommodation' | 'finalizing' | 'complete';

interface WizardAlertProps {
  isVisible: boolean;
  stage: WizardStage;
  message: string;
  showDemo?: boolean;
  onDemoStageChange?: (stage: WizardStage) => void;
}

const WizardAlert = ({ isVisible, stage, message, showDemo, onDemoStageChange }: WizardAlertProps) => {
  const [currentEmoji, setCurrentEmoji] = useState(0);
  
  const emojiStages = {
    analyzing: ['🔍', '🤔', '💭', '📊'],
    routing: ['🗺️', '📍', '🚗', '⚡'],
    stops: ['🏕️', '⛽', '🍽️', '🏨'],
    accommodation: ['🏨', '🏕️', '⚡', '🛏️'],
    finalizing: ['✨', '🎉', '🌟', '💫'],
    complete: ['🎉', '✅', '🚀', '🌟']
  };
  
  const currentEmojis = emojiStages[stage] || emojiStages.analyzing;

  useEffect(() => {
    if (!isVisible) return;
    
    const interval = setInterval(() => {
      setCurrentEmoji(prev => (prev + 1) % currentEmojis.length);
    }, 800);

    return () => clearInterval(interval);
  }, [isVisible, currentEmojis.length]);

  const stageDescriptions = {
    analyzing: "Analyzing your preferences and building the perfect adventure...",
    routing: "Calculating EV-optimized routes with scenic detours...",
    stops: "Finding charging stations and points of interest...",
    accommodation: "Locating EV-friendly hotels and camping sites...",
    finalizing: "Putting the finishing touches on your personalized tour...",
    complete: "Your amazing EV adventure is ready to explore!"
  };

  const demoStages: WizardStage[] = ['analyzing', 'routing', 'stops', 'accommodation', 'finalizing', 'complete'];
  
  const handleDemoNext = () => {
    if (!onDemoStageChange) return;
    const currentIndex = demoStages.indexOf(stage);
    const nextIndex = (currentIndex + 1) % demoStages.length;
    onDemoStageChange(demoStages[nextIndex]);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -20 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative mx-4 max-w-md w-full"
          >
            {/* Demo controls */}
            {showDemo && onDemoStageChange && (
              <div className="absolute -top-16 right-0 z-10">
                <Button
                  onClick={handleDemoNext}
                  size="sm"
                  variant="outline"
                  className="bg-white/90 hover:bg-white text-sm font-medium shadow-lg"
                >
                  <Play className="w-3 h-3 mr-1" />
                  Next Stage
                </Button>
                <div className="text-xs text-white/80 mt-1 text-right">
                  {stage} ({demoStages.indexOf(stage) + 1}/{demoStages.length})
                </div>
              </div>
            )}

            {/* Anime-style background with gradient */}
            <div className="relative bg-gradient-to-br from-cyan-400 via-teal-500 to-emerald-600 rounded-3xl p-8 shadow-2xl overflow-hidden">
              {/* Animated background elements */}
              <div className="absolute inset-0">
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 180, 360],
                    opacity: [0.1, 0.3, 0.1]
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-4 right-4 w-16 h-16 bg-white/20 rounded-full"
                />
                <motion.div
                  animate={{ 
                    scale: [1, 1.5, 1],
                    rotate: [360, 180, 0],
                    opacity: [0.1, 0.2, 0.1]
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute bottom-6 left-6 w-12 h-12 bg-yellow-300/20 rounded-full"
                />
                <motion.div
                  animate={{ 
                    x: [-10, 10, -10],
                    y: [-5, 5, -5],
                    opacity: [0.2, 0.4, 0.2]
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-1/2 left-1/2 w-8 h-8 bg-pink-300/30 rounded-full transform -translate-x-1/2 -translate-y-1/2"
                />
              </div>

              {/* Main content */}
              <div className="relative z-10 text-center">
                {/* Animated emoji */}
                <motion.div
                  key={currentEmoji}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.6, ease: "backOut" }}
                  className="text-6xl mb-4"
                >
                  {currentEmojis[currentEmoji]}
                </motion.div>

                {/* Stage title */}
                <motion.h3
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-2xl font-bold text-white mb-2 drop-shadow-lg"
                >
                  Creating Your Adventure
                </motion.h3>

                {/* Stage description */}
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-white/90 text-lg mb-4 leading-relaxed drop-shadow"
                >
                  {stageDescriptions[stage]}
                </motion.p>

                {/* Custom message */}
                {message && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-white/80 text-sm italic drop-shadow"
                  >
                    {message}
                  </motion.p>
                )}

                {/* Animated progress dots */}
                <div className="flex justify-center space-x-2 mt-6">
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.5, 1, 0.5]
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.2
                      }}
                      className="w-3 h-3 bg-white/70 rounded-full"
                    />
                  ))}
                </div>
              </div>

              {/* Shimmer effect */}
              <motion.div
                animate={{ x: [-100, 400] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: 1 }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                style={{ width: '100px' }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WizardAlert;