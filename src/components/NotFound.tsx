import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FileQuestion, Home, Search, ArrowLeft } from 'lucide-react';

export const NotFound: React.FC = () => {
  const location = useLocation();
  
  // Suggest possible corrections based on the URL
  const getSuggestions = () => {
    const path = location.pathname.toLowerCase();
    const suggestions = [];

    if (path.includes('admin')) {
      suggestions.push({ label: 'Admin Login', path: '/admin/login' });
      suggestions.push({ label: 'Admin Dashboard', path: '/admin/dashboard' });
    }
    
    if (path.includes('paper') || path.includes('collection')) {
      suggestions.push({ label: 'Browse Collections', path: '/' });
      suggestions.push({ label: 'Search', path: '/search' });
    }

    return suggestions;
  };

  const suggestions = getSuggestions();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4" data-testid="not-found">
      <div className="max-w-md w-full text-center">
        <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
          <FileQuestion className="w-12 h-12 text-gray-400" />
        </div>
        
        <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-2">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">Page Not Found</h2>
        
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>

        {location.pathname !== '/' && (
          <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">You tried to access:</p>
            <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded font-mono">
              {location.pathname}
            </code>
          </div>
        )}

        <div className="space-y-3">
          <Link
            to="/"
            className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Home className="w-5 h-5 mr-2" />
            Go to Homepage
          </Link>

          <Link
            to="/search"
            className="w-full flex items-center justify-center px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <Search className="w-5 h-5 mr-2" />
            Search
          </Link>

          {suggestions.length > 0 && (
            <div className="mt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Looking for something else?
              </p>
              <div className="space-y-2">
                {suggestions.map((suggestion, index) => (
                  <Link
                    key={index}
                    to={suggestion.path}
                    className="block w-full px-4 py-2 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    {suggestion.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => window.history.back()}
          className="mt-6 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors mx-auto"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go back
        </button>
      </div>
    </div>
  );
};

export default NotFound;