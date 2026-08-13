import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useFamilyActor } from '../hooks/useFamilyActor';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Edit3,
  Eye,
  EyeOff,
  FileImage,
  Globe2,
  Loader2,
  Lock,
  Trash2,
  Upload,
  Video,
} from 'lucide-react';
import ConfirmModal from '../components/common/ConfirmModal';
import {
  AlbumFormModal,
  GalleryBadge,
  MediaLightbox,
  MediaEditModal,
  UploadMediaModal,
} from '../components/gallery/GalleryModals';
import ImageLightbox from '../components/gallery/ImageLightbox';
import { formatDate, isImageSource } from '../components/gallery/galleryViewUtils';
import {
  canDeleteAlbum,
  canDeleteMedia,
  canManageAlbum,
  canUpdateAlbum,
  canUpdateMedia,
  canUploadMedia,
  galleryService,
  getGalleryActor,
} from '../services/galleryService';
import {
  ALBUM_STATUS,
  ALBUM_STATUS_LABELS,
  ALBUM_VISIBILITY,
  ALBUM_VISIBILITY_LABELS,
  MEDIA_TYPE,
  MEDIA_TYPE_LABELS,
} from '../types/gallery';
import '../css/pages/Gallery.css';

const truncateText = (value, maxLength = 72) => {
  const text = String(value || '').trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
};

const GalleryDetail = () => {
  const { familyId, albumId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const authUser = useFamilyActor();
  const isAuthenticated = Boolean(authUser);
  const actor = useMemo(() => getGalleryActor(authUser, isAuthenticated, familyId), [authUser, isAuthenticated, familyId]);
  const [album, setAlbum] = useState(null);
  const [albumForm, setAlbumForm] = useState(null);
  const [uploadAlbum, setUploadAlbum] = useState(null);
  const [editingMedia, setEditingMedia] = useState(null);
  const [lightboxMedia, setLightboxMedia] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [notice, setNotice] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const publicGalleryPath = familyId ? `/${familyId}/gallery` : '/gallery';
  const backUrl = location.state?.from || `${publicGalleryPath}${location.search || ''}`;
  const isAdminContext = String(backUrl).startsWith('/admin');
  const viewActor = actor;
  const isManager = canManageAlbum(viewActor, album);
  const imageItems = useMemo(() => (
    album?.media.filter((item) => item.type === MEDIA_TYPE.IMAGE) || []
  ), [album]);
  const imageCount = album?.media.filter((item) => item.type === MEDIA_TYPE.IMAGE).length || 0;
  const videoCount = album?.media.filter((item) => item.type === MEDIA_TYPE.VIDEO).length || 0;
  const totalCount = album?.media.length || 0;
  const galleryCrumb = isAdminContext
    ? { label: 'Quản lý thư viện ảnh', to: backUrl }
    : { label: 'Thư viện ảnh', to: publicGalleryPath };

  const goBackToLibrary = () => {
    navigate(backUrl);
  };

  const loadAlbum = useCallback(async () => {
    if (!albumId) return;

    setIsLoading(true);
    setError('');
    try {
      const data = await galleryService.getAlbumById(albumId, viewActor);
      setAlbum(data);
    } catch (loadError) {
      setAlbum(null);
      setError(loadError.message || 'Không thể tải chi tiết album.');
    } finally {
      setIsLoading(false);
    }
  }, [albumId, viewActor]);

  useEffect(() => {
    loadAlbum();
  }, [loadAlbum]);

  const handleSaveAlbum = async (payload) => {
    if (!album) return;

    setIsSaving(true);
    try {
      const updatedAlbum = await galleryService.updateAlbum(album.id, payload, viewActor);
      setAlbum(updatedAlbum);
      setAlbumForm(null);
      setNotice({ type: 'success', text: 'Album đã được cập nhật.' });
    } catch (saveError) {
      setNotice({ type: 'error', text: saveError.message || 'Không thể lưu album.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpload = async (files, descriptions) => {
    if (!uploadAlbum) return;

    setIsUploading(true);
    try {
      const updatedAlbum = await galleryService.uploadMedia(uploadAlbum.id, files, viewActor, descriptions);
      setAlbum(updatedAlbum);
      setUploadAlbum(null);
      setNotice({ type: 'success', text: 'Tệp đã được tải lên album.' });
    } catch (uploadError) {
      setNotice({ type: 'error', text: uploadError.message || 'Không thể tải tệp lên album.' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!album) return;

    try {
      const updatedAlbum = await galleryService.toggleAlbumStatus(album.id, viewActor);
      setAlbum(updatedAlbum);
      setNotice({
        type: 'success',
        text: album.status === ALBUM_STATUS.VISIBLE ? 'Album đã được ẩn.' : 'Album đã được hiển thị.',
      });
    } catch (toggleError) {
      setNotice({ type: 'error', text: toggleError.message || 'Không thể đổi trạng thái album.' });
    }
  };

  const handleConfirm = async () => {
    if (!confirmAction) return;

    setIsSaving(true);
    try {
      if (confirmAction.type === 'deleteAlbum') {
        await galleryService.deleteAlbum(confirmAction.album.id, viewActor);
        setConfirmAction(null);
        navigate(backUrl, {
          state: { notice: 'Album và toàn bộ ảnh, video bên trong đã được xóa.' },
        });
        return;
      }

      if (confirmAction.type === 'deleteMedia') {
        const updatedAlbum = await galleryService.deleteMedia(confirmAction.album.id, confirmAction.media.id, viewActor);
        setAlbum(updatedAlbum);
        setNotice({ type: 'success', text: 'Ảnh hoặc video đã được xóa khỏi album.' });
      }

      setConfirmAction(null);
    } catch (confirmError) {
      setNotice({ type: 'error', text: confirmError.message || 'Thao tác thất bại.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveMediaDescription = async (description) => {
    if (!album || !editingMedia) return;

    setIsSaving(true);
    try {
      const updatedAlbum = await galleryService.updateMedia(album.id, editingMedia.id, { description }, viewActor);
      setAlbum(updatedAlbum);
      setEditingMedia(null);
      setNotice({ type: 'success', text: 'Mô tả tệp đã được cập nhật.' });
    } catch (saveError) {
      setNotice({ type: 'error', text: saveError.message || 'Không thể lưu mô tả.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="gallery-page container animate-fade-in">
        <div className="gallery-loading">
          <Loader2 className="spin-icon" size={28} />
          <span>Đang tải chi tiết album...</span>
        </div>
      </div>
    );
  }

  if (error || !album) {
    return (
      <div className="gallery-page container animate-fade-in">
        <button className="gallery-back-link" type="button" onClick={goBackToLibrary}>
          <ArrowLeft size={18} /> Quay lại thư viện
        </button>
        <div className="gallery-detail-empty" role="alert">
          <FileImage size={42} />
          <h1>Không thể mở album</h1>
          <p>{error || 'Album không tồn tại hoặc bạn không có quyền xem.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="gallery-page gallery-detail-page container animate-fade-in">
      <nav className="gallery-detail-breadcrumb" aria-label="Breadcrumb">
        <Link to={isAdminContext ? '/admin' : '/'}>{isAdminContext ? 'Bảng điều khiển' : 'Trang chủ'}</Link>
        <span>/</span>
        <Link to={galleryCrumb.to}>{galleryCrumb.label}</Link>
        <span>/</span>
        <span title={album.title}>{truncateText(album.title)}</span>
      </nav>

      <button className="gallery-back-link" type="button" onClick={goBackToLibrary}>
        <ArrowLeft size={18} /> Quay lại thư viện
      </button>

      <header className="gallery-detail-page-header">
        <div className="gallery-detail-heading">
          <div className="gallery-detail-title-row">
            <div>
              <span className="gallery-eyebrow">Chi tiết album</span>
              <h1>{album.title}</h1>
            </div>
          </div>
          <p>{album.description || 'Chưa có mô tả.'}</p>
          <div className="gallery-card-badges">
            <GalleryBadge type={album.visibility.toLowerCase()}>
              {album.visibility === ALBUM_VISIBILITY.PUBLIC ? <Globe2 size={13} /> : <Lock size={13} />}
              {ALBUM_VISIBILITY_LABELS[album.visibility]}
            </GalleryBadge>
            {isManager && (
              <GalleryBadge type={album.status.toLowerCase()}>
                {album.status === ALBUM_STATUS.VISIBLE ? <Eye size={13} /> : <EyeOff size={13} />}
                {ALBUM_STATUS_LABELS[album.status]}
              </GalleryBadge>
            )}
          </div>
        </div>

        <div className="gallery-detail-meta">
          <div>
            <span>Người tạo</span>
            <strong>{album.createdBy?.name || 'Không rõ'}</strong>
          </div>
          <div>
            <span>Ngày tạo</span>
            <strong>{formatDate(album.createdAt)}</strong>
          </div>
          <div>
            <span>Tổng số tệp</span>
            <strong>{totalCount} tệp</strong>
          </div>
          <div>
            <span>Ảnh / Video</span>
            <strong>{imageCount} ảnh, {videoCount} video</strong>
          </div>
        </div>

        {isManager && (
          <div className="gallery-manager-actions">
            {canUpdateAlbum(viewActor, album) && (
              <button className="btn btn-outline" type="button" onClick={() => setAlbumForm({ album })}>
                <Edit3 size={16} /> Chỉnh sửa album
              </button>
            )}
            <button className="btn btn-outline" type="button" onClick={handleToggleStatus}>
              {album.status === ALBUM_STATUS.VISIBLE ? <EyeOff size={16} /> : <Eye size={16} />}
              {album.status === ALBUM_STATUS.VISIBLE ? 'Ẩn album' : 'Hiển thị album'}
            </button>
            {canUploadMedia(viewActor, album) && (
              <button className="btn btn-outline" type="button" onClick={() => setUploadAlbum(album)}>
                <Upload size={16} /> Thêm ảnh/video
              </button>
            )}
            {canDeleteAlbum(viewActor, album) && (
              <button className="btn btn-danger" type="button" onClick={() => setConfirmAction({ type: 'deleteAlbum', album })}>
                <Trash2 size={16} /> Xóa album
              </button>
            )}
          </div>
        )}
      </header>

      {notice && (
        <div className={`gallery-notice gallery-notice-${notice.type}`} role="status">
          <span>{notice.text}</span>
          <button type="button" onClick={() => setNotice(null)}>Đóng</button>
        </div>
      )}

      <section className="gallery-detail-media-section">
        <div className="gallery-section-title">
          <h2>Ảnh và video</h2>
          <span>{totalCount} tệp</span>
        </div>

        {album.media.length === 0 ? (
          <div className="gallery-media-empty">Album chưa có ảnh hoặc video.</div>
        ) : (
          <div className="gallery-media-grid">
            {album.media.map((media) => (
              <article className="gallery-media-card" key={media.id}>
                <button
                  className="gallery-media-preview"
                  type="button"
                  onClick={() => setLightboxMedia(media)}
                >
                  {media.type === MEDIA_TYPE.VIDEO ? (
                    <>
                      {isImageSource(media.thumbnailUrl) ? (
                        <img src={media.thumbnailUrl} alt={media.fileName} loading="lazy" />
                      ) : (
                        <span className="gallery-video-placeholder gallery-video-thumb">
                          <Video size={30} />
                          <span>{media.fileName}</span>
                        </span>
                      )}
                      <span className="gallery-video-mark"><Video size={18} /></span>
                    </>
                  ) : (
                    <img src={media.thumbnailUrl || media.url} alt={media.description || media.fileName} loading="lazy" />
                  )}
                </button>
                <div className="gallery-media-body">
                  <div className="gallery-media-title">
                    <strong>{media.fileName}</strong>
                    <GalleryBadge type={media.type.toLowerCase()}>{MEDIA_TYPE_LABELS[media.type]}</GalleryBadge>
                  </div>
                  {media.description && <p>{media.description}</p>}
                </div>

                {isManager && (
                  <div className="gallery-media-actions">
                    {canUpdateMedia(viewActor, album) && (
                      <button className="icon-btn" type="button" onClick={() => setEditingMedia(media)} aria-label="Sửa mô tả tệp">
                        <Edit3 size={16} />
                      </button>
                    )}
                    {canDeleteMedia(viewActor, album) && (
                      <button
                        className="icon-btn text-danger"
                        type="button"
                        onClick={() => setConfirmAction({ type: 'deleteMedia', album, media })}
                        aria-label="Xóa tệp"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {albumForm && (
        <AlbumFormModal
          album={albumForm.album}
          isSaving={isSaving}
          onClose={() => setAlbumForm(null)}
          onSubmit={handleSaveAlbum}
        />
      )}

      <UploadMediaModal
        album={uploadAlbum}
        isUploading={isUploading}
        onClose={() => setUploadAlbum(null)}
        onSubmit={handleUpload}
      />

      <MediaEditModal
        media={editingMedia}
        isSaving={isSaving}
        onClose={() => setEditingMedia(null)}
        onSubmit={handleSaveMediaDescription}
      />

      <ImageLightbox
        image={lightboxMedia?.type === MEDIA_TYPE.IMAGE ? lightboxMedia : null}
        images={imageItems}
        onClose={() => setLightboxMedia(null)}
        onSelectImage={setLightboxMedia}
      />

      <MediaLightbox
        media={lightboxMedia?.type === MEDIA_TYPE.VIDEO ? lightboxMedia : null}
        onClose={() => setLightboxMedia(null)}
      />

      <ConfirmModal
        isOpen={Boolean(confirmAction)}
        title={confirmAction?.type === 'deleteAlbum' ? 'Xóa album?' : 'Xóa ảnh hoặc video?'}
        message={
          confirmAction?.type === 'deleteAlbum'
            ? `Bạn chắc chắn muốn xóa album "${confirmAction?.album.title}"? Toàn bộ ảnh và video trong album cũng sẽ bị xóa.`
            : `Bạn chắc chắn muốn xóa "${confirmAction?.media.fileName}" khỏi album?`
        }
        confirmText={confirmAction?.type === 'deleteAlbum' ? 'Xóa album' : 'Xóa'}
        cancelText="Hủy"
        isDanger
        isLoading={isSaving}
        onCancel={() => setConfirmAction(null)}
        onConfirm={handleConfirm}
      />
    </div>
  );
};

export default GalleryDetail;
