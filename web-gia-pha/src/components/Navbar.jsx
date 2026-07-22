import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, Bell, User, LogOut, Menu, X, ChevronDown, LayoutGrid } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { login, logout } from '../store/slices/authSlice';
import { mockCurrentUser } from '../data/mockAuth';
import { POST_ROLE_LABELS } from '../types/posts';
import '../css/components/Navbar.css';

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  
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
        { name: 'Bài viết', path: '/posts' },
        { name: 'Sự kiện', path: '/events' },
        { name: 'Thư viện ảnh', path: '/gallery' },
      ]
    }
  ];

  const handleAuthClick = () => {
    if (isAuthenticated) {
      setIsUserMenuOpen(!isUserMenuOpen);
    } else {
      dispatch(login(mockCurrentUser));
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    setIsUserMenuOpen(false);
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
        {isMobileMenuOpen && <div className="sidebar-overlay" onClick={() => setIsMobileMenuOpen(false)}></div>}

        <div className={`nav-links ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          {/* Nút đóng cho Sidebar */}
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

              {/* Dropdown Menu */}
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
            <button className="avatar-btn" aria-label="Tài khoản" onClick={handleAuthClick}>
              {isAuthenticated ? (
                <>
                  <User size={18} />
                  <span className="hide-mobile" style={{ fontSize: '0.875rem', fontWeight: 500 }}>{user?.name}</span>
                  <ChevronDown size={14} className="hide-mobile" style={{ marginLeft: '4px' }} />
                </>
              ) : (
                <>
                  <User size={18} />
                  <span className="hide-mobile" style={{ fontSize: '0.875rem', fontWeight: 500 }}>Đăng nhập</span>
                </>
              )}
            </button>

            {/* User Dropdown Menu */}
            {isAuthenticated && isUserMenuOpen && (
              <div className="user-dropdown-menu">
                <div className="user-dropdown-header">
                  <strong>{user?.name}</strong>
                  <span>{POST_ROLE_LABELS[user?.role] || 'Khách'}</span>
                </div>
                <button className="user-dropdown-item" onClick={() => { setIsUserMenuOpen(false); navigate('/admin'); }}>
                  <LayoutGrid size={16} /> Bảng điều khiển
                </button>
                <div className="user-dropdown-divider"></div>
                <button className="user-dropdown-item text-danger" onClick={handleLogout}>
                  <LogOut size={16} /> Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
