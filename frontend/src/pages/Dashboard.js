import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProjects, getAuthorizations } from '../services/api';
import Navbar from '../components/Navbar';

const Dashboard = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [authorizations, setAuthorizations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [projectsData, authData] = await Promise.all([
        getProjects(),
        getAuthorizations()
      ]);
      setProjects(projectsData);
      setAuthorizations(authData.authorizations || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasBadge = (badgeName) => {
    return user?.badges?.includes(badgeName) || false;
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
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Bienvenue, {user?.full_name} !</h1>
          <p className="text-gray-600 mt-2">Gérez vos projets et votre promotion sur les réseaux sociaux</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">VISUpoints</p>
                <p className="text-3xl font-bold text-purple-600">{user?.visupoints || 0}</p>
              </div>
              <div className="text-4xl">⭐</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Projets</p>
                <p className="text-3xl font-bold text-indigo-600">{projects.length}</p>
              </div>
              <div className="text-4xl">📚</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Autorisations actives</p>
                <p className="text-3xl font-bold text-green-600">{authorizations.length}</p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Badges</p>
                <p className="text-3xl font-bold text-yellow-600">{user?.badges?.length || 0}</p>
              </div>
              <div className="text-4xl">🏆</div>
            </div>
          </div>
        </div>

        {/* Badges Section */}
        {user?.badges && user.badges.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Vos Badges</h2>
            <div className="flex flex-wrap gap-3">
              {user.badges.map((badge, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-full font-semibold flex items-center space-x-2"
                >
                  <span>🏆</span>
                  <span>{badge}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Programme de Diffusion VISUAL */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-xl p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">🌟 Programme Officiel de Diffusion VISUAL (P.O.D.V.)</h2>
              <p className="text-purple-100 mb-4">
                Faites connaître votre projet gratuitement sur nos réseaux officiels !
              </p>
              <ul className="space-y-2 text-purple-100">
                <li>✅ Diffusion sur YouTube, TikTok et Facebook</li>
                <li>✅ Liens de partage personnalisés avec tracking</li>
                <li>✅ Gagnez des VISUpoints et des badges</li>
                <li>✅ Participez au classement mensuel</li>
              </ul>
            </div>
            <div className="text-6xl">  📱</div>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            to="/projects/new"
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition border-2 border-dashed border-gray-300 hover:border-purple-500"
          >
            <div className="text-center">
              <div className="text-5xl mb-3">➕</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Créer un projet</h3>
              <p className="text-gray-600">Ajoutez un nouveau projet à promouvoir</p>
            </div>
          </Link>

          <Link
            to="/leaderboard"
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition"
          >
            <div className="text-center">
              <div className="text-5xl mb-3">🏆</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Voir le classement</h3>
              <p className="text-gray-600">Découvrez les meilleurs ambassadeurs</p>
            </div>
          </Link>
        </div>

        {/* Récent Projects */}
        {projects.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Vos projets récents</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {projects.slice(0, 3).map((project) => (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition"
                >
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{project.title}</h3>
                  <p className="text-gray-600 text-sm line-clamp-3">{project.description}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {new Date(project.created_at).toLocaleDateString('fr-FR')}
                    </span>
                    <span className="text-purple-600 font-semibold">→</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;