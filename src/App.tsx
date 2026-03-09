import React, { useEffect } from 'react';
import { BrowserRouter as Router, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Header } from './components/Header';
import { SEO } from './components/SEO';
import { AppRoutes } from './routes';
import { useAuthStore } from './store/authStore';
import { ErrorBoundary } from './components/ErrorBoundary';

function AppContent() {
  const { verifyToken } = useAuthStore();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  useEffect(() => {
    verifyToken();
  }, [verifyToken]);

  if (isAdminRoute) {
    return (
      <>
        <SEO />
        <AppRoutes />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-blue-600 focus:text-white">
        Skip to main content
      </a>
      <SEO />
      <Header />
      <main id="main-content">
        <AppRoutes />
      </main>
    </div>
  );
}

function App() {
  return (
    <HelmetProvider>
      <ErrorBoundary>
        <Router>
          <AppContent />
        </Router>
      </ErrorBoundary>
    </HelmetProvider>
  );
}

export default App;
