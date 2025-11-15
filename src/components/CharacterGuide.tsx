import { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';

interface CharacterGuideProps {
  message: string;
  onClose?: () => void;
  autoClose?: boolean;
  position?: 'bottom-right' | 'center';
}

export function CharacterGuide({
  message,
  onClose,
  autoClose = false,
  position = 'bottom-right'
}: CharacterGuideProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 600);
    return () => clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [autoClose, onClose]);

  if (!isVisible) return null;

  const positionClasses = position === 'center'
    ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
    : 'bottom-8 right-8';

  return (
    <div className={`fixed ${positionClasses} z-50 max-w-md animate-bounce-in`}>
      <div className="relative">
        <div className="absolute -top-12 -left-12 w-32 h-32 animate-float">
          <div className="relative w-full h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full blur-xl opacity-50" />

            <svg viewBox="0 0 100 100" className="relative w-full h-full drop-shadow-2xl">
              <circle cx="50" cy="40" r="30" fill="#F59E0B" />

              <circle cx="42" cy="35" r="4" fill="#1F2937" />
              <circle cx="58" cy="35" r="4" fill="#1F2937" />
              <circle cx="43" cy="36" r="1.5" fill="white" />
              <circle cx="59" cy="36" r="1.5" fill="white" />

              <path
                d="M 40 45 Q 50 50 60 45"
                stroke="#1F2937"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
              />

              <ellipse cx="35" cy="42" rx="3" ry="4" fill="#F59E0B" opacity="0.6" />
              <ellipse cx="65" cy="42" rx="3" ry="4" fill="#F59E0B" opacity="0.6" />

              <path
                d="M 30 25 Q 35 20 40 25"
                stroke="#92400E"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M 60 25 Q 65 20 70 25"
                stroke="#92400E"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
              />

              <path
                d="M 45 55 L 40 75 L 45 74 L 50 78 L 55 74 L 60 75 L 55 55"
                fill="#DC2626"
                stroke="#991B1B"
                strokeWidth="1"
              />

              <rect x="40" y="75" width="20" height="15" rx="2" fill="#3B82F6" />
              <line x1="45" y1="75" x2="45" y2="90" stroke="#1E40AF" strokeWidth="1" />
              <line x1="55" y1="75" x2="55" y2="90" stroke="#1E40AF" strokeWidth="1" />

              <ellipse cx="48" cy="58" rx="1" ry="1.5" fill="#FCD34D" />
              <ellipse cx="52" cy="58" rx="1" ry="1.5" fill="#FCD34D" />
            </svg>
          </div>
        </div>

        <div className={`ml-24 bg-white rounded-2xl shadow-2xl p-6 border-4 border-amber-400 relative ${
          isAnimating ? 'animate-wiggle' : ''
        }`}>
          {onClose && (
            <button
              onClick={() => {
                setIsVisible(false);
                onClose();
              }}
              className="absolute -top-2 -right-2 p-1 bg-amber-400 rounded-full hover:bg-amber-500 transition-colors shadow-lg"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          )}

          <div className="flex items-start gap-3">
            <Sparkles className="w-6 h-6 text-amber-500 flex-shrink-0 mt-1" />
            <div>
              <div className="font-bold text-amber-600 mb-1">Quinn the Guide</div>
              <p className="text-gray-700 leading-relaxed">{message}</p>
            </div>
          </div>

          <div className="absolute -bottom-3 left-8 w-6 h-6 bg-white border-b-4 border-r-4 border-amber-400 transform rotate-45" />
        </div>
      </div>
    </div>
  );
}
