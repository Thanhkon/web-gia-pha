import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Menu, X } from 'lucide-react';
import '../../css/components/Navbar.css';

const PublicNavbar = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
        </div>

        {/* <div className="nav-actions">
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
        </div> */}

      </div>
    </nav>
  );
};

export default PublicNavbar;