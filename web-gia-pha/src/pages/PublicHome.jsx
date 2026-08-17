import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Link } from 'react-router-dom';
import '../css/pages/PublicHome.css';

const PublicHome = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  if (isAuthenticated) {
    const activeFamilyId = user?.preferredFamilyId;
    if (activeFamilyId) {
      return <Navigate to={`/${activeFamilyId}/home`} replace />;
    }
    return <Navigate to="/admin/families" replace />;
  }

  return (
    <div className="public-home-page animate-fade-in">
      {/* Hero Section */}
      <section className="public-hero">
        <div className="public-hero-overlay"></div>
        <div className="container public-home-content">
          <h1>Lưu Giữ Cội Nguồn – Kết Nối Thế Hệ</h1>
          <p>
            Nơi lưu trữ lịch sử dòng họ, xây dựng cây gia phả trực quan và kết nối các thành viên gia đình mọi lúc, mọi nơi.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="btn btn-primary">Tạo Gia Phả Ngay</Link>
            <Link to="/login" className="btn btn-outline">Đăng Nhập</Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="public-features container">
        <div className="feature-card">
          <div className="feature-icon">🌳</div>
          <h3>Cây Gia Phả Trực Quan</h3>
          <p>Dễ dàng khởi tạo, quản lý và theo dõi sơ đồ các thế hệ trong dòng họ.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🔒</div>
          <h3>Bảo Mật Quyền Riêng Tư</h3>
          <p>Thông tin dòng họ được bảo vệ an toàn, chỉ chia sẻ cho các thành viên được cấp quyền.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">📜</div>
          <h3>Lưu Giữ Lịch Sử</h3>
          <p>Ghi chép tiểu sử, ngày giỗ, sự kiện quan trọng và hình ảnh tư liệu của tổ tiên.</p>
        </div>
      </section>

      {/* Social Proof / Stats */}
      <section className="public-stats">
        <div className="container stats-grid">
          <div className="stat-item">
            <h4>1,000+</h4>
            <p>Dòng họ tin dùng</p>
          </div>
          <div className="stat-item">
            <h4>50,000+</h4>
            <p>Thành viên kết nối</p>
          </div>
          <div className="stat-item">
            <h4>100%</h4>
            <p>Lưu trữ an toàn</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PublicHome;