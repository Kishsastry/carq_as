import { useState, useEffect } from 'react';
import { Users, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudio } from '../../contexts/AudioContext';

interface Question {
  id: string;
  text: string;
  type: 'hard' | 'soft' | 'fun';
  impact: number; // Effect on audience interest
}

const GUEST = {
  name: "Senator Smith",
  role: "Politician",
  avatar: "👔",
  topic: "New Education Bill"
};

const QUESTIONS: Question[] = [
  { id: 'q1', text: "What inspired this bill?", type: 'soft', impact: 10 },
  { id: 'q2', text: "Critics say it costs too much. Response?", type: 'hard', impact: 25 },
  { id: 'q3', text: "What's your favorite color?", type: 'fun', impact: -15 }, // Boring question
  { id: 'q4', text: "How will this affect teachers?", type: 'soft', impact: 15 },
  { id: 'q5', text: "Is it true you haven't read it?", type: 'hard', impact: 40 },
];

interface InterviewMasterChallengeProps {
  onComplete: (score: number) => void;
}

export function InterviewMasterChallenge({ onComplete }: InterviewMasterChallengeProps) {
  const [audienceInterest, setInterest] = useState(50);
  const [questionCount, setQuestionCount] = useState(0);
  const [isLive, setIsLive] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [interestHistory, setInterestHistory] = useState<number[]>([50]);
  const { playSfx } = useAudio();

  // Simulate natural interest decay
  useEffect(() => {
    if (!isLive) return;
    const timer = setInterval(() => {
      setInterest(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [isLive]);

  // Update history for graph
  useEffect(() => {
    setInterestHistory(prev => [...prev.slice(-20), audienceInterest]);
  }, [audienceInterest]);

  const handleAsk = (question: Question) => {
    playSfx('click');
    setCurrentQuestion(question);

    // Immediate impact
    setInterest(prev => Math.min(100, Math.max(0, prev + question.impact)));

    setQuestionCount(prev => prev + 1);

    if (questionCount >= 4) {
      setIsLive(false);
      setTimeout(() => onComplete(audienceInterest), 2000);
    } else {
      setTimeout(() => setCurrentQuestion(null), 2000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="grid grid-cols-12 gap-8">

        {/* TV Monitor / Live Feed */}
        <div className="col-span-8">
          <div className="bg-black rounded-3xl overflow-hidden shadow-2xl relative aspect-video border-8 border-gray-800">
            {/* Studio Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-black">
              {/* Studio Lights */}
              <div className="absolute top-0 left-1/4 w-32 h-32 bg-blue-500 opacity-20 blur-3xl rounded-full"></div>
              <div className="absolute top-0 right-1/4 w-32 h-32 bg-purple-500 opacity-20 blur-3xl rounded-full"></div>
            </div>

            {/* Characters */}
            <div className="absolute bottom-0 left-20 w-48 h-64 flex flex-col items-center justify-end">
              <div className="text-9xl">🎤</div>
              <div className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-bold mb-4">YOU</div>
            </div>

            <div className="absolute bottom-0 right-20 w-48 h-64 flex flex-col items-center justify-end">
              <div className="text-9xl">{GUEST.avatar}</div>
              <div className="bg-gray-600 text-white px-4 py-1 rounded-full text-sm font-bold mb-4">{GUEST.name}</div>
            </div>

            {/* Dialogue Overlay */}
            <AnimatePresence>
              {currentQuestion && (
                <motion.div
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 50, opacity: 0 }}
                  className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm px-8 py-4 rounded-2xl shadow-lg max-w-2xl text-center"
                >
                  <p className="text-xl font-bold text-gray-900">"{currentQuestion.text}"</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Live Overlay */}
            <div className="absolute top-8 left-8 flex items-center gap-4">
              <div className="bg-red-600 text-white px-3 py-1 rounded font-bold text-xs animate-pulse flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full"></div> LIVE
              </div>
              <div className="text-white/80 font-mono text-sm">CAM 1</div>
            </div>
          </div>
        </div>

        {/* Control Room */}
        <div className="col-span-4 space-y-6">
          {/* Audience Graph */}
          <div className="bg-gray-900 rounded-2xl p-6 shadow-lg border border-gray-800">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-green-500" /> Audience Interest
            </h3>
            <div className="h-32 flex items-end gap-1">
              {interestHistory.map((val, i) => (
                <div
                  key={i}
                  className="flex-1 bg-green-500 rounded-t-sm transition-all duration-300"
                  style={{ height: `${val}%`, opacity: (i + 1) / interestHistory.length }}
                ></div>
              ))}
            </div>
            <div className="mt-2 text-right text-2xl font-bold text-green-500">{audienceInterest}%</div>
          </div>

          {/* Question Bank */}
          <div className="bg-white rounded-2xl p-6 shadow-lg h-[300px] overflow-y-auto">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" /> Questions
            </h3>
            <div className="space-y-3">
              {QUESTIONS.map(q => (
                <button
                  key={q.id}
                  onClick={() => handleAsk(q)}
                  disabled={!!currentQuestion || !isLive}
                  className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 hover:border-blue-400 transition-colors text-sm group"
                >
                  <div className="font-bold text-gray-700 mb-1 group-hover:text-blue-600">{q.text}</div>
                  <div className={`text-xs px-2 py-0.5 rounded-full inline-block ${q.type === 'hard' ? 'bg-red-100 text-red-700' :
                    q.type === 'soft' ? 'bg-green-100 text-green-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                    {q.type.toUpperCase()}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
