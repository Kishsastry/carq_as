import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Map, Trophy, User, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { CharacterGuide } from '../components/CharacterGuide';
import type { Career, Profile, UserCareerProgress } from '../lib/database.types';

interface IslandPosition {
  top: string;
  left: string;
  rotate: number;
}

const islandPositions: IslandPosition[] = [
  { top: '25%', left: '15%', rotate: -5 },
  { top: '15%', left: '65%', rotate: 3 },
  { top: '45%', left: '80%', rotate: -3 },
  { top: '65%', left: '50%', rotate: 2 },
  { top: '60%', left: '20%', rotate: -4 },
];

export function HomePage() {
  const [careers, setCareers] = useState<Career[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [careerProgress, setCareerProgress] = useState<Record<string, UserCareerProgress>>({});
  const [loading, setLoading] = useState(true);
  const [showGuide, setShowGuide] = useState(true);
  const [guideMessage, setGuideMessage] = useState('');
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      const [careersRes, profileRes, progressRes] = await Promise.all([
        supabase.from('careers').select('*').eq('is_active', true).order('order_index'),
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('user_career_progress').select('*').eq('user_id', user.id)
      ]);

      if (careersRes.data) setCareers(careersRes.data);
      if (profileRes.data) {
        setProfile(profileRes.data);
        updateGuideMessage(profileRes.data, progressRes.data || []);
      }

      const progressMap: Record<string, UserCareerProgress> = {};
      progressRes.data?.forEach(p => {
        progressMap[p.career_id] = p;
      });
      setCareerProgress(progressMap);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateGuideMessage = (prof: Profile, progress: UserCareerProgress[]) => {
    const completedCount = progress.filter(p => p.status === 'completed').length;

    if (completedCount === 0) {
      setGuideMessage("Ahoy, adventurer! Welcome to the Career Islands. Choose any island to begin your journey. Each island holds unique challenges and treasures!");
    } else if (completedCount === 1) {
      setGuideMessage("Brilliant work on your first island! The map is revealing more secrets. Ready to explore another career path?");
    } else if (completedCount === 2) {
      setGuideMessage("You're on fire! Two islands explored. The treasure of knowledge grows with each adventure!");
    } else if (completedCount === 3) {
      setGuideMessage("Incredible progress! Three islands down, two to go. You're becoming a true Career Champion!");
    } else if (completedCount === 4) {
      setGuideMessage("Almost there! Just one island remains. Complete it to unlock the ultimate treasure!");
    } else if (completedCount >= 5) {
      setGuideMessage("🎉 LEGENDARY! You've conquered all Career Islands! You are officially a Career Quest Champion!");
    }
  };

  const handleCareerClick = (careerSlug: string) => {
    navigate(`/career/${careerSlug}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-100 via-orange-50 to-blue-100">
        <div className="text-center">
          <div className="w-20 h-20 mb-4 animate-spin">🧭</div>
          <p className="text-xl font-bold text-amber-800">Loading Treasure Map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-300 via-blue-200 to-cyan-300 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <nav className="relative z-50 backdrop-blur-lg bg-amber-900/80 border-b-4 border-amber-700 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center border-4 border-amber-200 shadow-lg">
                <Map className="w-8 h-8 text-amber-900" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-amber-100 tracking-wide" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
                  Career Quest
                </h1>
                <p className="text-sm text-amber-200">Explore • Discover • Conquer</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center gap-3 px-5 py-3 bg-amber-600 hover:bg-amber-500 rounded-xl border-3 border-amber-400 shadow-lg transition-all transform hover:scale-105"
              >
                <Trophy className="w-6 h-6 text-yellow-200" />
                <div className="text-left">
                  <div className="text-xs text-amber-100 font-medium">Total Score</div>
                  <div className="text-xl font-black text-white">{profile?.total_score || 0}</div>
                </div>
              </button>

              <button
                onClick={() => navigate('/profile')}
                className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl border-3 border-blue-400 shadow-lg transition-all transform hover:scale-105"
              >
                <User className="w-6 h-6 text-white" />
                <div className="text-left">
                  <div className="text-xs text-blue-100 font-medium">Level</div>
                  <div className="text-xl font-black text-white">{profile?.level || 1}</div>
                </div>
              </button>

              <button
                onClick={() => signOut()}
                className="p-3 bg-red-600 hover:bg-red-500 rounded-xl border-3 border-red-400 shadow-lg transition-all"
              >
                <LogOut className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="relative bg-[#E8D4A0] rounded-3xl shadow-2xl border-8 border-amber-900 p-8" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill-opacity='0.05'%3E%3Cpolygon fill='%23000' points='50 0 100 50 50 100 0 50'/%3E%3C/g%3E%3C/svg%3E")`,
          }}>
            <div className="absolute -top-6 -left-6 w-20 h-20 bg-amber-900 rounded-full flex items-center justify-center border-4 border-amber-100 shadow-xl transform -rotate-12">
              <span className="text-4xl">🧭</span>
            </div>

            <div className="absolute -top-6 -right-6 w-24 h-24 opacity-30 transform rotate-12">
              <svg viewBox="0 0 100 100">
                <text x="50" y="50" textAnchor="middle" dominantBaseline="middle" fontSize="60" fill="#78350F">N</text>
                <text x="50" y="80" textAnchor="middle" fontSize="20" fill="#78350F">S</text>
                <text x="20" y="50" textAnchor="middle" dominantBaseline="middle" fontSize="20" fill="#78350F">W</text>
                <text x="80" y="50" textAnchor="middle" dominantBaseline="middle" fontSize="20" fill="#78350F">E</text>
              </svg>
            </div>

            <div className="relative h-[700px] mt-8">
              <svg className="absolute inset-0 w-full h-full" style={{ filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))' }}>
                <defs>
                  <path id="wavyPath" d="M 50 50 Q 150 100, 250 150 T 450 200 T 650 300" />
                </defs>
                <path
                  d="M 50 50 Q 150 100, 250 150 T 450 200 T 650 300"
                  stroke="#78350F"
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray="10,5"
                  opacity="0.5"
                />
              </svg>

              {careers.map((career, index) => {
                const position = islandPositions[index] || { top: '50%', left: '50%', rotate: 0 };
                const progress = careerProgress[career.id];
                const isCompleted = progress?.status === 'completed';
                const isStarted = progress?.status === 'in_progress';

                return (
                  <button
                    key={career.id}
                    onClick={() => handleCareerClick(career.slug)}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer transition-all hover:scale-110"
                    style={{
                      top: position.top,
                      left: position.left,
                      transform: `translate(-50%, -50%) rotate(${position.rotate}deg)`,
                    }}
                  >
                    <div className="relative w-48 h-48">
                      <div className={`absolute inset-0 rounded-full ${
                        isCompleted
                          ? 'bg-gradient-to-br from-green-400 to-emerald-500 animate-pulse'
                          : isStarted
                          ? 'bg-gradient-to-br from-blue-400 to-cyan-500'
                          : 'bg-gradient-to-br from-amber-400 to-orange-500'
                      } shadow-2xl border-4 border-white`} />

                      {isCompleted && (
                        <div className="absolute -top-4 -right-4 w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center border-4 border-white shadow-xl animate-bounce">
                          <span className="text-2xl">🏆</span>
                        </div>
                      )}

                      <div className="relative h-full flex flex-col items-center justify-center p-4">
                        <div className="text-6xl mb-2 transform group-hover:scale-125 transition-transform">
                          {isCompleted ? '🏆' : isStarted ? '🚀' : '🏝️'}
                        </div>

                        <div className="text-center">
                          <h3 className="text-sm font-black text-white drop-shadow-lg mb-1" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
                            {career.name}
                          </h3>
                          <p className="text-xs text-white/90 font-bold drop-shadow">
                            {career.title}
                          </p>

                          {progress && (
                            <div className="mt-2 px-3 py-1 bg-white/90 rounded-full">
                              <span className="text-xs font-bold text-gray-800">
                                {progress.score} pts
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-40 h-6 bg-black/30 rounded-full blur-lg" />
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-8 flex items-center justify-center gap-6">
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-700 rounded-xl border-2 border-amber-500">
                <span className="text-2xl">🏝️</span>
                <span className="text-white font-bold">Not Started</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-xl border-2 border-blue-400">
                <span className="text-2xl">🚀</span>
                <span className="text-white font-bold">In Progress</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-green-600 rounded-xl border-2 border-green-400">
                <span className="text-2xl">🏆</span>
                <span className="text-white font-bold">Completed</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {showGuide && guideMessage && (
        <CharacterGuide
          message={guideMessage}
          onClose={() => setShowGuide(false)}
          position="bottom-right"
        />
      )}
    </div>
  );
}
