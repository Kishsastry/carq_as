import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Medal, Crown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useAudio } from '../contexts/AudioContext';
import type { Profile } from '../lib/database.types';

export function LeaderboardPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { playSfx } = useAudio();
    const [leaders, setLeaders] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadLeaderboard();
    }, []);

    const loadLeaderboard = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('total_score', { ascending: false })
                .limit(10);

            if (error) throw error;
            setLeaders(data || []);
        } catch (error) {
            console.error('Error loading leaderboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const getRankIcon = (index: number) => {
        switch (index) {
            case 0:
                return <Crown className="w-8 h-8 text-yellow-500 fill-yellow-500" />;
            case 1:
                return <Medal className="w-8 h-8 text-gray-400 fill-gray-400" />;
            case 2:
                return <Medal className="w-8 h-8 text-amber-700 fill-amber-700" />;
            default:
                return <span className="w-8 h-8 flex items-center justify-center font-bold text-gray-500 text-xl">{index + 1}</span>;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
            <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-indigo-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <button
                            onClick={() => {
                                playSfx('click');
                                navigate('/');
                            }}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-indigo-50 text-indigo-600 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span className="font-medium">Back to Home</span>
                        </button>

                        <div className="flex items-center gap-2">
                            <Trophy className="w-6 h-6 text-yellow-500" />
                            <h1 className="text-2xl font-bold text-gray-900">Global Leaderboard</h1>
                        </div>

                        <div className="w-24" /> {/* Spacer for centering */}
                    </div>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-indigo-100">
                    <div className="p-8 bg-indigo-600 text-white text-center">
                        <h2 className="text-3xl font-bold mb-2">Top Players</h2>
                        <p className="text-indigo-100">The most skilled professionals in Career Quest</p>
                    </div>

                    <div className="p-6">
                        {loading ? (
                            <div className="flex justify-center py-12">
                                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {leaders.map((leader, index) => (
                                    <div
                                        key={leader.id}
                                        className={`flex items-center p-4 rounded-2xl transition-all ${user?.id === leader.id
                                                ? 'bg-indigo-50 border-2 border-indigo-500 transform scale-[1.02] shadow-md'
                                                : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                                            }`}
                                    >
                                        <div className="flex-shrink-0 w-16 flex justify-center">
                                            {getRankIcon(index)}
                                        </div>

                                        <div className="flex-shrink-0 mr-4">
                                            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-xl font-bold text-indigo-600">
                                                {leader.username.charAt(0).toUpperCase()}
                                            </div>
                                        </div>

                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                                {leader.username}
                                                {user?.id === leader.id && (
                                                    <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full">You</span>
                                                )}
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                Joined {new Date(leader.created_at).toLocaleDateString()}
                                            </p>
                                        </div>

                                        <div className="text-right px-4">
                                            <div className="text-2xl font-bold text-indigo-600">
                                                {leader.total_score.toLocaleString()}
                                            </div>
                                            <div className="text-xs text-gray-500 uppercase font-semibold tracking-wider">
                                                Points
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {leaders.length === 0 && (
                                    <div className="text-center py-12 text-gray-500">
                                        No players found yet. Be the first to join the leaderboard!
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
