import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, Bell, LogOut, Menu, X, ChevronDown, LayoutGrid, Users, Settings } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import defaultAvatar from '../assets/avatar-female.svg';
import '../css/components/Navbar.css';

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleNavClick = (path) => {
    setIsMobileMenuOpen(false);
    navigate(path);
  };

  const navGroups = [
    {
      name: 'Gia Phả',
      items: [
        { name: 'Sơ đồ gia phả', path: '/family-tree' },
        { name: 'Danh sách Thành viên', path: '/members' },
        { name: 'Gửi yêu cầu sửa', path: '/edit-requests' },
      ]
    },
    {
      name: 'Hoạt động',
      items: [
        { name: 'Tin tức', path: '/posts' },
        { name: 'Sự kiện', path: '/events' },
        { name: 'Thư viện ảnh', path: '/gallery' },
      ]
    }
  ];

  const handleLogout = () => {
    dispatch(logout());
    setIsUserMenuOpen(false);
    setShowLogoutConfirm(false);
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  const toggleDropdown = (index) => {
    if (openDropdown === index) {
      setOpenDropdown(null);
    } else {
      setOpenDropdown(index);
    }
  };

  return (
    <nav className="navbar">
      <div className="container nav-container">

        {/* Nút Hamburger cho Mobile */}
        <button
          className="mobile-menu-btn icon-btn"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <Link to="/" className="nav-logo" onClick={() => setIsMobileMenuOpen(false)}>
          <BookOpen size={24} />
          <span>Web Gia Phả</span>
        </Link>

        {/* Lớp phủ mờ khi mở Sidebar Mobile */}
        {isMobileMenuOpen && (
          <div 
            className="sidebar-overlay" 
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
        )}

        <div className={`nav-links ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          <div className="sidebar-header">
            <h3>Menu</h3>
            <button className="icon-btn" onClick={() => setIsMobileMenuOpen(false)}>
              <X size={24} />
            </button>
          </div>

          {navGroups.map((group, index) => (
            <div
              key={index}
              className="nav-dropdown"
              onMouseEnter={() => window.innerWidth > 768 && setOpenDropdown(index)}
              onMouseLeave={() => window.innerWidth > 768 && setOpenDropdown(null)}
            >
              <button
                className={`nav-link dropdown-toggle ${openDropdown === index ? 'active' : ''}`}
                onClick={() => window.innerWidth <= 768 && toggleDropdown(index)}
              >
                {group.name} <ChevronDown size={16} className={`chevron ${openDropdown === index ? 'open' : ''}`} />
              </button>

              <div className={`dropdown-menu ${openDropdown === index ? 'show' : ''}`}>
                {group.items.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleNavClick(item.path)}
                    className={`dropdown-item ${location.pathname === item.path ? 'active' : ''}`}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="nav-actions">
          <button className="icon-btn notification-btn" aria-label="Thông báo" onClick={() => navigate('/notifications')}>
            <Bell size={20} />
            <span className="notification-dot"></span>
          </button>

          <div className="user-menu-container" ref={userMenuRef}>
            <button className="avatar-btn" aria-label="Tài khoản" onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}>
              <img
                src={user?.avatar || defaultAvatar}
                alt={user?.name || 'Avatar người dùng'}
                className="avatar-img"
              />
            </button>

            {isUserMenuOpen && (
              <div className="user-dropdown-menu">
                <div className="user-dropdown-header">
                  <strong>{`${user?.lastName || ''} ${user?.firstName || ''}`}</strong>
                  <span>{user?.role}</span>
                </div>

                {user?.role === "ADMIN" && (
                  <button 
                    className="user-dropdown-item" 
                    onClick={() => { 
                      setIsUserMenuOpen(false); 
                      navigate('/admin'); 
                    }}
                  >
                    <LayoutGrid size={16} /> Bảng điều khiển
                  </button>
                )}

                <button 
                  className="user-dropdown-item" 
                  onClick={() => { 
                    setIsUserMenuOpen(false); 
                    navigate('/pages/profile/me'); 
                  }}
                >
                  <Users size={16} /> Thông tin cá nhân
                </button>

                <button 
                  className="user-dropdown-item" 
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    navigate('/admin/settings');
                  }}
                >
                  <Settings size={17} /> Cài đặt chung
                </button>

                <button className="user-dropdown-item text-danger" onClick={() => {
                  setIsUserMenuOpen(false);
                  setShowLogoutConfirm(true);
                }}>
                  <LogOut size={16} /> Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showLogoutConfirm && (
        <div className="logout-confirm-backdrop" onClick={() => setShowLogoutConfirm(false)}>
          <div className="logout-confirm-modal" onClick={(event) => event.stopPropagation()}>
            <p className="logout-confirm-text">Bạn có chắc chắn muốn đăng xuất?</p>
            <div className="logout-confirm-actions">
              <button type="button" className="logout-cancel-btn" onClick={() => setShowLogoutConfirm(false)}>
                Quay lại
              </button>
              <button type="button" className="logout-confirm-btn" onClick={handleLogout}>
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;