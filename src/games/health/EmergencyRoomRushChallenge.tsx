import { useState, useEffect } from 'react';
import { AlertCircle, Clock, Activity, User, HeartPulse } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudio } from '../../contexts/AudioContext';

interface Patient {
  id: string;
  name: string;
  condition: string;
  severity: 'critical' | 'urgent' | 'stable';
  timeLeft: number; // Seconds before condition worsens
  avatar: string;
}

const INITIAL_PATIENTS: Patient[] = [
  { id: 'p1', name: 'John Doe', condition: 'Chest Pain', severity: 'critical', timeLeft: 20, avatar: '👴' },
  { id: 'p2', name: 'Jane Smith', condition: 'Broken Arm', severity: 'urgent', timeLeft: 45, avatar: '👩' },
  { id: 'p3', name: 'Bob Wilson', condition: 'Flu Symptoms', severity: 'stable', timeLeft: 60, avatar: '👨' },
];

interface Bed {
  id: string;
  type: 'trauma' | 'exam' | 'triage';
  patient: Patient | null;
}

interface EmergencyRoomRushChallengeProps {
  onComplete: (score: number) => void;
}

export function EmergencyRoomRushChallenge({ onComplete }: EmergencyRoomRushChallengeProps) {
  const [waitingRoom, setWaitingRoom] = useState<Patient[]>(INITIAL_PATIENTS);
  const [beds, setBeds] = useState<Bed[]>([
    { id: 'b1', type: 'trauma', patient: null },
    { id: 'b2', type: 'exam', patient: null },
    { id: 'b3', type: 'triage', patient: null },
  ]);
  const [score, setScore] = useState(0);
  const [draggedPatient, setDraggedPatient] = useState<Patient | null>(null);
  const [gameTime, setGameTime] = useState(60);
  const [isGameOver, setIsGameOver] = useState(false);
  const { playSfx } = useAudio();

  useEffect(() => {
    if (isGameOver) return;

    const timer = setInterval(() => {
      setGameTime(prev => {
        if (prev <= 1) {
          setIsGameOver(true);
          onComplete(score);
          return 0;
        }
        return prev - 1;
      });

      // Update patient timers
      setWaitingRoom(prev => prev.map(p => ({
        ...p,
        timeLeft: Math.max(0, p.timeLeft - 1)
      })));

      // Randomly add new patients
      if (Math.random() < 0.1 && waitingRoom.length < 5) {
        const newPatient: Patient = {
          id: `p${Date.now()}`,
          name: 'New Patient',
          condition: 'Unknown',
          severity: Math.random() < 0.3 ? 'critical' : 'stable',
          timeLeft: 30,
          avatar: '👤'
        };
        setWaitingRoom(prev => [...prev, newPatient]);
        playSfx('notification');
      }

    }, 1000);

    return () => clearInterval(timer);
  }, [isGameOver, waitingRoom.length, score, onComplete, playSfx]);

  const handleDragStart = (patient: Patient) => {
    setDraggedPatient(patient);
  };

  const handleDrop = (bedId: string) => {
    if (!draggedPatient) return;

    const bed = beds.find(b => b.id === bedId);
    if (bed && !bed.patient) {
      // Validate placement
      let points = 0;
      if (draggedPatient.severity === 'critical' && bed.type === 'trauma') points = 20;
      else if (draggedPatient.severity === 'urgent' && bed.type === 'exam') points = 15;
      else if (draggedPatient.severity === 'stable' && bed.type === 'triage') points = 10;
      else points = 5; // Suboptimal placement

      setScore(prev => prev + points);
      playSfx(points > 10 ? 'success' : 'click');

      // Move patient to bed
      setBeds(prev => prev.map(b => b.id === bedId ? { ...b, patient: draggedPatient } : b));
      setWaitingRoom(prev => prev.filter(p => p.id !== draggedPatient.id));

      // Auto-discharge after treatment time
      setTimeout(() => {
        setBeds(prev => prev.map(b => b.id === bedId ? { ...b, patient: null } : b));
        setScore(prev => prev + 10); // Discharge bonus
      }, 3000);
    }
    setDraggedPatient(null);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-8 h-8 text-red-600" />
            <h3 className="text-2xl font-bold text-gray-900">ER Rush</h3>
          </div>
          <div className="flex gap-6 text-xl font-bold">
            <div className="flex items-center gap-2 text-gray-700">
              <Clock className="w-6 h-6" /> {gameTime}s
            </div>
            <div className="flex items-center gap-2 text-green-600">
              <Activity className="w-6 h-6" /> {score} pts
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6 h-[600px]">
          {/* Waiting Room */}
          <div className="col-span-4 bg-gray-100 rounded-xl p-4 overflow-y-auto border-2 border-gray-300">
            <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
              <User className="w-5 h-5" /> Waiting Room ({waitingRoom.length})
            </h4>
            <div className="space-y-3">
              <AnimatePresence>
                {waitingRoom.map(patient => (
                  <motion.div
                    key={patient.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    draggable
                    onDragStart={() => handleDragStart(patient)}
                    className={`p-4 rounded-lg shadow-sm cursor-grab active:cursor-grabbing border-l-4 ${patient.severity === 'critical' ? 'bg-red-50 border-red-500' :
                        patient.severity === 'urgent' ? 'bg-yellow-50 border-yellow-500' :
                          'bg-green-50 border-green-500'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-2xl">{patient.avatar}</span>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${patient.timeLeft < 10 ? 'bg-red-200 text-red-800 animate-pulse' : 'bg-gray-200 text-gray-700'
                        }`}>
                        {patient.timeLeft}s left
                      </span>
                    </div>
                    <div className="font-bold text-gray-900">{patient.name}</div>
                    <div className="text-sm text-gray-600">{patient.condition}</div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* ER Beds */}
          <div className="col-span-8 grid grid-rows-3 gap-4">
            {beds.map(bed => (
              <div
                key={bed.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(bed.id)}
                className={`relative rounded-xl border-2 border-dashed transition-all p-4 flex items-center justify-center ${bed.patient
                    ? 'bg-white border-solid border-blue-500 shadow-md'
                    : 'bg-gray-50 border-gray-300 hover:bg-blue-50 hover:border-blue-300'
                  }`}
              >
                <div className="absolute top-2 left-4 font-bold text-gray-400 uppercase tracking-wider text-sm">
                  {bed.type.toUpperCase()} UNIT
                </div>

                {bed.patient ? (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center"
                  >
                    <div className="text-4xl mb-2">{bed.patient.avatar}</div>
                    <div className="font-bold text-gray-900">{bed.patient.name}</div>
                    <div className="text-green-600 text-sm font-semibold flex items-center gap-1 justify-center mt-1">
                      <HeartPulse className="w-4 h-4 animate-pulse" /> Treating...
                    </div>
                    <div className="w-32 h-2 bg-gray-200 rounded-full mt-2 mx-auto overflow-hidden">
                      <motion.div
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 3 }}
                        className="h-full bg-green-500"
                      />
                    </div>
                  </motion.div>
                ) : (
                  <div className="text-gray-400 text-center">
                    <div className="text-4xl mb-2 opacity-20">🛏️</div>
                    <div>Drop Patient Here</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
