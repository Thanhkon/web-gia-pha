import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import '../css/pages/PublicHome.css';

const PublicHome = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);

  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  return (
    <div className="public-home-page animate-fade-in">
      <section className="public-hero">
        <div className="container public-home-content">
          <h1>Web Gia Phả</h1>
          <p>
            Chào mừng bạn đến với trang công khai của Web Gia Phả. Vui lòng đăng nhập để truy cập
            nội dung chính và quản lý dữ liệu gia phả.
          </p>
        </div>
      </section>
    </div>
  );
};

export default PublicHome;
