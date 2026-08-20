import React, { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navigation/Navbar";
import PublicNavbar from "./components/Navigation/PublicNavbar";
import ProtectedRoute from "./components/Navigation/ProtectedRoute";
import AdminLayout from "./layouts/AdminLayout";
import FamilyLayout from "./layouts/FamilyLayout";
import ErrorBoundary from "./ErrorBoundary";
import Setting from "./pages/setting/Setting";
import ChangePassword from "./pages/setting/ChangePassword";
import ForgotPassword from "./pages/setting/ForgotPassword";
import PreferredFamily from "./pages/setting/PreferredFamily";
import Notifications from "./pages/setting/Notifications";
import { Toaster } from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import "./App.css";

// Lazy load các trang nặng để giảm initial bundle size
const Home = lazy(() => import("./pages/Home"));
const PublicHome = lazy(() => import("./pages/PublicHome"));
const FamilyTree = lazy(() => import("./pages/FamilyTree"));
const AdminMembers = lazy(() => import("./pages/admin/AdminMembers"));
const EditRequests = lazy(() => import("./pages/EditRequests"));
const AdminEditRequests = lazy(() => import("./pages/admin/AdminEditRequests"));
const AdminJoinRequests = lazy(() => import("./pages/admin/AdminJoinRequests"));
const AdminDashboardSettings = lazy(() => import("./pages/admin/AdminDashboardSettings"));
const AdminActivityLog = lazy(() => import("./pages/admin/AdminActivityLog"));
const PublicMembers = lazy(() => import("./pages/PublicMembers"));
const Posts = lazy(() => import("./pages/Posts"));
const PostDetail = lazy(() => import("./pages/PostDetail"));
const PostEditor = lazy(() => import("./pages/PostEditor"));
const Events = lazy(() => import("./pages/Events"));
const Gallery = lazy(() => import("./pages/Gallery"));
const GalleryDetail = lazy(() => import("./pages/GalleryDetail"));
const KinshipLookup = lazy(() => import("./pages/KinshipLookup"));
const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));
const AuthForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const FamilyList = lazy(() => import("./pages/FamilyList"));
const ProfilePage = lazy(() => import("./pages/Profile"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

const PageLoader = () => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "80vh",
      color: "var(--text-muted)",
      fontSize: "1rem",
      gap: "8px",
    }}
  >
    <Loader2 size={24} className="spin-icon" /> Đang tải...
  </div>
);

// prettier-ignore
const App = () => {
  return (
    <ErrorBoundary>
      <Toaster position="top-right" />
      <SpeedInsights />
      <Router>
        <Suspense fallback={<PageLoader />}>
          <div className="app-container">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={
                <>
                  <PublicNavbar />
                  <main className="main-content"><PublicHome /></main>
                </>
              } />
              {/* Global Routes outside of family context */}
              <Route path="/login" element={
                <>
                  <PublicNavbar />
                  <main className="main-content"><Login /></main>
                </>
              } />
              <Route path="/register" element={
                <>
                  <PublicNavbar />
                  <main className="main-content"><Register /></main>
                </>
              } />
              <Route path="/reset-password" element={
                <>
                  <PublicNavbar />
                  <main className="main-content"><ResetPassword /></main>
                </>
              } />
              <Route path="/forgot-password" element={
                <>
                  <PublicNavbar />
                  <main className="main-content"><AuthForgotPassword /></main>
                </>
              } />
              <Route path="/admin" element={<ProtectedRoute />}>
                <Route element={<AdminLayout />}>
                  <Route index element={<Navigate to="families" replace />} />
                  <Route path="families" element={<FamilyList />} />
                  <Route path="families/:familyId">
                    <Route index element={<Navigate to="members" replace />} />
                    <Route path="members" element={<AdminMembers />} />
                    <Route path="tree" element={<FamilyTree />} />
                    <Route path="requests" element={<AdminEditRequests />} />
                    <Route path="join-requests" element={<AdminJoinRequests />} />
                    <Route path="events" element={<Events />} />
                    <Route path="posts" element={<Posts />} />
                    <Route path="gallery" element={<Gallery />} />
                    <Route path="dashboard-settings" element={<AdminDashboardSettings />} />
                    <Route path="activity-logs" element={<AdminActivityLog />} />
                  </Route>
                  <Route path="settings" element={<Setting />}>
                    <Route index element={<Navigate to="security" replace />} />
                    <Route path="security" element={<ChangePassword />} />
                    <Route path="forgot" element={<ForgotPassword />} />
                    <Route path="preferred-family" element={<PreferredFamily />} />
                    <Route path="notifications" element={<Notifications />} />
                  </Route>
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Route>
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

              {/* Family Context Routes */}
              <Route path="/:familyId" element={<ProtectedRoute />}>
                <Route element={<FamilyLayout />}>
                  <Route index element={<Navigate to="home" replace />} />
                  <Route path="home" element={<Home />} />
                  <Route path="family-tree" element={<FamilyTree />} />
                  <Route path="edit-requests" element={<EditRequests />} />
                  <Route path="members" element={<PublicMembers />} />
                  <Route path="posts" element={<Posts />} />
                  <Route path="posts/new" element={<PostEditor mode="create" />} />
                  <Route path="posts/:id" element={<PostDetail />} />
                  <Route path="posts/:id/edit" element={<PostEditor mode="edit" />} />
                  <Route path="events" element={<Events />} />
                  <Route path="gallery" element={<Gallery />} />
                  <Route path="albums/:albumId" element={<GalleryDetail />} />
                  <Route path="albums" element={<Navigate to="../gallery" replace />} />
                  <Route path="kinship-lookup" element={<KinshipLookup />} />
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
