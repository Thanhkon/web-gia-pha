import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  GitMerge, FileText, Image,
  Calendar, BookOpen, Clock, ChevronRight, Edit3
} from 'lucide-react';
import MarqueeBanner from '../components/MarqueeBanner';
import '../css/pages/Home.css';

const Home = () => {
  const navigate = useNavigate();

  // Lấy cấu hình tuỳ chỉnh (Settings) từ Redux
  const { hero, marqueeItems } = useSelector((state) => state.settings);

  // Lấy Business Data từ Redux
  const events = useSelector((state) => state.events.data);
  const posts = useSelector((state) => state.posts.data);
  const albums = useSelector((state) => state.albums.data);

  return (
    <div className="home-page animate-fade-in">

      {/* Marquee Banner */}
      {marqueeItems && marqueeItems.length > 0 && (
        <MarqueeBanner items={marqueeItems} />
      )}

      {/* Hero Section */}
      <section
        className="hero-section"
        style={{ backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.6)), url('${hero.bgImage}')` }}
      >
        <div className="container hero-content">
          <div className="hero-logo">
            <BookOpen size={48} />
          </div>
          <h1 className="hero-title">{hero.title}</h1>
          <p className="hero-subtitle">
            {hero.subtitle}
          </p>
          <div className="quick-actions-row">
            <button className="btn btn-primary" onClick={() => navigate('/family-tree')}>
              <GitMerge size={18} /> Phả Đồ
            </button>
            <button className="btn btn-glass" onClick={() => navigate('/events')}>
              <Calendar size={18} /> Sự Kiện
            </button>
            <button className="btn btn-glass" onClick={() => navigate('/posts')}>
              <FileText size={18} /> Bài Viết
            </button>
            <button className="btn btn-glass" onClick={() => navigate('/albums')}>
              <Image size={18} /> Thư Viện
            </button>
            <button className="btn btn-glass" onClick={() => navigate('/edit-requests')}>
              <Edit3 size={18} /> Gửi Yêu Cầu
            </button>
          </div>
        </div>
      </section>


      {/* Main Content Dashboard */}
      <section className="content-section">
        <div className="dashboard-grid">

          {/* Column 1: Events */}
          <div className="panel">
            <div className="panel-header">
              <Calendar size={24} />
              <h2 className="panel-title">Sự kiện & Ngày giỗ</h2>
            </div>
            <div className="panel-body">
              {events.length === 0 ? (
                <p className="panel-empty">Chưa có sự kiện nào được lên lịch.</p>
              ) : (
                events.map((event) => (
                  <div key={event.id} className="event-item">
                    <div className="event-date">
                      <span>{event.date}</span>
                      <span>{event.month}</span>
                    </div>
                    <div className="event-info">
                      <h4>{event.title}</h4>
                      <p>{event.type} • {event.desc}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <button className="btn btn-outline btn-full-width" onClick={() => navigate('/events')}>
              Xem tất cả <ChevronRight size={16} />
            </button>
          </div>

          {/* Column 2: Posts */}
          <div className="panel">
            <div className="panel-header">
              <FileText size={24} />
              <h2 className="panel-title">Bài viết mới nhất</h2>
            </div>
            <div className="panel-body">
              {posts.length === 0 ? (
                <p className="panel-empty">Chưa có bài viết nào.</p>
              ) : (
                posts.map((post) => (
                  <div key={post.id} className="article-item">
                    <h4 className="article-title">{post.title}</h4>
                    <div className="article-meta">
                      <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
                      {post.date}
                    </div>
                  </div>
                ))
              )}
            </div>
            <button className="btn btn-outline btn-full-width" onClick={() => navigate('/posts')}>
              Đọc thêm <ChevronRight size={16} />
            </button>
          </div>

          {/* Column 3: Albums */}
          <div className="panel">
            <div className="panel-header">
              <Image size={24} />
              <h2 className="panel-title">Thư viện ảnh</h2>
            </div>
            <div className="panel-body album-grid">
              {albums.length === 0 ? (
                <p className="panel-empty">Chưa có ảnh nào trong thư viện.</p>
              ) : (
                albums.map((album) => (
                  <div key={album.id} className="album-item">
                    <img src={album.img} alt={album.title} loading="lazy" />
                    <div className="album-overlay">{album.title}</div>
                  </div>
                ))
              )}
            </div>
            <button className="btn btn-outline btn-full-width" onClick={() => navigate('/albums')}>
              Mở thư viện <ChevronRight size={16} />
            </button>
          </div>

        </div>
      </section>

    </div>
  );
};

export default Home;
