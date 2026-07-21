import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Construction, Home, ArrowLeft } from 'lucide-react';
import '../css/pages/NotFoundPage.css';

const NotFoundPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // If path includes 'admin' but isn't explicitly 404, we can say it's under construction
  const isUnderConstruction = location.pathname.includes('/admin/content') || 
                              location.pathname.includes('/admin/settings') ||
                              location.pathname.includes('/posts') ||
                              location.pathname.includes('/events') ||
                              location.pathname.includes('/gallery') ||
                              location.pathname.includes('/albums') ||
                              location.pathname.includes('/notifications');

  return (
    <div className="not-found-container">
      <Construction size={80} className="not-found-icon" />
      <h2 className="not-found-title">
        {isUnderConstruction ? 'Tính năng đang được xây dựng' : 'Không tìm thấy trang'}
      </h2>
      <p className="not-found-text">
        {isUnderConstruction 
          ? 'Chúng tôi đang nỗ lực hoàn thiện chức năng này. Vui lòng quay lại sau!' 
          : 'Đường dẫn bạn truy cập không tồn tại hoặc đã bị di chuyển.'}
      </p>
      <div className="not-found-actions">
        <button className="btn btn-outline" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} className="not-found-btn-icon" /> Quay lại
        </button>
        <button className="btn btn-primary" onClick={() => navigate('/')}>
          <Home size={18} className="not-found-btn-icon" /> Về trang chủ
        </button>
      </div>
    </div>
  );
};

export default NotFoundPage;
