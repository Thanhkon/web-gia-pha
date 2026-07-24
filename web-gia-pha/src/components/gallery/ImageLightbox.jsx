import React, { useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { MEDIA_TYPE } from '../../types/gallery';

const ImageLightbox = ({ image, images = [], onClose, onSelectImage }) => {
  const imageIndex = image?.type === MEDIA_TYPE.IMAGE
    ? images.findIndex((item) => item.id === image.id)
    : -1;
  const canNavigate = imageIndex >= 0 && images.length > 1;

  const showPrevious = useCallback(() => {
    if (!canNavigate) return;
    const nextIndex = imageIndex === 0 ? images.length - 1 : imageIndex - 1;
    onSelectImage(images[nextIndex]);
  }, [canNavigate, imageIndex, images, onSelectImage]);

  const showNext = useCallback(() => {
    if (!canNavigate) return;
    const nextIndex = imageIndex === images.length - 1 ? 0 : imageIndex + 1;
    onSelectImage(images[nextIndex]);
  }, [canNavigate, imageIndex, images, onSelectImage]);

  useEffect(() => {
    if (!image) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [image]);

  useEffect(() => {
    if (!image) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key === 'ArrowLeft') {
        showPrevious();
        return;
      }

      if (event.key === 'ArrowRight') {
        showNext();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [image, onClose, showNext, showPrevious]);

  if (!image || image.type !== MEDIA_TYPE.IMAGE) return null;

  return createPortal(
    <div className="gallery-lightbox-overlay" onClick={onClose}>
      <section
        className="gallery-lightbox"
        role="dialog"
        aria-modal="true"
        aria-label="Xem ảnh"
        onClick={(event) => event.stopPropagation()}
      >
        <button className="icon-btn gallery-lightbox-close" type="button" onClick={onClose} aria-label="Đóng ảnh đang xem">
          <X size={22} />
        </button>

        {canNavigate && (
          <>
            <button
              className="gallery-lightbox-nav gallery-lightbox-nav-prev"
              type="button"
              onClick={showPrevious}
              aria-label="Xem ảnh trước"
            >
              <ChevronLeft size={28} />
            </button>
            <button
              className="gallery-lightbox-nav gallery-lightbox-nav-next"
              type="button"
              onClick={showNext}
              aria-label="Xem ảnh tiếp theo"
            >
              <ChevronRight size={28} />
            </button>
          </>
        )}

        <div className="gallery-lightbox-media">
          <img src={image.url} alt={image.description || image.fileName} />
        </div>

        {image.description && (
          <footer className="gallery-lightbox-caption">
            <p>{image.description}</p>
          </footer>
        )}
      </section>
    </div>,
    document.body
  );
};

export default ImageLightbox;
