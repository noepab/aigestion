import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, X, Play } from 'lucide-react';

export interface TourStep {
  target: string; // CSS Selector
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

interface GuidedTourProps {
  steps: TourStep[];
  onComplete?: () => void;
  isOpen?: boolean;
}

export const GuidedTour: React.FC<GuidedTourProps> = ({ steps, onComplete, isOpen: initialOpen = false }) => {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [currentStep, setCurrentStep] = useState(0);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, height: 0 });

  const updateCoords = useCallback(() => {
    const step = steps[currentStep];
    if (!step) return;

    const element = document.querySelector(step.target);
    if (element) {
      const rect = element.getBoundingClientRect();
      setCoords({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height,
      });

      // Scroll into view if needed
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentStep, steps]);

  useEffect(() => {
    if (isOpen) {
      updateCoords();
      window.addEventListener('resize', updateCoords);
      window.addEventListener('scroll', updateCoords);
    }
    return () => {
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords);
    };
  }, [isOpen, updateCoords]);

  if (!isOpen || steps.length === 0) return null;

  const step = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setIsOpen(false);
      onComplete?.();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] pointer-events-none">
        {/* Spotlight Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px]"
          style={{
            clipPath: `polygon(
              0% 0%, 0% 100%,
              ${coords.left}px 100%,
              ${coords.left}px ${coords.top}px,
              ${coords.left + coords.width}px ${coords.top}px,
              ${coords.left + coords.width}px ${coords.top + coords.height}px,
              ${coords.left}px ${coords.top + coords.height}px,
              ${coords.left}px 100%,
              100% 100%, 100% 0%
            )`
          }}
        />

        {/* Tooltip Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          style={{
            position: 'absolute',
            top: coords.top + coords.height + 20,
            left: Math.max(20, Math.min(window.innerWidth - 340, coords.left + coords.width / 2 - 160)),
          }}
          className="w-80 pointer-events-auto bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl shadow-blue-500/10 backdrop-blur-xl"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
                <Play size={16} fill="currentColor" />
              </div>
              <h3 className="text-white font-semibold text-lg">{step.title}</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <p className="text-slate-300 text-sm leading-relaxed mb-6">
            {step.content}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all duration-300 ${i === currentStep ? 'w-4 bg-blue-500' : 'w-1 bg-slate-700'}`}
                />
              ))}
            </div>

            <div className="flex gap-2">
              {currentStep > 0 && (
                <button
                  onClick={handleBack}
                  className="px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all text-sm flex items-center gap-1"
                >
                  <ChevronLeft size={16} /> Back
                </button>
              )}
              <button
                onClick={handleNext}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-1 shadow-lg shadow-blue-600/20"
              >
                {currentStep === steps.length - 1 ? 'Finish' : 'Next'} <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export const useGuidedTour = () => {
  const [isOpen, setIsOpen] = useState(false);
  const startTour = () => setIsOpen(true);
  const endTour = () => setIsOpen(false);

  return { isOpen, startTour, endTour };
};
