import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudio } from '../../contexts/AudioContext';

interface Argument {
  id: string;
  text: string;
  type: 'opening' | 'evidence' | 'conclusion';
  effectiveness: number;
}

const CASE_DATA = {
  title: "State v. Johnson",
  description: "Theft of a rare diamond. You are the defense attorney.",
  opponent: "Prosecutor Miles",
  opponentAvatar: "👨‍⚖️",
  playerAvatar: "🧑‍⚖️",
  judgeAvatar: "⚖️",
  segments: [
    {
      id: 's1',
      context: "The prosecution claims your client was seen at the scene.",
      options: [
        { id: 'a1', text: "My client has an alibi for that time!", type: 'evidence', effectiveness: 90 },
        { id: 'a2', text: "Maybe he was just taking a walk?", type: 'opening', effectiveness: 20 },
        { id: 'a3', text: "The witness wasn't wearing glasses!", type: 'evidence', effectiveness: 70 },
      ]
    },
    {
      id: 's2',
      context: "They present a blurry security photo.",
      options: [
        { id: 'a4', text: "That could be anyone!", type: 'evidence', effectiveness: 60 },
        { id: 'a5', text: "OBJECTION! The photo is inadmissible!", type: 'evidence', effectiveness: 100 },
        { id: 'a6', text: "It looks a bit like him...", type: 'opening', effectiveness: -10 },
      ]
    }
  ]
};

interface CourtroomArgumentsChallengeProps {
  onComplete: (score: number) => void;
}

export function CourtroomArgumentsChallenge({ onComplete }: CourtroomArgumentsChallengeProps) {
  const [segmentIndex, setSegmentIndex] = useState(0);
  const [score, setScore] = useState(50); // Start at 50% credibility
  const [showObjection, setShowObjection] = useState(false);
  const [dialogue, setDialogue] = useState<string>(CASE_DATA.segments[0].context);
  const [speaker, setSpeaker] = useState<'prosecutor' | 'defense' | 'judge'>('prosecutor');
  const { playSfx } = useAudio();

  const currentSegment = CASE_DATA.segments[segmentIndex];

  const handleArgument = (argument: Argument) => {
    // Defense speaks
    setSpeaker('defense');
    setDialogue(argument.text);

    // Calculate impact
    const impact = (argument.effectiveness - 50) / 2;
    const newScore = Math.min(100, Math.max(0, score + impact));
    setScore(newScore);

    // Special effect for high effectiveness
    if (argument.effectiveness >= 90) {
      playSfx('notification'); // Ideally "Objection!" sound
      setShowObjection(true);
      setTimeout(() => setShowObjection(false), 1000);
    } else {
      playSfx('click');
    }

    // Judge reacts / Next segment
    setTimeout(() => {
      if (segmentIndex < CASE_DATA.segments.length - 1) {
        setSegmentIndex(prev => prev + 1);
        setSpeaker('prosecutor');
        setDialogue(CASE_DATA.segments[segmentIndex + 1].context);
      } else {
        setSpeaker('judge');
        setDialogue(newScore > 60 ? "Not Guilty!" : "Guilty!");
        setTimeout(() => onComplete(newScore), 2000);
      }
    }, 2000);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border-4 border-gray-800 relative h-[600px]">

        {/* Background - Courtroom */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-800 to-gray-900 opacity-50"></div>

        {/* Characters */}
        <div className="absolute top-20 left-10 text-9xl transform scale-x-[-1] transition-all duration-500" style={{ opacity: speaker === 'defense' ? 1 : 0.5, transform: `scale(${speaker === 'defense' ? 1.1 : 1}) scaleX(-1)` }}>
          {CASE_DATA.playerAvatar}
        </div>
        <div className="absolute top-20 right-10 text-9xl transition-all duration-500" style={{ opacity: speaker === 'prosecutor' ? 1 : 0.5, transform: `scale(${speaker === 'prosecutor' ? 1.1 : 1})` }}>
          {CASE_DATA.opponentAvatar}
        </div>
        <div className="absolute top-10 left-1/2 transform -translate-x-1/2 text-6xl opacity-80">
          {CASE_DATA.judgeAvatar}
        </div>

        {/* Objection Overlay */}
        <AnimatePresence>
          {showObjection && (
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1.5, rotate: 0 }}
              exit={{ scale: 2, opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none"
            >
              <div className="bg-white text-red-600 font-black text-9xl px-8 py-4 border-8 border-red-600 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] transform -rotate-12">
                OBJECTION!
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Credibility Meter */}
        <div className="absolute top-4 left-4 right-4 h-6 bg-gray-800 rounded-full border-2 border-gray-600 overflow-hidden">
          <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-white z-10"></div>
          <motion.div
            className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
            initial={{ width: "50%" }}
            animate={{ width: `${score}%` }}
            transition={{ type: "spring", stiffness: 100 }}
          />
        </div>

        {/* Dialogue Box */}
        <div className="absolute bottom-40 left-4 right-4 bg-black/80 border-4 border-white rounded-xl p-6 min-h-[120px]">
          <div className="text-yellow-400 font-bold mb-2 uppercase tracking-wider">
            {speaker === 'defense' ? 'Defense Attorney' : speaker === 'prosecutor' ? 'Prosecutor' : 'Judge'}
          </div>
          <div className="text-white text-xl font-medium typing-effect">
            {dialogue}
          </div>
        </div>

        {/* Options Panel */}
        <div className="absolute bottom-4 left-4 right-4 grid grid-cols-3 gap-4">
          {speaker !== 'judge' && currentSegment.options.map(option => (
            <button
              key={option.id}
              onClick={() => handleArgument(option as any)}
              disabled={speaker !== 'defense' && speaker !== 'prosecutor'} // Only clickable when it's player's turn logic (simplified here)
              className="bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-xl border-b-4 border-blue-800 active:border-b-0 active:translate-y-1 transition-all font-bold text-lg shadow-lg"
            >
              {option.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
