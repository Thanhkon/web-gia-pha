import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  EyeOff,
  FolderOpen,
  Globe2,
  Image as ImageIcon,
  Loader2,
  Lock,
  Maximize2,
  PlusCircle,
  Search,
} from 'lucide-react';
import { AlbumFormModal, GalleryBadge } from '../components/gallery/GalleryModals';
import { getActorText } from '../components/gallery/galleryViewUtils';
import {
  canCreateAlbum,
  canManageAlbum,
  galleryService,
  getGalleryActor,
} from '../services/galleryService';
import {
  ALBUM_STATUS,
  ALBUM_STATUS_LABELS,
  ALBUM_VISIBILITY,
  ALBUM_VISIBILITY_LABELS,
} from '../types/gallery';
import '../css/pages/Gallery.css';

const buildFiltersFromParams = (searchParams) => ({
  keyword: searchParams.get('keyword') || '',
  visibility: searchParams.get('visibility') || '',
  status: searchParams.get('status') || '',
});

const updateFilterParams = (searchParams, setSearchParams, patch) => {
  const nextFilters = {
    ...buildFiltersFromParams(searchParams),
    ...patch,
  };

  const nextParams = new URLSearchParams();
  Object.entries(nextFilters).forEach(([key, value]) => {
    if (value) nextParams.set(key, value);
  });
  setSearchParams(nextParams);
};

const Gallery = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const actor = useMemo(() => getGalleryActor(user, isAuthenticated), [user, isAuthenticated]);
  const isAdminRoute = location.pathname.startsWith('/admin');
  const viewActor = useMemo(() => {
    if (isAdminRoute || !actor?.familyId) {
      return actor;
    }

    return {
      ...actor,
      role: 'MEMBER',
    };
  }, [actor, isAdminRoute]);
  const filters = useMemo(() => buildFiltersFromParams(searchParams), [searchParams]);
  const [albums, setAlbums] = useState([]);
  const [albumForm, setAlbumForm] = useState(null);
  const [notice, setNotice] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const isManager = canManageAlbum(viewActor);
  const searchText = searchParams.toString();
  const listUrl = `${location.pathname}${searchText ? `?${searchText}` : ''}`;

  const loadAlbums = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await galleryService.getAlbums({ actor: viewActor, filters });
      setAlbums(data);
    } catch (error) {
      setNotice({ type: 'error', text: error.message || 'Không thể tải thư viện.' });
      setAlbums([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters, viewActor]);

  useEffect(() => {
    loadAlbums();
  }, [loadAlbums]);

  useEffect(() => {
    if (!location.state?.notice) return;

    setNotice({ type: 'success', text: location.state.notice });
    navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
  }, [location.pathname, location.search, location.state, navigate]);

  const handleSaveAlbum = async (payload) => {
    setIsSaving(true);
    try {
      await galleryService.createAlbum(payload, actor);
      setAlbumForm(null);
      setNotice({ type: 'success', text: 'Album mới đã được tạo.' });
      await loadAlbums();
    } catch (error) {
      setNotice({ type: 'error', text: error.message || 'Không thể lưu album.' });
    } finally {
      setIsSaving(false);
    }
  };

  const resetFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  return (
    <div className="gallery-page container animate-fade-in">
      <header className="gallery-page-header">
        <div>
          <span className="gallery-eyebrow">Tư liệu dòng họ</span>
          <h1>Thư viện ảnh</h1>
          <p>Lưu giữ album, ảnh và video của dòng họ theo phạm vi công khai hoặc nội bộ.</p>
        </div>

        {canCreateAlbum(viewActor) && (
          <button className="btn btn-primary" type="button" onClick={() => setAlbumForm({ album: null })}>
            <PlusCircle size={18} /> Tạo album
          </button>
        )}
      </header>

      <section className="gallery-toolbar">
        <label className="gallery-search-field">
          <Search size={18} />
          <input
            value={filters.keyword}
            onChange={(event) => updateFilterParams(searchParams, setSearchParams, { keyword: event.target.value })}
            placeholder="Tìm theo tên hoặc mô tả album"
          />
        </label>

        <label className="gallery-filter-control">
          <span>Phạm vi</span>
          <select
            value={filters.visibility}
            onChange={(event) => updateFilterParams(searchParams, setSearchParams, { visibility: event.target.value })}
          >
            <option value="">Tất cả phạm vi</option>
            <option value={ALBUM_VISIBILITY.PUBLIC}>Công khai</option>
            {viewActor && <option value={ALBUM_VISIBILITY.INTERNAL}>Nội bộ</option>}
          </select>
        </label>

        {isManager && (
          <label className="gallery-filter-control">
            <span>Trạng thái</span>
            <select
              value={filters.status}
              onChange={(event) => updateFilterParams(searchParams, setSearchParams, { status: event.target.value })}
            >
              <option value="">Tất cả trạng thái</option>
              <option value={ALBUM_STATUS.VISIBLE}>Đã hiển thị</option>
              <option value={ALBUM_STATUS.HIDDEN}>Đã ẩn</option>
            </select>
          </label>
        )}

        <button
          className="btn btn-outline gallery-clear-filter"
          type="button"
          onClick={resetFilters}
        >
          Xóa lọc
        </button>
      </section>

      {notice && (
        <div className={`gallery-notice gallery-notice-${notice.type}`} role="status">
          <span>{notice.text}</span>
          <button type="button" onClick={() => setNotice(null)}>Đóng</button>
        </div>
      )}

      <div className="gallery-results-bar">
        <span>{albums.length} album phù hợp</span>
        <span>{getActorText(viewActor)}</span>
      </div>

      {isLoading ? (
        <div className="gallery-loading">
          <Loader2 className="spin-icon" size={28} />
          <span>Đang tải thư viện...</span>
        </div>
      ) : albums.length === 0 ? (
        <div className="gallery-empty-state">
          <FolderOpen size={42} />
          <h2>Chưa có album phù hợp</h2>
          <p>Thử đổi bộ lọc hoặc tạo album mới cho dòng họ.</p>
        </div>
      ) : (
        <section className="gallery-album-grid">
          {albums.map((album) => (
            <article className="gallery-album-card" key={album.id}>
              <Link
                className="gallery-album-card-link"
                to={{ pathname: `/albums/${album.id}`, search: searchText }}
                state={{ from: listUrl }}
              >
                <span className="gallery-album-cover">
                  {album.coverImage ? (
                    <img src={album.coverImage} alt={album.title} loading="lazy" />
                  ) : (
                    <span className="gallery-cover-fallback">
                      <ImageIcon size={30} />
                    </span>
                  )}
                  <span className="gallery-album-open">
                    <Maximize2 size={16} /> Xem album
                  </span>
                </span>

                <div className="gallery-album-body">
                  <div className="gallery-card-badges">
                    <GalleryBadge type={album.visibility.toLowerCase()}>
                      {album.visibility === ALBUM_VISIBILITY.PUBLIC ? <Globe2 size={13} /> : <Lock size={13} />}
                      {ALBUM_VISIBILITY_LABELS[album.visibility]}
                    </GalleryBadge>
                    {isManager && album.status === ALBUM_STATUS.HIDDEN && (
                      <GalleryBadge type={album.status.toLowerCase()}>
                        <EyeOff size={13} />
                        {ALBUM_STATUS_LABELS[album.status]}
                      </GalleryBadge>
                    )}
                  </div>

                  <h2>{album.title}</h2>
                  <p>{album.description}</p>
                  <span className="gallery-album-meta">
                    <span>{album.imageCount} ảnh</span>
                    <span>{album.videoCount} video</span>
                  </span>
                </div>
              </Link>
            </article>
          ))}
        </section>
      )}

      {albumForm && (
        <AlbumFormModal
          album={albumForm.album}
          isSaving={isSaving}
          onClose={() => setAlbumForm(null)}
          onSubmit={handleSaveAlbum}
        />
      )}
    </div>
  );
};

export default Gallery;
