import { useState } from 'react';
import { Calendar, CheckCircle2, FileText, TrendingUp } from 'lucide-react';
import { motion, Reorder } from 'framer-motion';

interface Treatment {
  id: string;
  name: string;
  type: 'medication' | 'therapy' | 'lifestyle';
  duration: number; // weeks
  icon: string;
}

interface Case {
  id: string;
  patientName: string;
  condition: string;
  description: string;
  labResults: { name: string; value: number; unit: string; normalRange: string }[];
  availableTreatments: Treatment[];
  correctSequence: string[]; // IDs of treatments in order
}

const CASES: Case[] = [
  {
    id: 'c1',
    patientName: 'David Kim',
    condition: 'Type 2 Diabetes',
    description: 'Patient presents with fatigue and increased thirst. Needs a comprehensive management plan.',
    labResults: [
      { name: 'HbA1c', value: 8.5, unit: '%', normalRange: '< 5.7%' },
      { name: 'Fasting Glucose', value: 180, unit: 'mg/dL', normalRange: '70-100' },
    ],
    availableTreatments: [
      { id: 't1', name: 'Metformin', type: 'medication', duration: 12, icon: '💊' },
      { id: 't2', name: 'Dietary Changes', type: 'lifestyle', duration: 12, icon: '🥗' },
      { id: 't3', name: 'Insulin', type: 'medication', duration: 4, icon: '💉' },
      { id: 't4', name: 'Exercise Plan', type: 'lifestyle', duration: 12, icon: '🏃' },
    ],
    correctSequence: ['t2', 't4', 't1'], // Diet/Exercise first, then Metformin
  },
];

interface TreatmentPlannerChallengeProps {
  onComplete: (score: number) => void;
}

export function TreatmentPlannerChallenge({ onComplete }: TreatmentPlannerChallengeProps) {
  const [currentCaseIndex, setCurrentCaseIndex] = useState(0);
  const [plan, setPlan] = useState<Treatment[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  const currentCase = CASES[currentCaseIndex];

  const handleAddToPlan = (treatment: Treatment) => {
    if (!plan.find(t => t.id === treatment.id)) {
      setPlan([...plan, treatment]);
    }
  };

  const handleRemoveFromPlan = (id: string) => {
    setPlan(plan.filter(t => t.id !== id));
  };

  const handleSubmit = () => {
    // Simple scoring logic based on correct sequence presence and order
    let caseScore = 0;
    const correctIds = currentCase.correctSequence;

    // Check if all required treatments are present
    const hasAllRequired = correctIds.every(id => plan.find(t => t.id === id));
    if (hasAllRequired) caseScore += 50;

    // Check order (simplified: just checking if lifestyle comes before/with meds)
    const lifestyleIndex = plan.findIndex(t => t.type === 'lifestyle');
    const medIndex = plan.findIndex(t => t.type === 'medication');

    if (lifestyleIndex !== -1 && medIndex !== -1 && lifestyleIndex <= medIndex) {
      caseScore += 30;
    }

    // Penalty for dangerous/unnecessary treatments (not implemented in this simple data set but good for logic)
    if (plan.length > correctIds.length + 1) caseScore -= 10;

    setScore(Math.max(0, Math.min(100, caseScore + 20))); // Base points
    setShowResults(true);

    setTimeout(() => {
      onComplete(caseScore + 20);
    }, 3000);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="w-8 h-8 text-blue-600" />
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Treatment Planner</h3>
            <p className="text-gray-600">{currentCase.patientName} - {currentCase.condition}</p>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Patient Data & Labs */}
          <div className="col-span-4 space-y-6">
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
              <h4 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" /> Patient History
              </h4>
              <p className="text-gray-700 leading-relaxed mb-4">{currentCase.description}</p>

              <h5 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Lab Results
              </h5>
              <div className="space-y-2">
                {currentCase.labResults.map((lab, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-lg shadow-sm flex justify-between items-center">
                    <span className="font-medium text-gray-700">{lab.name}</span>
                    <div className="text-right">
                      <div className="font-bold text-red-600">{lab.value} {lab.unit}</div>
                      <div className="text-xs text-gray-500">Normal: {lab.normalRange}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h4 className="font-bold text-gray-900 mb-3">Available Treatments</h4>
              <div className="space-y-2">
                {currentCase.availableTreatments.map(treatment => (
                  <button
                    key={treatment.id}
                    onClick={() => handleAddToPlan(treatment)}
                    disabled={plan.some(t => t.id === treatment.id)}
                    className="w-full p-3 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all flex items-center gap-3 text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="text-2xl">{treatment.icon}</span>
                    <div>
                      <div className="font-bold text-gray-900">{treatment.name}</div>
                      <div className="text-xs text-gray-500 capitalize">{treatment.type} • {treatment.duration} weeks</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Timeline Editor */}
          <div className="col-span-8">
            <div className="bg-gray-100 rounded-xl p-6 min-h-[500px] border-2 border-dashed border-gray-300">
              <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" /> Treatment Timeline (Drag to Reorder)
              </h4>

              <Reorder.Group axis="y" values={plan} onReorder={setPlan} className="space-y-3">
                {plan.length === 0 && (
                  <div className="text-center text-gray-400 py-12">
                    Add treatments from the left panel to build a plan.
                  </div>
                )}
                {plan.map(item => (
                  <Reorder.Item key={item.id} value={item}>
                    <div className="bg-white p-4 rounded-xl shadow-md border border-gray-200 flex items-center gap-4 cursor-grab active:cursor-grabbing">
                      <span className="text-3xl">{item.icon}</span>
                      <div className="flex-1">
                        <div className="font-bold text-gray-900 text-lg">{item.name}</div>
                        <div className="text-sm text-gray-500 capitalize">{item.type}</div>
                      </div>
                      <div className="text-right mr-4">
                        <div className="font-bold text-blue-600">{item.duration} Weeks</div>
                        <div className="text-xs text-gray-400">Duration</div>
                      </div>
                      <button
                        onClick={() => handleRemoveFromPlan(item.id)}
                        className="text-red-400 hover:text-red-600 p-2"
                      >
                        ✕
                      </button>
                    </div>
                  </Reorder.Item>
                ))}
              </Reorder.Group>

              {plan.length > 0 && (
                <div className="mt-8 flex justify-end">
                  <button
                    onClick={handleSubmit}
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-colors flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" /> Submit Plan
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results Overlay */}
        {showResults && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl"
            >
              <div className="text-6xl mb-4">
                {score >= 80 ? '🌟' : score >= 60 ? '👍' : '⚠️'}
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">
                {score >= 80 ? 'Excellent Plan!' : 'Plan Submitted'}
              </h3>
              <div className="text-5xl font-bold text-blue-600 mb-6">{score}%</div>
              <p className="text-gray-600 mb-6">
                {score >= 80
                  ? 'Your treatment sequence is optimal for patient recovery.'
                  : 'Review the guidelines for diabetes management ordering.'}
              </p>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
