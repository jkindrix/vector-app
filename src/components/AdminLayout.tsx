import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { FileText, Settings, LogOut, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export const AdminLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  const nav = [
    { name: 'Files', href: '/admin/files', icon: FileText },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Mobile nav */}
      <div className="lg:hidden border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm font-semibold text-gray-900 dark:text-white">Admin</span>
          <div className="flex items-center gap-4">
            {nav.map(item => (
              <Link
                key={item.href}
                to={item.href}
                className={`text-sm transition-colors ${
                  isActive(item.href)
                    ? 'text-gray-900 dark:text-white font-medium'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {item.name}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="text-sm text-red-600 dark:text-red-400"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>

      <div className="lg:flex">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex lg:flex-col lg:w-56 lg:fixed lg:inset-y-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Admin</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{user?.username}</p>
          </div>

          <nav className="flex-1 p-3 space-y-1">
            {nav.map(item => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                    isActive(item.href)
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-medium'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="p-3 border-t border-gray-200 dark:border-gray-800 space-y-1">
            <Link
              to="/"
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to site
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md w-full transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 lg:ml-56">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
