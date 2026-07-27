import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useFamily } from '../hooks/useFamily';
import { BookOpen, Bell, User, LogOut, Menu, X, ChevronDown, LayoutGrid, Users } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { fetchFamilies } from '../store/slices/familiesSlice';
import { mockRoleLabels } from '../data/mockAuth';
import defaultAvatar from '../assets/avatar-female.svg';
import '../css/components/Navbar.css';

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
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

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchFamilies());
    }
  }, [dispatch, isAuthenticated]);

  const currentFamilyId = useFamily();

  const handleNavClick = (path) => {
    setIsMobileMenuOpen(false);
    navigate(path);
  };

  const { list: userFamilies } = useSelector((state) => state.families);

  const navGroups = [
    {
      name: 'Danh sách gia phả',
      isFamilySelector: true,
    },
    ...(currentFamilyId ? [{
      name: 'Hoạt động',
      items: [
        { name: 'Bài viết', path: 'posts' },
        { name: 'Sự kiện', path: 'events' },
        { name: 'Thư viện ảnh', path: 'gallery' },
      ]
    }] : [])
  ];

  const handleAuthClick = async () => {
    if (isAuthenticated) {
      setIsUserMenuOpen(!isUserMenuOpen);
    } else {
      setIsMobileMenuOpen(false);
      navigate('/login');
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    setIsUserMenuOpen(false);
    setShowLogoutConfirm(false);
    navigate('/login');
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

        <Link to={currentFamilyId ? `/${currentFamilyId}/home` : '/admin/families'} className="nav-logo" onClick={() => setIsMobileMenuOpen(false)}>
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
              <div className={`dropdown-menu ${openDropdown === index ? 'show' : ''} ${group.isFamilySelector ? 'family-list-dropdown' : ''}`}>
                {group.isFamilySelector ? (
                  userFamilies.map(fam => (
                    <div key={fam.id} className="family-item-group">
                      <div className="family-item-title">{fam.name}</div>
                      <div className="family-item-actions">
                        <button 
                          className="dropdown-item sub-action"
                          onClick={() => handleNavClick(`/${fam.id}/family-tree`)}
                        >
                          Xem cây
                        </button>
                        <button 
                          className="dropdown-item sub-action"
                          onClick={() => handleNavClick(`/admin/families/${fam.id}/members`)}
                        >
                          Quản lý
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  group.items.map((item, idx) => {
                    const targetPath = `/${currentFamilyId}/${item.path}`;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleNavClick(targetPath)}
                        className={`dropdown-item ${location.pathname.includes(item.path) ? 'active' : ''}`}
                      >
                        {item.name}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          ))}

          {/* Direct link for Kinship Lookup placed after dropdowns */}
          <button
            className={`nav-link direct-link ${location.pathname === '/kinship-lookup' ? 'active' : ''}`}
            onClick={() => handleNavClick('/kinship-lookup')}
          >
            Tra cứu xưng hô
          </button>
        </div>

        <div className="nav-actions">
          <button className="icon-btn notification-btn" aria-label="Thông báo" onClick={() => navigate('/notifications')}>
            <Bell size={20} />
            <span className="notification-dot"></span>
          </button>

          {!isAuthenticated && (
            <div className="auth-btn-group">
              <button
                type="button"
                className="login-btn"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  navigate('/login');
                }}
              >
                Đăng nhập
              </button>
              <button
                type="button"
                className="register-btn"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  navigate('/register');
                }}
              >
                Đăng ký
              </button>
            </div>
          )}

          <div className="user-menu-container" ref={userMenuRef}>
            <button className="avatar-btn" aria-label="Tài khoản" onClick={handleAuthClick}>
              <img
                src={user?.avatar || defaultAvatar}
                alt={user?.name || 'Avatar người dùng'}
                className="avatar-img"
              />
            </button>

            {/* User Dropdown Menu */}
            {isAuthenticated && isUserMenuOpen && (
              <div className="user-dropdown-menu">
                <div className="user-dropdown-header">
                  <strong>{user?.name}</strong>
                  <span>{mockRoleLabels[user?.role] || 'Khách'}</span>
                </div>
                <button className="user-dropdown-item" onClick={() => { setIsUserMenuOpen(false); navigate('/admin/families'); }}>
                  <LayoutGrid size={16} /> Bảng điều khiển
                </button>
                <button className="user-dropdown-item" onClick={() => { setIsUserMenuOpen(false); navigate('/pages/profile/me'); }}>
                  <Users size={16} /> Thông tin cá nhân
                </button>
                <div className="user-dropdown-divider"></div>
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
