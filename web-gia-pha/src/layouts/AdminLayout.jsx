import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useFamily } from '../hooks/useFamily';
import { useDispatch, useSelector } from 'react-redux';
import { CalendarDays, Edit3, FileText, GitMerge, Home, Images, LogOut, Menu, Settings, Users, BookOpen } from 'lucide-react';
import { logout } from '../store/slices/authSlice';
import { selectPendingCount, fetchRequests } from '../store/slices/editRequestsSlice';
import '../css/layouts/AdminLayout.css';

const AdminLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const familyId = useFamily();
  const { user } = useSelector((state) => state.auth);
  const pendingRequestsCount = useSelector(selectPendingCount);

  const [isCollapsed, setIsCollapsed] = useState(false);

  React.useEffect(() => {
    if (familyId) {
      dispatch(fetchRequests(familyId));
    }
  }, [dispatch, familyId]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className={`admin-layout ${isCollapsed ? 'collapsed' : ''}`}>
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <button className="toggle-sidebar-btn" onClick={() => setIsCollapsed(!isCollapsed)} type="button">
            <Menu size={24} />
          </button>
          {!isCollapsed && <span>Bảng điều khiển</span>}
        </div>

        <nav className="sidebar-nav">


          <NavLink to="/admin/families" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} title="Danh sách gia phả">
            <Home size={18} /> {!isCollapsed && <span>Danh sách gia phả</span>}
          </NavLink>
          
          {familyId && (
            <>
              <NavLink to={`/admin/families/${familyId}/members`} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} title="Quản lý Thành viên">
                <Users size={18} /> {!isCollapsed && <span>Quản lý Thành viên</span>}
              </NavLink>
              <NavLink to={`/admin/families/${familyId}/tree`} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} title="Xem Cây Phả Hệ">
                <GitMerge size={18} /> {!isCollapsed && <span>Xem Cây Phả Hệ</span>}
              </NavLink>
              <NavLink to={`/admin/families/${familyId}/requests`} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} title="Yêu cầu chỉnh sửa">
                <Edit3 size={18} /> 
                {!isCollapsed && (
                  <div className="sidebar-link-content">
                    <span>Yêu cầu chỉnh sửa</span>
                    {pendingRequestsCount > 0 && (
                      <span className="sidebar-badge">
                        {pendingRequestsCount}
                      </span>
                    )}
                  </div>
                )}
                {isCollapsed && pendingRequestsCount > 0 && (
                  <span className="sidebar-badge-dot"></span>
                )}
              </NavLink>
              <NavLink to={`/admin/families/${familyId}/events`} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} title="Quản lý sự kiện">
                <CalendarDays size={18} /> {!isCollapsed && <span>Quản lý sự kiện</span>}
              </NavLink>
              <NavLink to={`/admin/families/${familyId}/posts`} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} title="Quản lý bài viết">
                <FileText size={18} /> {!isCollapsed && <span>Quản lý bài viết</span>}
              </NavLink>
              <NavLink to={`/admin/families/${familyId}/gallery`} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} title="Quản lý thư viện ảnh">
                <Images size={18} /> {!isCollapsed && <span>Quản lý thư viện ảnh</span>}
              </NavLink>
              <NavLink to={`/admin/families/${familyId}/dashboard-settings`} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} title="Cấu hình Trang chủ">
                <Settings size={18} /> {!isCollapsed && <span>Cấu hình Trang chủ</span>}
              </NavLink>
            </>
          )}
          <NavLink to="/admin/settings" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} title="Cài đặt chung">
            <Settings size={18} /> {!isCollapsed && <span>Cài đặt chung</span>}
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="admin-user-info">
            <div className="admin-avatar">
              {user?.name?.charAt(0) || 'A'}
            </div>
            {!isCollapsed && <div className="admin-name">{user?.name || 'Admin'}</div>}
          </div>
          <button className="sidebar-link logout-btn" onClick={handleLogout} title="Đăng xuất" type="button">
            <LogOut size={18} /> {!isCollapsed && <span>Đăng xuất</span>}
          </button>
          <button className="sidebar-link back-home-btn" onClick={() => navigate(familyId ? `/${familyId}/home` : '/')} title="Về trang chủ" type="button">
            <Home size={18} /> {!isCollapsed && <span>Về trang chủ</span>}
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
