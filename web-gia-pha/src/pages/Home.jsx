import React, { useState, useEffect } from 'react';
import { useFamilyActor } from '../hooks/useFamilyActor';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import {
  GitMerge, FileText, Image,
  Calendar, Clock, ChevronRight, Edit3
} from 'lucide-react';
import MarqueeBanner from '../components/Home/MarqueeBanner';
import Skeleton from '../components/common/Skeleton';
import { getPostActor } from '../services/postService';
import { getEventActor } from '../services/eventService';
import { getGalleryActor } from '../services/galleryService';
import { fetchPosts } from '../store/slices/postsSlice';
import { fetchEvents } from '../store/slices/eventsSlice';
import { fetchAlbums } from '../store/slices/albumsSlice';
import FamilyCouncil from '../components/Home/FamilyCouncil';
import Footer from '../components/Navigation/Footer';
import logoImg from '../assets/logo.png';
import '../css/pages/Home.css';


const Home = () => {
  useEffect(() => {
    document.title = "Dashboard";
  }, []);

  const navigate = useNavigate();
  const { familyId } = useParams();
  const authUser = useFamilyActor();
  const isAuthenticated = Boolean(authUser);
  const { hero: defaultHero, marqueeItems } = useSelector((state) => state.settings);
  const { list: userFamilies } = useSelector((state) => state.families);

  // Find current family to display dynamic name
  const activeFamily = userFamilies?.find(f => f.id === Number(familyId));

  // Dữ liệu cài đặt từ backend (hoặc mặc định)
  const currentSettings = activeFamily?.settings || {};
  const familyHeroSettings = currentSettings.hero || defaultHero;
  const familyMarqueeItems = currentSettings.marqueeItems || marqueeItems || [];

  const hero = {
    title: familyHeroSettings?.title || (activeFamily ? `${activeFamily.name}` : defaultHero.title),
    subtitle: familyHeroSettings?.subtitle || defaultHero.subtitle,
    bgImage: familyHeroSettings?.bgImage || activeFamily?.coverImageUrl || activeFamily?.coverImg || defaultHero.bgImage,
  };

  // Dữ liệu động từ API (Redux Slices)
  const dispatch = useDispatch();
  
  const { list: postsList = [], loading: postsLoading } = useSelector(state => state.posts);
  const { list: allEvents = [], loading: eventsLoading } = useSelector(state => state.events);
  const { list: albumsList = [], loading: albumsLoading } = useSelector(state => state.albums);

  const isLoading = postsLoading || eventsLoading || albumsLoading;
  
  const upcomingEvents = React.useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const upcomingEnd = todayStart + 30 * 86400000;
    
    return allEvents.filter(e => {
      const start = new Date(e.startAt).getTime();
      const end = e.endAt ? new Date(e.endAt).getTime() : start;
      return start <= upcomingEnd && end >= todayStart;
    });
  }, [allEvents]);

  // Lấy dữ liệu cho trang chủ
  const posts = postsList.slice(0, 4);
  const events = upcomingEvents.slice(0, 3);
  const galleryAlbums = albumsList.slice(0, 4);

  const fetchedFamilyId = React.useRef(null);

  useEffect(() => {
    if (!isAuthenticated || !authUser || !familyId) return;
    if (fetchedFamilyId.current === familyId) return;

    const postActor = getPostActor(authUser, isAuthenticated, familyId);
    const eventActor = getEventActor(authUser, isAuthenticated, familyId);
    const galleryActor = getGalleryActor(authUser, isAuthenticated, familyId);

    // Lấy dữ liệu nếu chưa có hoặc cập nhật mới
    dispatch(fetchPosts({ options: { actor: postActor, filters: { sortDirection: 'newest' } }, legacyPage: 1, legacyPageSize: 4 }));
    dispatch(fetchEvents({ params: {}, actor: eventActor }));
    dispatch(fetchAlbums({ actor: galleryActor }));
    
    fetchedFamilyId.current = familyId;
  }, [dispatch, authUser, isAuthenticated, familyId]);

  return (
    <div className="home-page animate-fade-in">

      {/* Marquee Banner */}
      {familyMarqueeItems && familyMarqueeItems.length > 0 && (
        <MarqueeBanner items={familyMarqueeItems} />
      )}

      {/* Hero Section */}
      <section
        className="hero-section"
        style={{ backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url('${hero.bgImage}')` }}
      >
        <div className="container hero-content">
          <div className="hero-logo">
            <img src={logoImg} alt="Logo" style={{ height: '100%', width: 'auto', objectFit: 'contain' }} />
          </div>
          <h1 className="hero-title">{hero.title}</h1>
          <p className="hero-subtitle">
            {hero.subtitle}
          </p>
          <div className="quick-actions-row">
            <button className="btn btn-primary" onClick={() => navigate(`/${familyId}/family-tree`)}>
              <GitMerge size={18} /> Phả Đồ
            </button>
            <button className="btn btn-glass" onClick={() => navigate(`/${familyId}/events`)}>
              <Calendar size={18} /> Sự Kiện
            </button>
            <button className="btn btn-glass" onClick={() => navigate(`/${familyId}/posts`)}>
              <FileText size={18} /> Bài Viết
            </button>
            <button className="btn btn-glass" onClick={() => navigate(`/${familyId}/gallery`)}>
              <Image size={18} /> Thư Viện
            </button>
            <button className="btn btn-glass" onClick={() => navigate(`/${familyId}/edit-requests`)}>
              <Edit3 size={18} /> Gửi Yêu Cầu
            </button>
          </div>
        </div>
      </section>

      {/* Family Council Section */}
      <FamilyCouncil familyId={familyId} />

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
              {isLoading ? (
                Array(3).fill().map((_, idx) => (
                  <div key={idx} className="event-item" style={{ gap: '16px' }}>
                    <Skeleton width="60px" height="60px" borderRadius="8px" />
                    <div style={{ flex: 1 }}>
                      <Skeleton width="80%" height="20px" style={{ marginBottom: '8px' }} />
                      <Skeleton width="60%" height="16px" />
                    </div>
                  </div>
                ))
              ) : events.length === 0 ? (
                <p className="panel-empty">Chưa có sự kiện nào được lên lịch trong 30 ngày tới.</p>
              ) : (
                events.map((event) => {
                  const dateObj = new Date(event.startAt);
                  const day = dateObj.getDate().toString().padStart(2, '0');
                  const month = `Thg ${dateObj.getMonth() + 1}`;
                  return (
                    <div key={event.id} className="event-item">
                      <div className="event-date">
                        <span>{day}</span>
                        <span>{month}</span>
                      </div>
                      <div className="event-info">
                        <h4>{event.title}</h4>
                        <p>{event.type} • {event.description}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <button className="btn btn-outline btn-full-width" onClick={() => navigate(`/${familyId}/events`)}>
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
              {isLoading ? (
                Array(3).fill().map((_, idx) => (
                  <div key={idx} className="post-item" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <Skeleton width="100%" height="24px" />
                    <Skeleton width="40%" height="16px" />
                  </div>
                ))
              ) : posts.length === 0 ? (
                <p className="panel-empty">Chưa có bài viết nào.</p>
              ) : (
                posts.map((post) => {
                  const dateStr = new Date(post.createdAt).toLocaleDateString('vi-VN');
                  return (
                    <div key={post.id} className="article-item" style={{ cursor: 'pointer' }} onClick={() => navigate(`/${familyId}/posts/${post.id}`)}>
                      <h4 className="article-title">{post.title}</h4>
                      <div className="article-meta">
                        <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
                        {dateStr}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <button className="btn btn-outline btn-full-width" onClick={() => navigate(`/${familyId}/posts`)}>
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
              {isLoading ? (
                Array(4).fill().map((_, idx) => (
                  <div key={idx} className="album-item" style={{ height: '100px' }}>
                    <Skeleton width="100%" height="100%" borderRadius="8px" />
                  </div>
                ))
              ) : galleryAlbums.length === 0 ? (
                <p className="panel-empty">Chưa có ảnh nào trong thư viện.</p>
              ) : (
                galleryAlbums.map((album) => (
                  <div key={album.id} className="album-item" onClick={() => navigate(`/${familyId}/albums/${album.id}`)} style={{ cursor: 'pointer' }}>
                    {album.coverImage ? (
                      <img src={album.coverImage} alt={album.title} loading="lazy" />
                    ) : (
                      <div className="album-item-fallback" style={{ width: '100%', height: '100%', backgroundColor: '#eaeaea', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Image size={24} color="#888" />
                      </div>
                    )}
                    <div className="album-overlay">{album.title}</div>
                  </div>
                ))
              )}
            </div>
            <button className="btn btn-outline btn-full-width" onClick={() => navigate(`/${familyId}/gallery`)}>
              Mở thư viện <ChevronRight size={16} />
            </button>
          </div>

        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
