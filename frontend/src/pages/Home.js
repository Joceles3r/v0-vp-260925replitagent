import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      <Navbar />
      
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Programme Officiel de
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
              Diffusion VISUAL
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Transformez chaque porteur en ambassadeur publicitaire actif de VISUAL.
            Promouvez vos projets gratuitement sur nos réseaux officiels et gagnez des récompenses !
          </p>
          {!isAuthenticated ? (
            <div className="flex justify-center space-x-4">
              <Link
                to="/register"
                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:from-purple-700 hover:to-indigo-700 transition shadow-lg"
              >
                Commencer gratuitement
              </Link>
              <Link
                to="/login"
                className="bg-white text-purple-600 border-2 border-purple-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-purple-50 transition shadow-lg"
              >
                Se connecter
              </Link>
            </div>
          ) : (
            <Link
              to="/dashboard"
              className="inline-block bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:from-purple-700 hover:to-indigo-700 transition shadow-lg"
            >
              Accéder au tableau de bord
            </Link>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center hover:shadow-2xl transition">
            <div className="text-6xl mb-4">📱</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Diffusion Multi-Plateformes</h3>
            <p className="text-gray-600">
              Vos projets diffusés automatiquement sur YouTube, TikTok et Facebook avec filigrane VISUAL et lien direct.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 text-center hover:shadow-2xl transition">
            <div className="text-6xl mb-4">⭐</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Système de Récompenses</h3>
            <p className="text-gray-600">
              Gagnez des VISUpoints et des badges en promouvant vos projets. Classement mensuel avec récompenses !
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 text-center hover:shadow-2xl transition">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Statistiques Détaillées</h3>
            <p className="text-gray-600">
              Suivez les vues, clics et performances de vos projets sur chaque plateforme en temps réel.
            </p>
          </div>
        </div>

        {/* How it works */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl shadow-2xl p-12 text-white">
          <h2 className="text-4xl font-bold text-center mb-12">Comment ça marche ?</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-white/20 rounded-full w-16 h-16 flex items-center justify-center text-3xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-bold mb-2">Créez votre projet</h3>
              <p className="text-purple-100">Ajoutez les détails de votre projet à promouvoir</p>
            </div>

            <div className="text-center">
              <div className="bg-white/20 rounded-full w-16 h-16 flex items-center justify-center text-3xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-bold mb-2">Autorisez la diffusion</h3>
              <p className="text-purple-100">Choisissez les plateformes et autorisez VISUAL</p>
            </div>

            <div className="text-center">
              <div className="bg-white/20 rounded-full w-16 h-16 flex items-center justify-center text-3xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-bold mb-2">Partagez vos liens</h3>
              <p className="text-purple-100">Recevez vos liens personnalisés et partagez-les</p>
            </div>

            <div className="text-center">
              <div className="bg-white/20 rounded-full w-16 h-16 flex items-center justify-center text-3xl font-bold mx-auto mb-4">
                4
              </div>
              <h3 className="text-xl font-bold mb-2">Gagnez des récompenses</h3>
              <p className="text-purple-100">Accumulez VISUpoints et badges !</p>
            </div>
          </div>
        </div>

        {/* Rewards */}
        <div className="mt-16 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-8">Récompenses mensuelles</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl shadow-xl p-8 text-white">
              <div className="text-6xl mb-4">🥇</div>
              <h3 className="text-3xl font-bold mb-2">1er place</h3>
              <p className="text-2xl font-bold">+500 VISUpoints</p>
            </div>
            <div className="bg-gradient-to-br from-gray-300 to-gray-500 rounded-2xl shadow-xl p-8 text-white">
              <div className="text-6xl mb-4">🥈</div>
              <h3 className="text-3xl font-bold mb-2">2è - 5è</h3>
              <p className="text-2xl font-bold">+200 VISUpoints</p>
            </div>
            <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl shadow-xl p-8 text-white">
              <div className="text-6xl mb-4">🥉</div>
              <h3 className="text-3xl font-bold mb-2">6è - 10è</h3>
              <p className="text-2xl font-bold">+100 VISUpoints</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        {!isAuthenticated && (
          <div className="mt-16 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Prêt à devenir un Ambassadeur VISUAL ?
            </h2>
            <Link
              to="/register"
              className="inline-block bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-10 py-5 rounded-lg font-bold text-xl hover:from-purple-700 hover:to-indigo-700 transition shadow-xl"
            >
              Rejoignez-nous gratuitement →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;