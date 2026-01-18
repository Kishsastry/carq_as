import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Star, Lock, Volume2, VolumeX } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useAudio } from '../contexts/AudioContext';
import type { Career, Challenge, UserChallengeProgress, ColorScheme } from '../lib/database.types';
import { CulinaryArtsGame } from '../games/CulinaryArts';
import { InformationTechnologyGame } from '../games/InformationTechnology';
import { LawGovernmentGame } from '../games/LawGovernment';
import { MediaCommunicationGame } from '../games/MediaCommunication';
import { HealthSciencesGame } from '../games/HealthSciences';

export function CareerWorld() {
  const { careerSlug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { muted, toggleMute } = useAudio();

  const [career, setCareer] = useState<Career | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [progress, setProgress] = useState<Record<string, UserChallengeProgress>>({});
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCareerData();
  }, [careerSlug]);

  const loadCareerData = async () => {
    try {
      const { data: careerData, error: careerError } = await supabase
        .from('careers')
        .select('*')
        .eq('slug', careerSlug)
        .maybeSingle();

      if (careerError) throw careerError;
      if (!careerData) {
        navigate('/');
        return;
      }

      setCareer(careerData);

      const { data: challengesData, error: challengesError } = await supabase
        .from('challenges')
        .select('*')
        .eq('career_id', careerData.id)
        .order('order_index');

      if (challengesError) throw challengesError;
      setChallenges(challengesData || []);

      if (user) {
        const { data: progressData } = await supabase
          .from('user_challenge_progress')
          .select('*')
          .eq('user_id', user.id)
          .in('challenge_id', (challengesData || []).map(c => c.id));

        const progressMap: Record<string, UserChallengeProgress> = {};
        progressData?.forEach(p => {
          progressMap[p.challenge_id] = p;
        });
        setProgress(progressMap);
      }
    } catch (error) {
      console.error('Error loading career data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChallengeComplete = async (challengeId: string, score: number) => {
    if (!user || !career) return;

    try {
      const existingProgress = progress[challengeId];
      let scoreDiff = 0;
      let isNewCompletion = false;

      if (existingProgress) {
        if (score > existingProgress.best_score) {
          scoreDiff = score - existingProgress.best_score;
        }

        await supabase
          .from('user_challenge_progress')
          .update({
            status: 'completed',
            score,
            best_score: Math.max(existingProgress.best_score, score),
            attempts: existingProgress.attempts + 1,
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingProgress.id);
      } else {
        scoreDiff = score;
        isNewCompletion = true;

        await supabase
          .from('user_challenge_progress')
          .insert({
            user_id: user.id,
            challenge_id: challengeId,
            status: 'completed',
            score,
            best_score: score,
            attempts: 1,
            completed_at: new Date().toISOString(),
          });
      }

      // Update Profile (Total Score & XP)
      if (scoreDiff > 0) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('total_score, experience, level')
          .eq('id', user.id)
          .single();

        if (profile) {
          const newTotalScore = (profile.total_score || 0) + scoreDiff;
          const newExperience = (profile.experience || 0) + scoreDiff; // 1 point = 1 XP
          const newLevel = Math.floor(newExperience / 100) + 1;

          await supabase
            .from('profiles')
            .update({
              total_score: newTotalScore,
              experience: newExperience,
              level: newLevel,
              updated_at: new Date().toISOString(),
            })
            .eq('id', user.id);
        }
      }

      // Check for Career Completion
      // We need to know if ALL challenges for this career are now completed
      const updatedProgress = { ...progress };
      if (isNewCompletion) {
        // Mock the new progress for the check
        updatedProgress[challengeId] = { status: 'completed' } as UserChallengeProgress;
      }

      const allChallengesCompleted = challenges.every(c =>
        (updatedProgress[c.id]?.status === 'completed') || (c.id === challengeId) // Ensure current one counts
      );

      if (allChallengesCompleted) {
        // Check if career progress exists
        const { data: careerProgress } = await supabase
          .from('user_career_progress')
          .select('*')
          .eq('user_id', user.id)
          .eq('career_id', career.id)
          .maybeSingle();

        if (careerProgress) {
          if (careerProgress.status !== 'completed') {
            await supabase
              .from('user_career_progress')
              .update({
                status: 'completed',
                completed_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq('id', careerProgress.id);
          }
        } else {
          await supabase
            .from('user_career_progress')
            .insert({
              user_id: user.id,
              career_id: career.id,
              status: 'completed',
              started_at: new Date().toISOString(),
              completed_at: new Date().toISOString(),
            });
        }
      } else {
        // Ensure career is marked as in_progress if not already
        const { data: careerProgress } = await supabase
          .from('user_career_progress')
          .select('*')
          .eq('user_id', user.id)
          .eq('career_id', career.id)
          .maybeSingle();

        if (!careerProgress) {
          await supabase
            .from('user_career_progress')
            .insert({
              user_id: user.id,
              career_id: career.id,
              status: 'in_progress',
              started_at: new Date().toISOString(),
            });
        }
      }

      loadCareerData();
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!career) {
    return null;
  }

  if (selectedChallenge) {
    return (
      <div className="min-h-screen">
        {careerSlug === 'culinary-arts' && (
          <CulinaryArtsGame
            challenge={selectedChallenge}
            onComplete={(score) => {
              handleChallengeComplete(selectedChallenge.id, score);
              setSelectedChallenge(null);
            }}
            onExit={() => setSelectedChallenge(null)}
          />
        )}
        {careerSlug === 'information-technology' && (
          <InformationTechnologyGame
            challenge={selectedChallenge}
            onComplete={(score) => {
              handleChallengeComplete(selectedChallenge.id, score);
              setSelectedChallenge(null);
            }}
            onExit={() => setSelectedChallenge(null)}
          />
        )}
        {careerSlug === 'law-government' && (
          <LawGovernmentGame
            challenge={selectedChallenge}
            onComplete={(score) => {
              handleChallengeComplete(selectedChallenge.id, score);
              setSelectedChallenge(null);
            }}
            onExit={() => setSelectedChallenge(null)}
          />
        )}
        {careerSlug === 'media-communication' && (
          <MediaCommunicationGame
            challenge={selectedChallenge}
            onComplete={(score) => {
              handleChallengeComplete(selectedChallenge.id, score);
              setSelectedChallenge(null);
            }}
            onExit={() => setSelectedChallenge(null)}
          />
        )}
        {careerSlug === 'health-sciences' && (
          <HealthSciencesGame
            challenge={selectedChallenge}
            onComplete={(score) => {
              handleChallengeComplete(selectedChallenge.id, score);
              setSelectedChallenge(null);
            }}
            onExit={() => setSelectedChallenge(null)}
          />
        )}
      </div>
    );
  }

  const colorScheme = career.color_scheme as ColorScheme;

  return (
    <div
      className="min-h-screen"
      style={{
        background: `linear-gradient(135deg, ${colorScheme.background} 0%, ${colorScheme.accent}20 100%)`,
      }}
    >
      <nav
        className="sticky top-0 z-40 backdrop-blur-lg border-b shadow-sm"
        style={{
          backgroundColor: `${colorScheme.primary}20`,
          borderColor: `${colorScheme.primary}30`,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Home</span>
            </button>

            <h1 className="text-2xl font-bold" style={{ color: colorScheme.primary }}>
              {career.name}
            </h1>

            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5" style={{ color: colorScheme.secondary }} />
              <span className="font-semibold">
                {Object.values(progress).reduce((sum, p) => sum + p.best_score, 0)}
              </span>
            </div>

            <button
              onClick={() => toggleMute()}
              className="ml-4 p-2 rounded-lg hover:bg-white/50 transition-colors"
              title={muted ? "Unmute" : "Mute"}
            >
              {muted ? <VolumeX className="w-5 h-5" style={{ color: colorScheme.primary }} /> : <Volume2 className="w-5 h-5" style={{ color: colorScheme.primary }} />}
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to {career.name}
          </h2>
          <p className="text-lg text-gray-700 max-w-2xl mx-auto">
            {career.description}
          </p>
        </div>

        <div className="space-y-6">
          {challenges.map((challenge, index) => {
            const challengeProgress = progress[challenge.id];
            const isLocked = index > 0 && !progress[challenges[index - 1].id];
            const isCompleted = challengeProgress?.status === 'completed';

            return (
              <div
                key={challenge.id}
                className={`bg-white rounded-2xl shadow-lg overflow-hidden transition-all ${isLocked ? 'opacity-60' : 'hover:shadow-xl'
                  }`}
              >
                <div
                  className="h-2"
                  style={{
                    background: `linear-gradient(90deg, ${colorScheme.primary} 0%, ${colorScheme.secondary} 100%)`,
                  }}
                />

                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: colorScheme.primary }}
                        >
                          {index + 1}
                        </span>
                        <h3 className="text-xl font-bold text-gray-900">
                          {challenge.title}
                        </h3>
                        {isCompleted && (
                          <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                        )}
                        {isLocked && (
                          <Lock className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <p className="text-gray-600 ml-11">
                        {challenge.description}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-bold" style={{ color: colorScheme.primary }}>
                        {challengeProgress?.best_score || 0}
                      </div>
                      <div className="text-sm text-gray-500">
                        / {challenge.max_score}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{challenge.challenge_type.replace('_', ' ')}</span>
                      {challengeProgress && challengeProgress.attempts > 0 && (
                        <span>{challengeProgress.attempts} attempt{challengeProgress.attempts !== 1 ? 's' : ''}</span>
                      )}
                    </div>

                    <button
                      onClick={() => !isLocked && setSelectedChallenge(challenge)}
                      disabled={isLocked}
                      className="px-6 py-2 rounded-lg font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: isLocked ? '#9CA3AF' : colorScheme.primary,
                      }}
                    >
                      {isCompleted ? 'Play Again' : isLocked ? 'Locked' : 'Start Challenge'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
