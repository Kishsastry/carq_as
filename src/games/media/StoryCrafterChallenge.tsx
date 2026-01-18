import { useState } from 'react';
import { Layout, Image as ImageIcon, Type, Printer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudio } from '../../contexts/AudioContext';

interface StoryElement {
  id: string;
  type: 'headline' | 'image' | 'text';
  content: string;
  size: 'small' | 'medium' | 'large';
  category: 'politics' | 'sports' | 'tech';
}

const ELEMENTS: StoryElement[] = [
  { id: 'e1', type: 'headline', content: "MAYOR ANNOUNCES NEW PARK", size: 'large', category: 'politics' },
  { id: 'e2', type: 'image', content: "🌳", size: 'medium', category: 'politics' },
  { id: 'e3', type: 'text', content: "Local residents celebrate the green initiative...", size: 'small', category: 'politics' },
  { id: 'e4', type: 'headline', content: "LOCAL TEAM WINS CHAMPIONSHIP", size: 'large', category: 'sports' },
  { id: 'e5', type: 'image', content: "🏆", size: 'medium', category: 'sports' },
  { id: 'e6', type: 'text', content: "A stunning victory in overtime...", size: 'small', category: 'sports' },
];

interface StoryCrafterChallengeProps {
  onComplete: (score: number) => void;
}

export function StoryCrafterChallenge({ onComplete }: StoryCrafterChallengeProps) {
  const [layout, setLayout] = useState<(StoryElement | null)[]>(Array(4).fill(null)); // 2x2 grid for simplicity
  const [isPrinting, setIsPrinting] = useState(false);
  const [score, setScore] = useState(0);
  const { playSfx } = useAudio();

  const handleDragStart = (e: React.DragEvent, element: StoryElement) => {
    e.dataTransfer.setData('elementId', element.id);
  };

  const handleDrop = (index: number, e: React.DragEvent) => {
    e.preventDefault();
    const elementId = e.dataTransfer.getData('elementId');
    const element = ELEMENTS.find(el => el.id === elementId);

    if (element) {
      playSfx('click');
      const newLayout = [...layout];
      newLayout[index] = element;
      setLayout(newLayout);
    }
  };

  const handlePublish = () => {
    // Scoring: Check for consistency (same category) and completeness
    const filledSlots = layout.filter(Boolean);
    if (filledSlots.length === 0) return;

    const categories = filledSlots.map(el => el!.category);
    const uniqueCategories = new Set(categories);

    let calculatedScore = 0;

    // Bonus for thematic consistency
    if (uniqueCategories.size === 1) calculatedScore += 50;

    // Points for filling slots
    calculatedScore += filledSlots.length * 12.5;

    setScore(calculatedScore);
    setIsPrinting(true);
    playSfx('success'); // Printing sound would be better

    setTimeout(() => {
      onComplete(calculatedScore);
    }, 3000);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-gray-100 rounded-2xl shadow-xl p-8 min-h-[600px] flex gap-8">

        {/* Sidebar - Assets */}
        <div className="w-1/3 bg-white rounded-xl shadow-sm p-6 overflow-y-auto">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Layout className="w-5 h-5" /> Assets
          </h3>
          <div className="space-y-4">
            {ELEMENTS.map(element => (
              <div
                key={element.id}
                draggable
                onDragStart={(e) => handleDragStart(e, element)}
                className="p-4 border-2 border-gray-200 rounded-lg cursor-grab active:cursor-grabbing hover:border-blue-400 hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2 text-xs font-bold text-gray-500 uppercase">
                  {element.type === 'headline' && <Type className="w-3 h-3" />}
                  {element.type === 'image' && <ImageIcon className="w-3 h-3" />}
                  {element.type === 'text' && <Layout className="w-3 h-3" />}
                  {element.type} • {element.category}
                </div>
                <div className="font-serif text-gray-900">
                  {element.type === 'image' ? <span className="text-4xl">{element.content}</span> : element.content}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Editor - Newspaper Layout */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 bg-white shadow-2xl rounded-sm p-8 border border-gray-300 relative overflow-hidden">
            {/* Newspaper Header */}
            <div className="text-center border-b-4 border-black pb-4 mb-8">
              <h1 className="font-serif text-5xl font-black uppercase tracking-tight">The Daily Chronicle</h1>
              <div className="flex justify-between text-sm font-serif mt-2 border-t border-black pt-1">
                <span>Vol. CXXI</span>
                <span>{new Date().toLocaleDateString()}</span>
                <span>$1.00</span>
              </div>
            </div>

            {/* Grid Layout */}
            <div className="grid grid-cols-2 gap-4 h-[400px]">
              {layout.map((slot, index) => (
                <div
                  key={index}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(index, e)}
                  className={`border-2 border-dashed rounded-lg flex items-center justify-center p-4 transition-all ${slot ? 'border-transparent bg-gray-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                    }`}
                >
                  {slot ? (
                    <div className="text-center w-full">
                      {slot.type === 'headline' && <h2 className="font-serif font-bold text-2xl leading-tight">{slot.content}</h2>}
                      {slot.type === 'image' && <div className="text-6xl">{slot.content}</div>}
                      {slot.type === 'text' && <p className="font-serif text-sm text-justify columns-2">{slot.content} {slot.content}</p>}
                    </div>
                  ) : (
                    <div className="text-gray-300 font-bold text-sm uppercase">Drop Element Here</div>
                  )}
                </div>
              ))}
            </div>

            {/* Printing Animation Overlay */}
            <AnimatePresence>
              {isPrinting && (
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  className="absolute inset-0 bg-white z-50 flex flex-col items-center justify-center"
                >
                  <motion.div
                    animate={{ y: [0, -20, 0] }}
                    transition={{ repeat: Infinity, duration: 0.5 }}
                    className="mb-8"
                  >
                    <Printer className="w-24 h-24 text-gray-800" />
                  </motion.div>
                  <h2 className="text-3xl font-black font-serif uppercase mb-4">Publishing...</h2>
                  <div className="text-xl font-bold text-green-600">Score: {score}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handlePublish}
              className="px-8 py-3 bg-black text-white font-bold rounded-lg shadow-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
            >
              <Printer className="w-5 h-5" /> Publish Edition
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
