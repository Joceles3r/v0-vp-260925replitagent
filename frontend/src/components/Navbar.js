import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-gradient-to-r from-purple-600 to-indigo-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="text-2xl font-bold text-white">
                <span className="text-yellow-300">VISUAL</span> Promo
              </div>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="text-white hover:text-yellow-300 px-3 py-2 rounded-md text-sm font-medium transition"
                >
                  Tableau de bord
                </Link>
                <Link
                  to="/projects"
                  className="text-white hover:text-yellow-300 px-3 py-2 rounded-md text-sm font-medium transition"
                >
                  Mes Projets
                </Link>
                <Link
                  to="/leaderboard"
                  className="text-white hover:text-yellow-300 px-3 py-2 rounded-md text-sm font-medium transition"
                >
                  Classement
                </Link>
                <div className="flex items-center space-x-3 border-l border-white/20 pl-4">
                  <div className="text-white">
                    <div className="text-sm font-medium">{user?.full_name}</div>
                    <div className="text-xs text-yellow-300">⭐ {user?.visupoints || 0} VISUpoints</div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition"
                  >
                    Déconnexion
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-white hover:text-yellow-300 px-3 py-2 rounded-md text-sm font-medium transition"
                >
                  Connexion
                </Link>
                <Link
                  to="/register"
                  className="bg-yellow-400 hover:bg-yellow-500 text-purple-900 px-4 py-2 rounded-md text-sm font-bold transition"
                >
                  Inscription
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;