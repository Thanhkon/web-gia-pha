import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './layouts/AdminLayout';
import ErrorBoundary from './ErrorBoundary';
import './App.css';

// Lazy load các trang nặng để giảm initial bundle size
const Home = lazy(() => import('./pages/Home'));
const FamilyTree = lazy(() => import('./pages/FamilyTree'));
const AdminMembers = lazy(() => import('./pages/admin/AdminMembers'));
const EditRequests = lazy(() => import('./pages/EditRequests'));
const AdminEditRequests = lazy(() => import('./pages/admin/AdminEditRequests'));
const PublicMembers = lazy(() => import('./pages/PublicMembers'));

const PageLoader = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', color: 'var(--text-muted)', fontSize: '1rem' }}>
    Đang tải...
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
                  <main className="main-content"><Home /></main>
                </>
              } />
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

              {/* Admin Protected Routes */}
              <Route path="/admin" element={<ProtectedRoute />}>
                <Route element={<AdminLayout />}>
                  <Route index element={<AdminMembers />} />
                  <Route path="members" element={<AdminMembers />} />
                  <Route path="tree" element={<FamilyTree />} />
                  <Route path="requests" element={<AdminEditRequests />} />
                  <Route path="*" element={<div style={{ padding: '4rem', textAlign: 'center' }}>Chức năng đang xây dựng...</div>} />
                </Route>
              </Route>

              <Route path="*" element={
                <>
                  <Navbar />
                  <main className="main-content">
                    <div style={{ padding: '4rem', textAlign: 'center' }}>Trang không tồn tại.</div>
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
