import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Users, FileText, Settings, LogOut, Menu, GitMerge, Home, Edit3 } from 'lucide-react';
import { logout } from '../store/slices/authSlice';
import { selectPendingCount } from '../store/slices/editRequestsSlice';
import '../css/layouts/AdminLayout.css';

const AdminLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const pendingRequestsCount = useSelector(selectPendingCount);

  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  return (
    <div className={`admin-layout ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <button className="toggle-sidebar-btn" onClick={() => setIsCollapsed(!isCollapsed)}>
            <Menu size={24} />
          </button>
          {!isCollapsed && <span>Bảng điều khiển</span>}
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/admin/members" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} title="Quản lý Thành viên">
            <Users size={18} /> {!isCollapsed && <span>Quản lý Thành viên</span>}
          </NavLink>
          <NavLink to="/admin/tree" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} title="Xem Cây Phả Hệ">
            <GitMerge size={18} /> {!isCollapsed && <span>Xem Cây Phả Hệ</span>}
          </NavLink>
          <NavLink to="/admin/requests" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} title="Yêu cầu chỉnh sửa">
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
          <NavLink to="/admin/content" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} title="Bài viết & Sự kiện">
            <FileText size={18} /> {!isCollapsed && <span>Bài viết & Sự kiện</span>}
          </NavLink>
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
          <button className="sidebar-link logout-btn" onClick={handleLogout} title="Đăng xuất">
            <LogOut size={18} /> {!isCollapsed && <span>Đăng xuất</span>}
          </button>
          <button className="sidebar-link back-home-btn" onClick={() => navigate('/')} title="Về Trang chủ">
            <Home size={18} /> {!isCollapsed && <span>Về Trang chủ</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
