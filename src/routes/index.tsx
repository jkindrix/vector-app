import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { AdminLayout } from '../components/AdminLayout';
import { DocumentView } from '../components/DocumentView';

const HomePage = lazy(() => import('../components/HomePage'));
const SearchPage = lazy(() => import('../components/SearchPage'));
const AdminLogin = lazy(() => import('../components/AdminLogin'));
const AdminPapers = lazy(() => import('../components/AdminPapers'));
const AdminEditor = lazy(() => import('../components/AdminEditor'));
const AdminSettings = lazy(() => import('../components/AdminSettings'));

const Loading = () => (
  <div className="flex items-center justify-center py-20">
    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

export const AppRoutes: React.FC = () => (
  <Suspense fallback={<Loading />}>
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/search" element={<SearchPage />} />

      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="files" replace />} />
        <Route path="files" element={<AdminPapers />} />
        <Route path="edit/*" element={<AdminEditor />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      <Route path="/login" element={<Navigate to="/admin/login" replace />} />
      <Route path="*" element={<DocumentView />} />
    </Routes>
  </Suspense>
);
