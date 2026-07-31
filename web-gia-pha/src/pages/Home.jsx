import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import {
  GitMerge, FileText, Image,
  Calendar, BookOpen, Clock, ChevronRight, Edit3
} from 'lucide-react';
import MarqueeBanner from '../components/MarqueeBanner';
import Skeleton from '../components/common/Skeleton';
import { getPostActor, postService } from '../services/postService';
import { eventService, getEventActor } from '../services/eventService';
import { POST_ROLES } from '../types/posts';
import { galleryService, getGalleryActor } from '../services/galleryService';
import '../css/pages/Home.css';

const toMemberPostActor = (actor) => {
  if (!actor?.familyId || actor.role === POST_ROLES.GUEST) {
    return actor;
  }

  return {
    ...actor,
    role: POST_ROLES.MEMBER,
    canCreatePost: false,
    canManagePosts: false,
  };
};

const toMemberEventActor = (actor) => {
  if (!actor || actor.role === 'GUEST') {
    return actor;
  }

  return {
    ...actor,
    role: 'MEMBER',
    permissions: {},
    canCreatePost: false,
    canManagePosts: false,
  };
};

const Home = () => {
  useEffect(() => {
    document.title = "Dashboard";
  }, []);

  const navigate = useNavigate();
  const { familyId } = useParams();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  // Lấy cấu hình tuỳ chỉnh (Settings) từ Redux
  const { familiesSettings, hero: defaultHero, marqueeItems } = useSelector((state) => state.settings);
  const { list: userFamilies } = useSelector((state) => state.families);

  // Find current family to display dynamic name
  const activeFamily = userFamilies?.find(f => f.id === Number(familyId));

  // Custom hero for this family, or default
  const familyHeroSettings = familiesSettings[familyId]?.hero;
  const hero = {
    title: familyHeroSettings?.title || (activeFamily ? `Gia Phả ${activeFamily.name}` : defaultHero.title),
    subtitle: familyHeroSettings?.subtitle || defaultHero.subtitle,
    bgImage: familyHeroSettings?.bgImage || defaultHero.bgImage,
  };

  // Dữ liệu động từ API (Services)
  const [posts, setPosts] = useState([]);
  const [events, setEvents] = useState([]);
  const [galleryAlbums, setGalleryAlbums] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const postActor = toMemberPostActor(getPostActor(user, isAuthenticated));
        const eventActor = toMemberEventActor(getEventActor(user, isAuthenticated));
        const postActor = getPostActor(user, isAuthenticated, familyId);
        const eventActor = getEventActor(user, isAuthenticated, familyId);
        const postsRes = await postService.getPosts({
          actor: postActor,
          filters: { sortDirection: 'newest' },
          page: 1,
          pageSize: 4,
        });
        setPosts(postsRes.items);

        const eventsRes = await eventService.getUpcomingEvents(30, {}, eventActor);
        setEvents(eventsRes.data.slice(0, 3));

        const galleryActor = getGalleryActor(user, isAuthenticated, familyId);
        const albumsRes = await galleryService.getAlbums({ actor: galleryActor });
        setGalleryAlbums(albumsRes.slice(0, 4));
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user, isAuthenticated, familyId]);

  return (
    <div className="home-page animate-fade-in">

      {/* Marquee Banner */}
      {marqueeItems && marqueeItems.length > 0 && (
        <MarqueeBanner items={marqueeItems} />
      )}

      {/* Hero Section */}
      <section
        className="hero-section"
        style={{ backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url('${hero.bgImage}')` }}
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

    </div>
  );
};

export default Home;
