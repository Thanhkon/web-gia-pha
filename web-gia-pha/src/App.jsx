import React, { lazy, Suspense } from "react";
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import PublicNavbar from "./components/PublicNavbar";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./layouts/AdminLayout";
import ErrorBoundary from "./ErrorBoundary";
import Setting from "./pages/setting/Setting";
import ChangePassword from "./pages/setting/ChangePassword";
import ForgotPassword from "./pages/setting/ForgotPassword";
import Privacy from "./pages/setting/Privacy";
import Notifications from "./pages/setting/Notifications";
import { Toaster } from "react-hot-toast";
import { Loader2 } from "lucide-react";
import "./App.css";

// Lazy load các trang nặng để giảm initial bundle size
const Home = lazy(() => import("./pages/Home"));
const PublicHome = lazy(() => import("./pages/PublicHome"));
const FamilyTree = lazy(() => import("./pages/FamilyTree"));
const AdminMembers = lazy(() => import("./pages/admin/AdminMembers"));
const EditRequests = lazy(() => import("./pages/EditRequests"));
const AdminEditRequests = lazy(() => import("./pages/admin/AdminEditRequests"));
const AdminDashboardSettings = lazy(
    () => import("./pages/admin/AdminDashboardSettings"),
);
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
              <Route path="/admin" element={<ProtectedRoute />}>
                <Route element={<AdminLayout />}>
                  <Route index element={<Navigate to="families" replace />} />
                  <Route path="families" element={<FamilyList />} />
                  <Route path="families/:familyId">
                    <Route index element={<Navigate to="members" replace />} />
                    <Route path="members" element={<AdminMembers />} />
                    <Route path="tree" element={<FamilyTree />} />
                    <Route path="requests" element={<AdminEditRequests />} />
                    <Route path="events" element={<Events />} />
                    <Route path="posts" element={<Posts />} />
                    <Route path="gallery" element={<Gallery />} />
                    <Route path="dashboard-settings" element={<AdminDashboardSettings />} />
                  </Route>
                  <Route path="settings" element={<Setting />}>
                    <Route index element={<Navigate to="security" replace />} />
                    <Route path="security" element={<ChangePassword />} />
                    <Route path="forgot" element={<ForgotPassword />} />
                    <Route path="privacy" element={<Privacy />} />
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
              <Route path="/:familyId">
                <Route index element={<Navigate to="home" replace />} />
                <Route path="home" element={<ProtectedRoute />}>
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
                <Route path="family-tree" element={
                  <>
                    <Navbar />
                    <main className="main-content"><FamilyTree /></main>
                  </>
                } />
                <Route path="edit-requests" element={
                  <>
                    <Navbar />
                    <main className="main-content"><EditRequests /></main>
                  </>
                } />
                <Route path="members" element={
                  <>
                    <Navbar />
                    <main className="main-content"><PublicMembers /></main>
                  </>
                } />
                <Route path="posts" element={
                  <>
                    <Navbar />
                    <main className="main-content"><Posts /></main>
                  </>
                } />
                <Route path="posts/new" element={
                  <>
                    <Navbar />
                    <main className="main-content"><PostEditor mode="create" /></main>
                  </>
                } />
                <Route path="posts/:id" element={
                  <>
                    <Navbar />
                    <main className="main-content"><PostDetail /></main>
                  </>
                } />
                <Route path="posts/:id/edit" element={
                  <>
                    <Navbar />
                    <main className="main-content"><PostEditor mode="edit" /></main>
                  </>
                } />
                <Route path="events" element={
                  <>
                    <Navbar />
                    <main className="main-content"><Events /></main>
                  </>
                } />
                <Route path="gallery" element={
                  <>
                    <Navbar />
                    <main className="main-content"><Gallery /></main>
                  </>
                } />
                <Route path="albums/:albumId" element={
                  <>
                    <Navbar />
                    <main className="main-content"><GalleryDetail /></main>
                  </>
                } />
                <Route path="albums" element={<Navigate to="../gallery" replace />} />
                <Route path="kinship-lookup" element={
                  <>
                    <Navbar />
                    <main className="main-content"><KinshipLookup /></main>
                  </>
                } />

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
