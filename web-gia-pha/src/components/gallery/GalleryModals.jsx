import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Image as ImageIcon,
  Loader2,
  Save,
  Upload,
  Video,
  X,
} from 'lucide-react';
import ConfirmModal from '../common/ConfirmModal';
import { validateMediaFiles } from '../../services/galleryService';
import {
  ALBUM_STATUS,
  ALBUM_VISIBILITY,
  GALLERY_UPLOAD_LIMITS,
  MEDIA_TYPE,
  MEDIA_TYPE_LABELS,
} from '../../types/gallery';

const emptyAlbumForm = {
  title: '',
  description: '',
  coverImage: '',
  visibility: ALBUM_VISIBILITY.INTERNAL,
  status: ALBUM_STATUS.VISIBLE,
};

export const GalleryBadge = ({ type, children }) => (
  <span className={`gallery-badge gallery-badge-${type}`}>{children}</span>
);

const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(new Error(`Không thể đọc tệp ${file.name}.`));
  reader.readAsDataURL(file);
});

const formatFileSize = (size) => {
  const mb = size / 1024 / 1024;
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(size / 1024)} KB`;
};

const useEscape = (isActive, onEscape) => {
  useEffect(() => {
    if (!isActive) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onEscape();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive, onEscape]);
};

export const AlbumFormModal = ({ album, isSaving, onClose, onSubmit }) => {
  const initialForm = useMemo(() => album ? {
    title: album.title,
    description: album.description,
    coverImage: album.coverImage,
    visibility: album.visibility,
    status: album.status,
  } : emptyAlbumForm, [album]);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);
  const isDirty = JSON.stringify(form) !== JSON.stringify(initialForm);

  const requestClose = useCallback(() => {
    if (isDirty) {
      setShowUnsavedConfirm(true);
      return;
    }

    onClose();
  }, [isDirty, onClose]);

  useEscape(true, requestClose);

  const handleCoverChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!GALLERY_UPLOAD_LIMITS.imageTypes.includes(file.type)) {
      setError('Ảnh đại diện chỉ hỗ trợ JPG, JPEG, PNG hoặc WEBP.');
      return;
    }

    if (file.size > GALLERY_UPLOAD_LIMITS.maxImageSize) {
      setError('Ảnh đại diện không được vượt quá 10 MB.');
      return;
    }

    try {
      const coverImage = await readFileAsDataUrl(file);
      setForm((current) => ({ ...current, coverImage }));
      setError('');
    } catch (readError) {
      setError(readError.message);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.title.trim()) {
      setError('Vui lòng nhập tên album.');
      return;
    }

    onSubmit(form);
  };

  return (
    <>
      <div className="modal-overlay">
        <section className="modal-container gallery-form-modal" role="dialog" aria-modal="true" aria-labelledby="album-form-title">
          <header className="gallery-modal-header">
            <div>
              <span>{album ? 'Chỉnh sửa album' : 'Tạo album mới'}</span>
              <h2 id="album-form-title">{album ? album.title : 'Album dòng họ'}</h2>
            </div>
            <button className="icon-btn" type="button" onClick={requestClose} aria-label="Đóng form album">
              <X size={20} />
            </button>
          </header>

          <form className="gallery-form" onSubmit={handleSubmit}>
            <label>
              <span>Tên album</span>
              <input
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="Ví dụ: Lễ Thanh Minh 2026"
              />
            </label>

            <label>
              <span>Mô tả</span>
              <textarea
                rows={4}
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="Nội dung mô tả ngắn cho album"
              />
            </label>

            <div className="gallery-cover-row">
              <div className="gallery-cover-preview">
                {form.coverImage ? (
                  <img src={form.coverImage} alt="Ảnh đại diện album" />
                ) : (
                  <div className="gallery-cover-empty">
                    <ImageIcon size={28} />
                    <span>Chưa có ảnh đại diện</span>
                  </div>
                )}
              </div>
              <label className="gallery-file-trigger">
                <Upload size={17} />
                <span>Chọn ảnh đại diện</span>
                <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleCoverChange} />
              </label>
            </div>

            <div className="gallery-form-grid">
              <label>
                <span>Phạm vi hiển thị</span>
                <select
                  value={form.visibility}
                  onChange={(event) => setForm((current) => ({ ...current, visibility: event.target.value }))}
                >
                  <option value={ALBUM_VISIBILITY.PUBLIC}>Công khai</option>
                  <option value={ALBUM_VISIBILITY.INTERNAL}>Nội bộ</option>
                </select>
              </label>

              <label>
                <span>Trạng thái</span>
                <select
                  value={form.status}
                  onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
                >
                  <option value={ALBUM_STATUS.VISIBLE}>Đã hiển thị</option>
                  <option value={ALBUM_STATUS.HIDDEN}>Đã ẩn</option>
                </select>
              </label>
            </div>

            {error && <div className="gallery-form-error">{error}</div>}

            <footer className="gallery-modal-actions">
              <button className="btn btn-outline" type="button" onClick={requestClose} disabled={isSaving}>Hủy</button>
              <button className="btn btn-primary" type="submit" disabled={isSaving}>
                {isSaving ? <Loader2 className="spin-icon" size={18} /> : <Save size={18} />}
                Lưu thay đổi
              </button>
            </footer>
          </form>
        </section>
      </div>

      <ConfirmModal
        isOpen={showUnsavedConfirm}
        title="Rời form chỉnh sửa?"
        message="Bạn có thay đổi chưa lưu. Nếu đóng form, các thay đổi này sẽ bị mất."
        confirmText="Đóng form"
        cancelText="Tiếp tục sửa"
        isDanger
        onCancel={() => setShowUnsavedConfirm(false)}
        onConfirm={onClose}
      />
    </>
  );
};

export const UploadMediaModal = ({ album, isUploading, onClose, onSubmit }) => {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

  useEscape(Boolean(album), onClose);

  useEffect(() => {
    return () => {
      items.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, [items]);

  if (!album) return null;

  const handleFilesChange = (event) => {
    const files = Array.from(event.target.files || []);
    const errors = validateMediaFiles(files);

    if (errors.length > 0) {
      setItems([]);
      setError(errors.join('\n'));
      event.target.value = '';
      return;
    }

    setItems(files.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      description: '',
    })));
    setError('');
    event.target.value = '';
  };

  const updateDescription = (index, description) => {
    setItems((current) => current.map((item, itemIndex) => (
      itemIndex === index ? { ...item, description } : item
    )));
  };

  const handleSubmit = () => {
    if (items.length === 0) {
      setError('Vui lòng chọn ít nhất một tệp ảnh hoặc video.');
      return;
    }

    onSubmit(items.map((item) => item.file), items.map((item) => item.description));
  };

  return (
    <div className="modal-overlay">
      <section className="modal-container gallery-upload-modal" role="dialog" aria-modal="true" aria-labelledby="upload-modal-title">
        <header className="gallery-modal-header">
          <div>
            <span>Thêm ảnh/video</span>
            <h2 id="upload-modal-title">{album.title}</h2>
          </div>
          <button className="icon-btn" type="button" onClick={onClose} aria-label="Đóng form tải lên">
            <X size={20} />
          </button>
        </header>

        <div className="gallery-upload-form">
          <div className="gallery-upload-rules">
            <strong>Quy định tải lên</strong>
            <p>Ảnh: JPG, JPEG, PNG, WEBP tối đa 10 MB/tệp. Video: MP4, WEBM tối đa 100 MB/tệp. Tối đa 20 tệp/lần.</p>
          </div>

          <label className="gallery-upload-dropzone">
            <Upload size={26} />
            <span>Chọn nhiều ảnh hoặc video</span>
            <small>Hệ thống sẽ kiểm tra định dạng, kích thước và số lượng trước khi tải lên.</small>
            <input
              type="file"
              multiple
              accept="image/jpeg,image/jpg,image/png,image/webp,video/mp4,video/webm"
              onChange={handleFilesChange}
              disabled={isUploading}
            />
          </label>

          {error && <pre className="gallery-upload-error">{error}</pre>}

          {items.length > 0 && (
            <div className="gallery-upload-preview-list">
              {items.map((item, index) => {
                const isVideo = item.file.type.startsWith('video/');
                return (
                  <article className="gallery-upload-preview-item" key={`${item.file.name}-${item.file.size}`}>
                    <div className="gallery-upload-preview-media">
                      {isVideo ? (
                        <video src={item.previewUrl} muted />
                      ) : (
                        <img src={item.previewUrl} alt={item.file.name} />
                      )}
                      {isVideo && <span className="gallery-video-mark"><Video size={18} /></span>}
                    </div>
                    <div className="gallery-upload-preview-info">
                      <strong>{item.file.name}</strong>
                      <span>{formatFileSize(item.file.size)}</span>
                      <label>
                        <span>Mô tả riêng</span>
                        <textarea
                          rows={3}
                          value={item.description}
                          onChange={(event) => updateDescription(index, event.target.value)}
                          placeholder="Nhập mô tả cho tệp này"
                        />
                      </label>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <footer className="gallery-modal-actions">
            <button className="btn btn-outline" type="button" onClick={onClose} disabled={isUploading}>Hủy</button>
            <button className="btn btn-primary" type="button" onClick={handleSubmit} disabled={isUploading}>
              {isUploading ? <Loader2 className="spin-icon" size={18} /> : <Upload size={18} />}
              Tải lên
            </button>
          </footer>
        </div>
      </section>
    </div>
  );
};

export const MediaEditModal = ({ media, isSaving, onClose, onSubmit }) => {
  const [description, setDescription] = useState(media?.description || '');

  useEscape(Boolean(media), onClose);

  if (!media) return null;

  return (
    <div className="modal-overlay">
      <section className="modal-container gallery-media-edit-modal" role="dialog" aria-modal="true" aria-labelledby="media-edit-title">
        <header className="gallery-modal-header">
          <div>
            <span>{MEDIA_TYPE_LABELS[media.type]}</span>
            <h2 id="media-edit-title">{media.fileName}</h2>
          </div>
          <button className="icon-btn" type="button" onClick={onClose} aria-label="Đóng form mô tả">
            <X size={20} />
          </button>
        </header>
        <div className="gallery-form">
          <label>
            <span>Mô tả riêng</span>
            <textarea
              rows={5}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>
          <footer className="gallery-modal-actions">
            <button className="btn btn-outline" type="button" onClick={onClose} disabled={isSaving}>Hủy</button>
            <button className="btn btn-primary" type="button" onClick={() => onSubmit(description)} disabled={isSaving}>
              {isSaving ? <Loader2 className="spin-icon" size={18} /> : <Save size={18} />}
              Lưu mô tả
            </button>
          </footer>
        </div>
      </section>
    </div>
  );
};

export const MediaLightbox = ({ media, onClose }) => {
  useEscape(Boolean(media), onClose);

  if (!media) return null;

  return (
    <div className="modal-overlay gallery-lightbox-overlay">
      <section className="gallery-lightbox" role="dialog" aria-modal="true" aria-label="Xem tệp media">
        <button className="icon-btn gallery-lightbox-close" type="button" onClick={onClose} aria-label="Đóng ảnh đang xem">
          <X size={22} />
        </button>
        <div className="gallery-lightbox-media">
          {media.type === MEDIA_TYPE.VIDEO && media.url ? (
            <video src={media.url} controls poster={media.thumbnailUrl} />
          ) : media.type === MEDIA_TYPE.VIDEO ? (
            <div className="gallery-video-placeholder">
              <Video size={54} />
              <span>{media.fileName}</span>
            </div>
          ) : (
            <img src={media.url} alt={media.description || media.fileName} />
          )}
        </div>
        <footer className="gallery-lightbox-caption">
          <strong>{media.fileName}</strong>
          {media.description && <p>{media.description}</p>}
        </footer>
      </section>
    </div>
  );
};
