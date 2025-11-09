import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProject, authorizeShare, revokeAuthorization, getShareLinks, getProjectStats } from '../services/api';
import Navbar from '../components/Navbar';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [links, setLinks] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authorizing, setAuthorizing] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState(['youtube', 'tiktok', 'facebook']);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProjectData();
  }, [id]);

  const loadProjectData = async () => {
    try {
      const projectData = await getProject(id);
      setProject(projectData);
      
      // Try to load existing links and stats
      try {
        const [linksData, statsData] = await Promise.all([
          getShareLinks(id),
          getProjectStats(id)
        ]);
        setLinks(linksData.links);
        setStats(statsData);
      } catch (error) {
        // No authorization yet
        console.log('No authorization yet');
      }
    } catch (error) {
      console.error('Error loading project:', error);
      setError('Projet non trouvé');
    } finally {
      setLoading(false);
    }
  };

  const handlePlatformToggle = (platform) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform) 
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const handleAuthorize = async () => {
    if (selectedPlatforms.length === 0) {
      setError('Veuillez sélectionner au moins une plateforme');
      return;
    }

    setAuthorizing(true);
    setError('');

    try {
      const response = await authorizeShare(id, selectedPlatforms);
      setLinks(response.links);
      setShowSuccess(true);
      
      // Reload stats
      const statsData = await getProjectStats(id);
      setStats(statsData);

      setTimeout(() => setShowSuccess(false), 5000);
    } catch (error) {
      setError(error.response?.data?.detail || 'Erreur lors de l\'autorisation');
    } finally {
      setAuthorizing(false);
    }
  };

  const handleRevoke = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir révoquer l\'autorisation ?')) {
      return;
    }

    try {
      await revokeAuthorization(id);
      setLinks(null);
      setStats(null);
    } catch (error) {
      setError(error.response?.data?.detail || 'Erreur lors de la révocation');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Lien copié dans le presse-papier !');
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

  if (!project) {
    return (
      <div>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Projet non trouvé</h2>
            <button
              onClick={() => navigate('/projects')}
              className="mt-4 text-purple-600 hover:text-purple-800"
            >
              Retour aux projets
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Project Header */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <button
            onClick={() => navigate('/projects')}
            className="text-purple-600 hover:text-purple-800 mb-4 flex items-center"
          >
            ← Retour aux projets
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{project.title}</h1>
          <p className="text-gray-600 mb-4">{project.description}</p>
          
          {project.video_url && (
            <a
              href={project.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 hover:text-purple-800 inline-flex items-center"
            >
              🎥 Voir la vidéo →
            </a>
          )}
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            ✅ Autorisation enregistrée avec succès ! Vous avez reçu le badge "Ambassadeur VISUAL" et 100 VISUpoints !
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Promotion Panel */}
          <div className="bg-white rounded-xl shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              🎯 Promouvoir mon projet
            </h2>
            
            {!links ? (
              <>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-6">
                  <h3 className="font-bold text-purple-900 mb-2">Programme Officiel de Diffusion VISUAL</h3>
                  <p className="text-purple-800 text-sm mb-4">
                    Autorisez VISUAL à diffuser gratuitement un extrait de votre œuvre sur nos réseaux officiels.
                    Vous gagnerez en visibilité et participerez à la monétisation collective de VISUAL.
                  </p>
                  <ul className="text-purple-800 text-sm space-y-1">
                    <li>✅ Diffusion gratuite sur nos réseaux</li>
                    <li>✅ Badge "Ambassadeur VISUAL" + 100 VISUpoints</li>
                    <li>✅ Liens de partage personnalisés</li>
                    <li>✅ Participation au classement mensuel</li>
                  </ul>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Sélectionnez les plateformes :
                  </label>
                  <div className="space-y-3">
                    {[
                      { value: 'youtube', label: 'YouTube', icon: '📺' },
                      { value: 'tiktok', label: 'TikTok', icon: '🎵' },
                      { value: 'facebook', label: 'Facebook', icon: '👥' }
                    ].map((platform) => (
                      <label
                        key={platform.value}
                        className="flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition"
                        style={{
                          borderColor: selectedPlatforms.includes(platform.value) ? '#9333ea' : '#e5e7eb'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedPlatforms.includes(platform.value)}
                          onChange={() => handlePlatformToggle(platform.value)}
                          className="h-5 w-5 text-purple-600 rounded focus:ring-purple-500"
                        />
                        <span className="text-2xl">{platform.icon}</span>
                        <span className="font-medium text-gray-900">{platform.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleAuthorize}
                  disabled={authorizing || selectedPlatforms.length === 0}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition disabled:opacity-50"
                >
                  {authorizing ? 'Autorisation en cours...' : '✅ Autoriser et générer mes liens'}
                </button>
              </>
            ) : (
              <>
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                  <h3 className="font-bold text-green-900 mb-2">✅ Promotion active</h3>
                  <p className="text-green-800 text-sm">
                    Votre projet est autorisé pour la diffusion. Partagez les liens ci-dessous !
                  </p>
                </div>

                <div className="space-y-4 mb-6">
                  <h3 className="font-bold text-gray-900">Vos liens de partage :</h3>
                  {Object.entries(links).map(([platform, url]) => (
                    <div key={platform} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-900 capitalize">
                          {platform === 'youtube' && '📺'} 
                          {platform === 'tiktok' && '🎵'} 
                          {platform === 'facebook' && '👥'} 
                          {' ' + platform}
                        </span>
                        <button
                          onClick={() => copyToClipboard(url)}
                          className="text-purple-600 hover:text-purple-800 text-sm font-semibold"
                        >
                          📋 Copier
                        </button>
                      </div>
                      <input
                        type="text"
                        value={url}
                        readOnly
                        className="w-full px-3 py-2 border rounded text-sm bg-gray-50"
                      />
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleRevoke}
                  className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-semibold transition"
                >
                  🚫 Révoquer l'autorisation
                </button>
              </>
            )}
          </div>

          {/* Statistics Panel */}
          <div className="bg-white rounded-xl shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              📊 Statistiques
            </h2>
            
            {stats ? (
              <>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-blue-600">{stats.total_views}</div>
                    <div className="text-sm text-gray-600 mt-1">Vues totales</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-green-600">{stats.total_clicks}</div>
                    <div className="text-sm text-gray-600 mt-1">Clics totaux</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-gray-900">Par plateforme :</h3>
                  {stats.by_platform && stats.by_platform.map((stat) => (
                    <div key={stat.platform} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-900 capitalize">
                          {stat.platform === 'youtube' && '📺'} 
                          {stat.platform === 'tiktok' && '🎵'} 
                          {stat.platform === 'facebook' && '👥'} 
                          {' ' + stat.platform}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">Vues: </span>
                          <span className="font-bold text-blue-600">{stat.views}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Clics: </span>
                          <span className="font-bold text-green-600">{stat.clicks}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <div className="text-6xl mb-4">📊</div>
                <p>Aucune statistique disponible</p>
                <p className="text-sm mt-2">Autorisez la diffusion pour commencer à suivre vos statistiques</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
