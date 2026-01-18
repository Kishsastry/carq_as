import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Map, Trophy, User, LogOut, ZoomIn, ZoomOut, Maximize2, Volume2, VolumeX } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useAudio } from '../contexts/AudioContext';
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
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const mapRef = useRef<HTMLDivElement>(null);
  const { user, signOut } = useAuth();
  const { muted, toggleMute } = useAudio();
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
      setGuideMessage("Welcome to the Career Kingdom! Choose any realm to begin your quest. Each kingdom holds unique challenges and magical knowledge!");
    } else if (completedCount === 1) {
      setGuideMessage("Excellent work on your first realm! The kingdom map is revealing more territories. Ready to explore another career kingdom?");
    } else if (completedCount === 2) {
      setGuideMessage("Magnificent! Two realms explored. Your wisdom grows with each kingdom you master!");
    } else if (completedCount === 3) {
      setGuideMessage("Incredible progress! Three kingdoms conquered, two remain. You're becoming a true Career Champion!");
    } else if (completedCount === 4) {
      setGuideMessage("Almost there! Just one kingdom remains. Complete it to unlock the ultimate achievement!");
    } else if (completedCount >= 5) {
      setGuideMessage("🎉 LEGENDARY! You've mastered all Career Kingdoms! You are officially a Career Kingdom Champion!");
    }
  };

  const handleCareerClick = (careerSlug: string) => {
    navigate(`/career/${careerSlug}`);
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 2));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleResetView = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only start dragging if not clicking on an interactive element
    const target = e.target as HTMLElement;
    if (target.closest('button.career-island')) {
      return;
    }
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.001;
    const newScale = Math.min(Math.max(scale + delta, 0.5), 2);
    setScale(newScale);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="w-20 h-20 mb-4 animate-spin">✨</div>
          <p className="text-xl font-bold text-purple-800">Loading Kingdom Map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-300 via-indigo-200 to-blue-300 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <nav className="relative z-50 backdrop-blur-lg bg-indigo-900/80 border-b-4 border-purple-700 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center border-4 border-purple-200 shadow-lg">
                <Map className="w-8 h-8 text-purple-900" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-purple-100 tracking-wide" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
                  Career Kingdom
                </h1>
                <p className="text-sm text-purple-200">Explore • Discover • Master</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/leaderboard')}
                className="flex items-center gap-3 px-5 py-3 bg-yellow-500 hover:bg-yellow-400 rounded-xl border-3 border-yellow-300 shadow-lg transition-all transform hover:scale-105"
              >
                <Trophy className="w-6 h-6 text-white" />
                <div className="text-left">
                  <div className="text-xs text-yellow-100 font-medium">Leaderboard</div>
                  <div className="text-xl font-black text-white">Top 10</div>
                </div>
              </button>

              <button
                onClick={() => navigate('/profile')}
                className="flex items-center gap-3 px-5 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl border-3 border-purple-400 shadow-lg transition-all transform hover:scale-105"
              >
                <Trophy className="w-6 h-6 text-yellow-200" />
                <div className="text-left">
                  <div className="text-xs text-purple-100 font-medium">Total Score</div>
                  <div className="text-xl font-black text-white">{profile?.total_score || 0}</div>
                </div>
              </button>

              <button
                onClick={() => navigate('/profile')}
                className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl border-3 border-indigo-400 shadow-lg transition-all transform hover:scale-105"
              >
                <User className="w-6 h-6 text-white" />
                <div className="text-left">
                  <div className="text-xs text-indigo-100 font-medium">Level</div>
                  <div className="text-xl font-black text-white">{profile?.level || 1}</div>
                </div>
              </button>

              <button
                onClick={() => toggleMute()}
                className="p-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl border-3 border-indigo-400 shadow-lg transition-all"
                title={muted ? "Unmute" : "Mute"}
              >
                {muted ? <VolumeX className="w-6 h-6 text-white" /> : <Volume2 className="w-6 h-6 text-white" />}
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
          <div className="relative bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100 rounded-3xl shadow-2xl border-8 border-indigo-900 p-8 overflow-hidden" style={{
            backgroundImage: `
              radial-gradient(circle at 20% 50%, rgba(147, 51, 234, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
              url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239333ea' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")
            `,
          }}>
            {/* Zoom Controls */}
            <div className="absolute top-4 right-4 z-50 flex flex-col gap-2">
              <button
                onClick={handleZoomIn}
                className="p-3 bg-white hover:bg-purple-50 rounded-lg shadow-lg border-2 border-purple-300 transition-all hover:scale-110"
                title="Zoom In"
              >
                <ZoomIn className="w-5 h-5 text-purple-700" />
              </button>
              <button
                onClick={handleZoomOut}
                className="p-3 bg-white hover:bg-purple-50 rounded-lg shadow-lg border-2 border-purple-300 transition-all hover:scale-110"
                title="Zoom Out"
              >
                <ZoomOut className="w-5 h-5 text-purple-700" />
              </button>
              <button
                onClick={handleResetView}
                className="p-3 bg-white hover:bg-purple-50 rounded-lg shadow-lg border-2 border-purple-300 transition-all hover:scale-110"
                title="Reset View"
              >
                <Maximize2 className="w-5 h-5 text-purple-700" />
              </button>
            </div>

            {/* Map instruction */}
            <div className="absolute top-4 left-4 z-50 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg border-2 border-purple-200">
              <p className="text-xs font-semibold text-purple-900">
                🖱️ Drag to pan • 🔍 Scroll to zoom
              </p>
            </div>
            <div className="absolute -top-6 -left-6 w-20 h-20 bg-purple-900 rounded-full flex items-center justify-center border-4 border-purple-100 shadow-xl transform -rotate-12">
              <span className="text-4xl">👑</span>
            </div>

            <div className="absolute -top-6 -right-6 w-20 h-20 bg-purple-900 rounded-full flex items-center justify-center border-4 border-purple-100 shadow-xl transform rotate-12">
              <span className="text-4xl">✨</span>
            </div>

            <div
              ref={mapRef}
              className="relative h-[700px] mt-8 overflow-hidden rounded-2xl cursor-grab active:cursor-grabbing"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
              style={{
                cursor: isDragging ? 'grabbing' : 'grab',
              }}
            >
              {/* Draggable and zoomable container */}
              <div
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                  transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                  width: '100%',
                  height: '100%',
                  position: 'relative',
                }}
              >
                {/* Water/Ocean effect background */}
                <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                  <div
                    className="absolute inset-0 opacity-30"
                    style={{
                      background: `
                      linear-gradient(to bottom, rgba(59, 130, 246, 0.2) 0%, rgba(29, 78, 216, 0.4) 100%),
                      repeating-linear-gradient(
                        90deg,
                        rgba(147, 197, 253, 0.1) 0px,
                        rgba(147, 197, 253, 0.2) 40px,
                        rgba(147, 197, 253, 0.1) 80px
                      )
                    `,
                      animation: 'wave 20s linear infinite',
                    }}
                  />
                </div>

                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.1))' }}>
                  <defs>
                    <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#9333ea" stopOpacity="0.3" />
                      <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#9333ea" stopOpacity="0.3" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 100 150 Q 200 100, 300 180 T 500 200 T 700 250"
                    stroke="url(#pathGradient)"
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray="15,10"
                    opacity="0.6"
                  />
                </svg>

                {careers.map((career, index) => {
                  const position = islandPositions[index] || { top: '50%', left: '50%', rotate: 0 };
                  const progress = careerProgress[career.id];
                  const isCompleted = progress?.status === 'completed';
                  const isStarted = progress?.status === 'in_progress';

                  const colorScheme = career.color_scheme as any;
                  const primaryColor = colorScheme?.primary || '#9333ea';
                  const secondaryColor = colorScheme?.secondary || '#7e22ce';
                  const accentColor = colorScheme?.accent || '#c084fc';

                  return (
                    <button
                      key={career.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCareerClick(career.slug);
                      }}
                      className="career-island absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer transition-all duration-300 hover:scale-110 hover:-translate-y-2"
                      style={{
                        top: position.top,
                        left: position.left,
                        transform: `translate(-50%, -50%) rotate(${position.rotate}deg)`,
                        filter: 'drop-shadow(0 10px 25px rgba(0,0,0,0.3))',
                      }}
                    >
                      <div className="relative w-56 h-56">
                        {/* Island base - multiple layers for 3D effect */}
                        <div className="absolute inset-0 transform translate-y-8">
                          <div
                            className="w-full h-full rounded-[40%] opacity-40 blur-md"
                            style={{
                              background: `radial-gradient(ellipse at center, ${primaryColor} 0%, transparent 70%)`,
                            }}
                          />
                        </div>

                        {/* Island terrain layers */}
                        <div className="relative">
                          {/* Bottom layer - darkest */}
                          <div
                            className="absolute inset-x-0 bottom-0 h-32 rounded-[45%_45%_40%_40%]"
                            style={{
                              background: `linear-gradient(to bottom, ${secondaryColor}, ${primaryColor})`,
                              transform: 'perspective(400px) rotateX(5deg)',
                            }}
                          />

                          {/* Middle layer */}
                          <div
                            className="absolute inset-x-2 bottom-8 h-28 rounded-[45%_45%_40%_40%]"
                            style={{
                              background: `linear-gradient(135deg, ${accentColor} 0%, ${primaryColor} 100%)`,
                              transform: 'perspective(400px) rotateX(5deg)',
                            }}
                          />

                          {/* Top layer - lightest and main */}
                          <div
                            className="absolute inset-x-4 bottom-12 h-32 rounded-[50%_50%_45%_45%] overflow-hidden border-4 border-white/30"
                            style={{
                              background: `linear-gradient(to bottom right, ${accentColor}, ${primaryColor})`,
                              transform: 'perspective(400px) rotateX(5deg)',
                              boxShadow: `inset 0 -10px 20px rgba(0,0,0,0.2), 0 5px 15px rgba(0,0,0,0.3)`,
                            }}
                          >
                            {/* Grass/terrain texture effect */}
                            <div
                              className="absolute inset-0 opacity-20"
                              style={{
                                backgroundImage: `repeating-linear-gradient(
                                45deg,
                                transparent,
                                transparent 10px,
                                rgba(255,255,255,0.1) 10px,
                                rgba(255,255,255,0.1) 20px
                              )`
                              }}
                            />
                          </div>

                          {/* Castle/Building structure */}
                          <div className="absolute inset-x-0 bottom-20 flex items-end justify-center">
                            <div className="relative">
                              {/* Castle/Icon container with 3D effect */}
                              <div
                                className="relative w-32 h-32 flex items-center justify-center"
                                style={{
                                  transform: 'perspective(400px) rotateX(5deg)',
                                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
                                }}
                              >
                                <div className="text-7xl transform group-hover:scale-125 transition-transform duration-300">
                                  {isCompleted ? '👑' : isStarted ? '⚔️' : '🏰'}
                                </div>
                              </div>

                              {/* Completion crown */}
                              {isCompleted && (
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full flex items-center justify-center border-4 border-white shadow-xl animate-bounce"
                                  style={{
                                    filter: 'drop-shadow(0 4px 12px rgba(251, 191, 36, 0.5))',
                                  }}>
                                  <span className="text-3xl">🏆</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Info panel - floating above island */}
                          <div className="absolute inset-x-0 -bottom-4 flex justify-center">
                            <div className="bg-white/95 backdrop-blur-sm rounded-2xl px-4 py-2 shadow-xl border-2 border-purple-200"
                              style={{
                                transform: 'perspective(400px) rotateX(5deg)',
                              }}>
                              <h3 className="text-xs font-black text-gray-800 mb-0.5">
                                {career.name}
                              </h3>
                              <p className="text-[10px] text-gray-600 font-semibold">
                                {career.title}
                              </p>
                              {progress && (
                                <div className="mt-1 flex items-center justify-center gap-1">
                                  <span className="text-[10px] font-bold text-purple-600">
                                    {progress.score} pts
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Enhanced shadow */}
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-48 h-8 bg-gradient-radial from-black/40 to-transparent rounded-full blur-xl" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-8 flex items-center justify-center gap-6">
              <div className="flex items-center gap-2 px-4 py-2 bg-purple-700 rounded-xl border-2 border-purple-500">
                <span className="text-2xl">🏰</span>
                <span className="text-white font-bold">Not Started</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-xl border-2 border-blue-400">
                <span className="text-2xl">⚔️</span>
                <span className="text-white font-bold">In Progress</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-green-600 rounded-xl border-2 border-green-400">
                <span className="text-2xl">👑</span>
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
