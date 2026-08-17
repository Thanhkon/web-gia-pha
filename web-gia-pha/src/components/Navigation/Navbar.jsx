import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useFamily } from '../../hooks/useFamily';
import { LogOut, Menu, X, ChevronDown, LayoutGrid, Users, Settings, Home } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { fetchFamilies } from '../../store/slices/familiesSlice';
import { selectPendingCount, fetchRequests } from '../../store/slices/editRequestsSlice';
import { mockRoleLabels } from '../../data/mockAuth';
import defaultAvatar from '../../assets/avatar-female.svg';
import { getAvatarUrl } from '../../utils/imageHelper';
import LogoutConfirmModal from '../common/LogoutConfirmModal';
import NotificationBell from '../Notifications/NotificationBell';
import logoImg from '../../assets/logo.png';
import '../../css/components/Navbar.css';

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { primaryFamilyId } = useSelector((state) => state.settings);
  const { list: userFamilies } = useSelector((state) => state.families);
  const pendingRequestsCount = useSelector(selectPendingCount);
  
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

  const currentFamilyId = useFamily();

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchFamilies());
    }
    if (currentFamilyId) {
      dispatch(fetchRequests(currentFamilyId));
    }
  }, [dispatch, isAuthenticated, currentFamilyId]);

  // Convert to Number for strict equality checks, since useParams returns string
  const activeFamilyId = currentFamilyId ? Number(currentFamilyId) : (primaryFamilyId || (userFamilies?.length > 0 ? userFamilies[0].id : null));
  const activeFamily = userFamilies?.find(f => f.id === activeFamilyId);




  const handleNavClick = (path) => {
    setIsMobileMenuOpen(false);
    navigate(path);
  };

  const navGroups = [
    ...(currentFamilyId ? [
      {
        name: 'Gia phả',
        items: [
          { name: 'Danh sách thành viên', path: `/${currentFamilyId}/members` },
          { name: 'Sơ đồ cây', path: `/${currentFamilyId}/family-tree` },
          { 
            name: pendingRequestsCount > 0 ? `Yêu cầu chỉnh sửa (${pendingRequestsCount})` : 'Yêu cầu chỉnh sửa', 
            path: `/${currentFamilyId}/edit-requests` 
          },
        ]
      },
      {
        name: 'Hoạt động',
        items: [
          { name: 'Bài viết', path: `/${currentFamilyId}/posts` },
          { name: 'Sự kiện', path: `/${currentFamilyId}/events` },
          { name: 'Thư viện ảnh', path: `/${currentFamilyId}/gallery` },
        ]
      }
    ] : [])
  ];


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

        <div className="nav-logo" style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '280px' }}>
          <img src={logoImg} alt="Logo" style={{ height: '32px', width: 'auto', objectFit: 'contain' }} />
          {userFamilies?.length > 1 ? (
            <div 
              className="nav-dropdown" 
              onMouseEnter={() => window.innerWidth > 768 && setOpenDropdown('switcher')}
              onMouseLeave={() => window.innerWidth > 768 && setOpenDropdown(null)}
              style={{ margin: 0 }}
            >
              <button
                className={`nav-link dropdown-toggle ${openDropdown === 'switcher' ? 'active' : ''}`}
                onClick={() => toggleDropdown('switcher')}
                style={{ fontSize: '1.25rem', fontWeight: '700', padding: 0, color: 'inherit', display: 'flex', alignItems: 'center' }}
              >
                <span style={{ maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {activeFamily ? activeFamily.name : 'Web Gia Phả'}
                </span>
                <ChevronDown size={16} className={`chevron ${openDropdown === 'switcher' ? 'open' : ''}`} style={{ marginLeft: '4px', flexShrink: 0 }} />
              </button>

              <div className={`dropdown-menu ${openDropdown === 'switcher' ? 'show' : ''}`} style={{ left: 0, right: 'auto', minWidth: '200px' }}>
                {userFamilies.map(fam => (
                  <button
                    key={fam.id}
                    onClick={() => {
                      setOpenDropdown(null);
                      navigate(`/${fam.id}/home`);
                    }}
                    className={`dropdown-item ${activeFamilyId === fam.id ? 'active' : ''}`}
                    style={{ textAlign: 'left', fontWeight: 'normal' }}
                  >
                    {fam.name}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <Link to={activeFamilyId ? `/${activeFamilyId}/home` : '/admin/families'} onClick={() => setIsMobileMenuOpen(false)} style={{ color: 'inherit', textDecoration: 'none' }}>
              <span>{activeFamily ? activeFamily.name : 'Web Gia Phả'}</span>
            </Link>
          )}
        </div>

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

              {/* Dropdown Menu */}
              <div className={`dropdown-menu ${openDropdown === index ? 'show' : ''}`}>
                {group.items.map((item, idx) => {
                  return (
                    <button
                      key={idx}
                      onClick={() => handleNavClick(item.path)}
                      className={`dropdown-item ${location.pathname === item.path ? 'active' : ''}`}
                    >
                      {item.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Direct link for Kinship Lookup placed after dropdowns */}
          <button
            className={`nav-link direct-link ${location.pathname.includes('/kinship-lookup') ? 'active' : ''}`}
            onClick={() => handleNavClick(`/${currentFamilyId}/kinship-lookup`)}
          >
            Tra cứu xưng hô
          </button>
        </div>

        <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: '280px', justifyContent: 'flex-end' }}>
          <NotificationBell isAuthenticated={isAuthenticated} activeFamilyId={currentFamilyId} />

          <div className="user-menu-container" ref={userMenuRef}>
            <button className="avatar-btn" aria-label="Tài khoản" onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}>
              <img
                src={getAvatarUrl(user?.avatar || user?.avatarUrl) || defaultAvatar}
                alt={user?.name || 'Avatar người dùng'}
                className="avatar-img"
              />
            </button>

            {isUserMenuOpen && (
              <div className="user-dropdown-menu">
                <div className="user-dropdown-header">
                  <strong>{user?.name || `${user?.lastName || ''} ${user?.firstName || ''}`}</strong>
                  <span>{mockRoleLabels[activeFamily?.role || user?.role] || activeFamily?.role || user?.role || 'Khách'}</span>
                </div>
                
                <button className="user-dropdown-item" onClick={() => { setIsUserMenuOpen(false); navigate('/admin/families'); }}>
                  <LayoutGrid size={16} /> Bảng điều khiển
                </button>

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

                <button 
                  className="user-dropdown-item" 
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    navigate('/');
                  }}
                >
                  <Home size={17} /> Về trang chủ
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

      <LogoutConfirmModal 
        show={showLogoutConfirm} 
        onClose={() => setShowLogoutConfirm(false)} 
        onConfirm={handleLogout} 
      />
    </nav>
  );
};

export default Navbar;