import React, { useEffect, useState } from 'react';
import { getLeaderboard } from '../services/api';
import Navbar from '../components/Navbar';

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const data = await getLeaderboard();
      setLeaderboard(data);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankEmoji = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getRankColor = (rank) => {
    if (rank === 1) return 'bg-yellow-100 border-yellow-400';
    if (rank === 2) return 'bg-gray-100 border-gray-400';
    if (rank === 3) return 'bg-orange-100 border-orange-400';
    return 'bg-white border-gray-200';
  };

  const getRewardInfo = (rank) => {
    if (rank === 1) return '+500 VISUpoints';
    if (rank >= 2 && rank <= 5) return '+200 VISUpoints';
    if (rank >= 6 && rank <= 10) return '+100 VISUpoints';
    return null;
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🏆 Classement des Ambassadeurs</h1>
          <p className="text-gray-600">Les meilleurs porteurs du Programme Officiel de Diffusion VISUAL</p>
        </div>

        {/* Rewards Info */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-xl p-6 mb-8 text-white">
          <h2 className="text-xl font-bold mb-3">⭐ Récompenses mensuelles</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-2xl mb-1">🥇</div>
              <div className="font-bold">1er place</div>
              <div className="text-yellow-300">+500 VISUpoints</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-2xl mb-1">🥈</div>
              <div className="font-bold">2ème - 5ème</div>
              <div className="text-yellow-300">+200 VISUpoints</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-2xl mb-1">🥉</div>
              <div className="font-bold">6ème - 10ème</div>
              <div className="text-yellow-300">+100 VISUpoints</div>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        {leaderboard.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun classement pour l'instant</h3>
            <p className="text-gray-600">Soyez le premier à promouvoir votre projet !</p>
          </div>
        ) : (
          <div className="space-y-4">
            {leaderboard.map((entry) => (
              <div
                key={entry.user_id}
                className={`border-2 rounded-xl shadow-md p-6 transition hover:shadow-lg ${getRankColor(entry.rank)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="text-3xl font-bold w-16 text-center">
                      {getRankEmoji(entry.rank)}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900">{entry.full_name}</h3>
                      <div className="flex items-center space-x-4 mt-2 text-sm">
                        <span className="text-gray-600">
                          👁 <span className="font-semibold">{entry.total_views}</span> vues
                        </span>
                        <span className="text-gray-600">
                          👆 <span className="font-semibold">{entry.total_clicks}</span> clics
                        </span>
                        <span className="text-purple-600 font-semibold">
                          ⭐ {entry.visupoints} VISUpoints
                        </span>
                      </div>
                      {entry.badges && entry.badges.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {entry.badges.map((badge, index) => (
                            <span
                              key={index}
                              className="bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-semibold"
                            >
                              🏆 {badge}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {getRewardInfo(entry.rank) && (
                      <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg font-semibold text-sm">
                        {getRewardInfo(entry.rank)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;