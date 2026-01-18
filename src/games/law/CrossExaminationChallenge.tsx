import { useState } from 'react';
import { MessageCircle, AlertTriangle, Search, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAudio } from '../../contexts/AudioContext';

interface Statement {
  id: string;
  text: string;
  isLie: boolean;
  weakness: string; // The type of evidence/logic that breaks it
}
const WITNESS = {
  name: "Mr. Shifty",
  role: "Key Witness",
  avatar: "😰",
  statements: [
    { id: 's1', text: "I saw the defendant at the bank at 10 PM.", isLie: true, weakness: "Time" },
    { id: 's2', text: "He was wearing a red jacket.", isLie: false, weakness: "None" },
    { id: 's3', text: "I was alone in the park.", isLie: true, weakness: "Location" },
  ]
};

interface CrossExaminationChallengeProps {
  onComplete: (score: number) => void;
}

export function CrossExaminationChallenge({ onComplete }: CrossExaminationChallengeProps) {
  const [currentStatementIndex, setCurrentStatementIndex] = useState(0);
  const [pressure, setPressure] = useState(0); // 0-100
  const [score, setScore] = useState(0);
  const [isWitnessSweating, setIsWitnessSweating] = useState(false);
  const { playSfx } = useAudio();

  const currentStatement = WITNESS.statements[currentStatementIndex];

  const handlePress = (tactic: 'contradiction' | 'doubt' | 'accept') => {
    let effectiveness = 0;
    let message = "";

    if (tactic === 'accept') {
      if (currentStatement.isLie) {
        effectiveness = -10; // Missed a lie
        message = "You let a lie slip by!";
      } else {
        effectiveness = 5; // Correctly accepted truth
        message = "Good judgment.";
      }
    } else if (tactic === 'contradiction') {
      if (currentStatement.isLie) {

        setPressure(prev => Math.min(100, Math.max(0, prev + effectiveness)));
        setScore(prev => prev + Math.max(0, effectiveness));

        setTimeout(() => {
          setIsWitnessSweating(false);
          if (currentStatementIndex < WITNESS.statements.length - 1) {
            setCurrentStatementIndex(prev => prev + 1);
          } else {
            onComplete(score + pressure);
          }
        }, 2000);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 border-4 border-gray-700 min-h-[600px] flex flex-col items-center justify-between relative overflow-hidden">

        {/* Spotlight Effect */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-64 h-full bg-yellow-100 opacity-5 pointer-events-none blur-3xl"></div>

        {/* Pressure Meter */}
        <div className="w-full max-w-md mb-8">
          <div className="flex justify-between text-white mb-2 font-bold uppercase tracking-widest">
            <span>Witness Pressure</span>
            <span className={pressure > 80 ? "text-red-500 animate-pulse" : "text-blue-400"}>{pressure}%</span>
          </div>
          <div className="h-4 bg-gray-700 rounded-full overflow-hidden border border-gray-600">
            <motion.div
              className={`h-full ${pressure > 80 ? 'bg-red-600' : 'bg-blue-500'}`}
              initial={{ width: 0 }}
              animate={{ width: `${pressure}%` }}
            />
          </div>
        </div>

        {/* Witness */}
        <div className="relative">
          <motion.div
            className="text-9xl mb-4 relative z-10"
            animate={isWitnessSweating ? { x: [-5, 5, -5, 5, 0], rotate: [0, -5, 5, 0] } : {}}
            transition={{ duration: 0.5 }}
          >
            {WITNESS.avatar}
          </motion.div>
          {isWitnessSweating && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute -top-4 -right-4 text-4xl"
            >
              💦
            </motion.div>
          )}
          <div className="text-white text-center font-bold text-xl">{WITNESS.name}</div>
          <div className="text-gray-400 text-center text-sm">{WITNESS.role}</div>
        </div>

        {/* Statement Bubble */}
        <div className="relative bg-white rounded-2xl p-6 max-w-2xl w-full my-8 shadow-lg">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-white rotate-45"></div>
          <p className="text-2xl text-center font-serif text-gray-900">"{currentStatement.text}"</p>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-3 gap-6 w-full max-w-3xl">
          <button
            onClick={() => handlePress('accept')}
            className="py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-lg shadow-lg border-b-4 border-green-800 active:border-b-0 active:translate-y-1 transition-all"
          >
            Accept Statement
          </button>
          <button
            onClick={() => handlePress('doubt')}
            className="py-4 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl font-bold text-lg shadow-lg border-b-4 border-yellow-800 active:border-b-0 active:translate-y-1 transition-all"
          >
            Press for Details
          </button>
          <button
            onClick={() => handlePress('contradiction')}
            className="py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-lg shadow-lg border-b-4 border-red-800 active:border-b-0 active:translate-y-1 transition-all"
          >
            OBJECTION! (Contradiction)
          </button>
        </div>
      </div>
    </div>
  );
}
