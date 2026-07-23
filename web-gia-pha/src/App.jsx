import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './layouts/AdminLayout';
import ErrorBoundary from './ErrorBoundary';
import { Loader2 } from 'lucide-react';
import './App.css';

// Lazy load các trang nặng để giảm initial bundle size
const Home = lazy(() => import('./pages/Home'));
const PublicHome = lazy(() => import('./pages/PublicHome'));
const FamilyTree = lazy(() => import('./pages/FamilyTree'));
const AdminMembers = lazy(() => import('./pages/admin/AdminMembers'));
const EditRequests = lazy(() => import('./pages/EditRequests'));
const AdminEditRequests = lazy(() => import('./pages/admin/AdminEditRequests'));
const PublicMembers = lazy(() => import('./pages/PublicMembers'));
const Events = lazy(() => import('./pages/Events'));
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ProfilePage = lazy(() => import('./pages/Profile'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

const PageLoader = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', color: 'var(--text-muted)', fontSize: '1rem', gap: '8px' }}>
    <Loader2 size={24} className="spin-icon" /> Đang tải...
  </div>
);

const App = () => {
  return (
    <ErrorBoundary>
      <Router>
        <Suspense fallback={<PageLoader />}>
          <div className="app-container">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={
                <>
                  <Navbar />
                  <main className="main-content"><PublicHome /></main>
                </>
              } />
              <Route path="/home" element={<ProtectedRoute />}>
                <Route
                  index
                  element={
                    <>
                      <Navbar />
                      <main className="main-content"><Home /></main>
                    </>
                  }
                />
              </Route>
              <Route path="/family-tree" element={
                <>
                  <Navbar />
                  <main className="main-content"><FamilyTree /></main>
                </>
              } />
              <Route path="/edit-requests" element={
                <>
                  <Navbar />
                  <main className="main-content"><EditRequests /></main>
                </>
              } />
              <Route path="/members" element={
                <>
                  <Navbar />
                  <main className="main-content"><PublicMembers /></main>
                </>
              } />
              <Route path="/events" element={
                <>
                  <Navbar />
                  <main className="main-content"><Events /></main>
                </>
              } />
              <Route path="/login" element={
                <>
                  <Navbar />
                  <main className="main-content"><Login /></main>
                </>
              } />
              <Route path="/register" element={
                <>
                  <Navbar />
                  <main className="main-content"><Register /></main>
                </>
              } />
              <Route path="/pages/profile/:profileId" element={<ProtectedRoute />}>
                <Route
                  index
                  element={
                    <>
                      <Navbar />
                      <main className="main-content"><ProfilePage /></main>
                    </>
                  }
                />
              </Route>

              {/* Admin Protected Routes */}
              <Route path="/admin" element={<ProtectedRoute />}>
                <Route element={<AdminLayout />}>
                  <Route index element={<Navigate to="members" replace />} />
                  <Route path="members" element={<AdminMembers />} />
                  <Route path="tree" element={<FamilyTree />} />
                  <Route path="requests" element={<AdminEditRequests />} />
                  <Route path="content" element={<NotFoundPage />} />
                  <Route path="settings" element={<NotFoundPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Route>

              <Route path="*" element={
                <>
                  <Navbar />
                  <main className="main-content">
                    <NotFoundPage />
                  </main>
                </>
              } />
            </Routes>
          </div>
        </Suspense>
      </Router>
    </ErrorBoundary>
  );
};

export default App;
