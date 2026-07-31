import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ImagePlus,
  Loader2,
  Plus,
  Save,
  Send,
  Trash2,
  Type,
  X,
} from 'lucide-react';
import ConfirmModal from '../common/ConfirmModal';
import {
  POST_CATEGORIES,
  POST_CONTENT_BLOCK,
  POST_STATUS,
  POST_VISIBILITY,
  POST_VISIBILITY_LABELS,
} from '../../types/posts';
import { postService } from '../../services/postService';

const MAX_LOCAL_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_CONTENT_IMAGE_SIZE = 5 * 1024 * 1024;

const emptyPost = {
  title: '',
  summary: '',
  content: [],
  category: POST_CATEGORIES[0],
  coverImage: '',
  visibility: POST_VISIBILITY.INTERNAL,
};

const createBlockId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `post-block-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const createBlock = (type) => {
  const baseBlock = { id: createBlockId(), type };

  if (type === POST_CONTENT_BLOCK.IMAGE) {
    return { ...baseBlock, imageUrl: '', caption: '' };
  }

  return { ...baseBlock, text: '' };
};

const normalizeInitialContent = (content) => {
  if (typeof content === 'string') {
    return content.trim()
      ? [{ id: createBlockId(), type: POST_CONTENT_BLOCK.PARAGRAPH, text: content }]
      : [createBlock(POST_CONTENT_BLOCK.PARAGRAPH)];
  }

  if (Array.isArray(content) && content.length > 0) {
    return content.map((block) => ({ ...block, id: block.id || createBlockId() }));
  }

  return [createBlock(POST_CONTENT_BLOCK.PARAGRAPH)];
};

const getNonEmptyBlocks = (blocks) => blocks.flatMap((block) => {
  if (block.type === POST_CONTENT_BLOCK.HEADING || block.type === POST_CONTENT_BLOCK.PARAGRAPH) {
    return block.text?.trim() ? [{ ...block, text: block.text.trim() }] : [];
  }

  if (block.type === POST_CONTENT_BLOCK.IMAGE) {
    return block.imageUrl?.trim()
      ? [{
        ...block,
        imageUrl: block.imageUrl.trim(),
        caption: block.caption?.trim() || '',
      }]
      : [];
  }

  return [];
});

const PostForm = ({ mode = 'create', initialPost, onSubmit, onCancel, onDirtyChange, isSaving = false }) => {
  const initialValues = useMemo(() => ({
    ...emptyPost,
    ...initialPost,
    content: normalizeInitialContent(initialPost?.content),
    status: initialPost?.status || POST_STATUS.DRAFT,
  }), [initialPost]);

  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [uploadingBlockId, setUploadingBlockId] = useState(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [localImageNote, setLocalImageNote] = useState('');

  useEffect(() => {
    setValues(initialValues);
    setIsDirty(false);
    setLocalImageNote('');
    setUploadingBlockId(null);
    setIsUploadingCover(false);
  }, [initialValues]);

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (!isDirty) return;

      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const setField = (field, value) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
    setIsDirty(true);
  };

  const updateBlock = (blockId, patch) => {
    setValues((current) => ({
      ...current,
      content: current.content.map((block) => (
        block.id === blockId ? { ...block, ...patch } : block
      )),
    }));
    setErrors((current) => ({ ...current, content: '' }));
    setIsDirty(true);
  };

  const addBlock = (type) => {
    setValues((current) => ({
      ...current,
      content: [...current.content, createBlock(type)],
    }));
    setErrors((current) => ({ ...current, content: '' }));
    setIsDirty(true);
  };

  const removeBlock = (blockId) => {
    setValues((current) => {
      const nextContent = current.content.filter((block) => block.id !== blockId);
      return {
        ...current,
        content: nextContent.length > 0 ? nextContent : [createBlock(POST_CONTENT_BLOCK.PARAGRAPH)],
      };
    });
    setIsDirty(true);
  };

  const moveBlock = (blockId, direction) => {
    setValues((current) => {
      const currentIndex = current.content.findIndex((block) => block.id === blockId);
      const nextIndex = currentIndex + direction;

      if (currentIndex < 0 || nextIndex < 0 || nextIndex >= current.content.length) {
        return current;
      }

      const nextContent = [...current.content];
      const [item] = nextContent.splice(currentIndex, 1);
      nextContent.splice(nextIndex, 0, item);

      return { ...current, content: nextContent };
    });
    setIsDirty(true);
  };

  const validate = () => {
    const nextErrors = {};

    if (!values.title.trim()) {
      nextErrors.title = 'Vui lòng nhập tiêu đề bài viết.';
    }

    if (getNonEmptyBlocks(values.content).length === 0) {
      nextErrors.content = 'Vui lòng thêm ít nhất một block nội dung.';
    }

    if (!values.category) {
      nextErrors.category = 'Vui lòng chọn danh mục.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (status) => {
    if (isSaving || uploadingBlockId || isUploadingCover) return;
    if (!validate()) return;

    await onSubmit({
      ...values,
      content: getNonEmptyBlocks(values.content),
      status,
    });
    setIsDirty(false);
  };

  const handleCancel = () => {
    if (isDirty) {
      setShowCancelConfirm(true);
      return;
    }

    onCancel(true);
  };

  const handleLocalImage = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setLocalImageNote('Vui lòng chọn đúng định dạng ảnh.');
      return;
    }

    if (file.size > MAX_LOCAL_IMAGE_SIZE) {
      setLocalImageNote('Ảnh đại diện tối đa 5 MB. Vui lòng chọn ảnh nhỏ hơn hoặc nhập URL ảnh.');
      return;
    }

    setIsUploadingCover(true);
    setLocalImageNote('Đang tải ảnh đại diện lên...');

    try {
      const result = await postService.uploadPostImage(file);
      setField('coverImage', result.url);
      setLocalImageNote('Ảnh đại diện đã được tải lên và sẽ lưu bằng URL.');
    } catch (uploadError) {
      setLocalImageNote(uploadError.response?.data?.message || uploadError.message || 'Không thể tải ảnh đại diện lên.');
    } finally {
      setIsUploadingCover(false);
    }
  };

  const uploadBlockImage = async (blockId, event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrors((current) => ({ ...current, content: 'Vui lòng chọn đúng định dạng ảnh.' }));
      return;
    }

    if (file.size > MAX_CONTENT_IMAGE_SIZE) {
      setErrors((current) => ({ ...current, content: 'Ảnh trong bài viết tối đa 5 MB.' }));
      return;
    }

    setUploadingBlockId(blockId);
    setErrors((current) => ({ ...current, content: '' }));

    try {
      const result = await postService.uploadPostImage(file);
      updateBlock(blockId, { imageUrl: result.url });
    } catch (uploadError) {
      setErrors((current) => ({
        ...current,
        content: uploadError.response?.data?.message || uploadError.message || 'Không thể tải ảnh lên.',
      }));
    } finally {
      setUploadingBlockId(null);
    }
  };

  return (
    <>
      <form className="post-form" onSubmit={(event) => event.preventDefault()}>
        <div className="post-form-grid">
          <label className="form-group">
            <span>Tiêu đề <strong className="required">*</strong></span>
            <input
              value={values.title}
              onChange={(event) => setField('title', event.target.value)}
              placeholder="Nhập tiêu đề bài viết"
              aria-invalid={Boolean(errors.title)}
            />
            {errors.title && <span className="field-error">{errors.title}</span>}
          </label>

          <label className="form-group">
            <span>Danh mục <strong className="required">*</strong></span>
            <select value={values.category} onChange={(event) => setField('category', event.target.value)}>
              {POST_CATEGORIES.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            {errors.category && <span className="field-error">{errors.category}</span>}
          </label>

          <label className="form-group">
            <span>Phạm vi hiển thị</span>
            <select value={values.visibility} onChange={(event) => setField('visibility', event.target.value)}>
              {Object.values(POST_VISIBILITY).map((visibility) => (
                <option key={visibility} value={visibility}>{POST_VISIBILITY_LABELS[visibility]}</option>
              ))}
            </select>
          </label>

          <label className="form-group">
            <span>Ảnh đại diện</span>
            <input
              value={values.coverImage && !values.coverImage.startsWith('data:') ? values.coverImage : ''}
              onChange={(event) => {
                setField('coverImage', event.target.value);
                setLocalImageNote('');
              }}
              placeholder="Dán URL ảnh"
            />
          </label>
        </div>

        <div className="post-image-row">
          <label className="btn btn-outline post-image-picker">
            {isUploadingCover ? <Loader2 className="spin-icon" size={17} /> : <ImagePlus size={17} />}
            {isUploadingCover ? 'Đang tải ảnh' : 'Chọn ảnh đại diện'}
            <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleLocalImage} disabled={isUploadingCover} />
          </label>
          {values.coverImage && (
            <button
              className="btn btn-outline post-image-clear"
              type="button"
              onClick={() => {
                setField('coverImage', '');
                setLocalImageNote('');
              }}
            >
              <X size={16} /> Xóa ảnh
            </button>
          )}
          <span>{localImageNote || 'Có thể dán URL ảnh hoặc chọn ảnh từ máy tối đa 5 MB.'}</span>
        </div>

        {values.coverImage && (
          <div className="post-form-preview">
            <img src={values.coverImage} alt="Xem trước ảnh đại diện" />
          </div>
        )}

        <label className="form-group">
          <span>Mô tả ngắn</span>
          <textarea
            rows={3}
            value={values.summary}
            onChange={(event) => setField('summary', event.target.value)}
            placeholder="Tóm tắt nội dung chính của bài viết"
          />
        </label>

        <section className="post-content-builder" aria-label="Nội dung bài viết">
          <div className="post-content-builder-header">
            <div>
              <span>Nội dung <strong className="required">*</strong></span>
              <p>Thêm và sắp xếp tiêu đề phụ, đoạn văn, hình ảnh theo thứ tự mong muốn.</p>
            </div>
            <div className="post-block-add-actions">
              <button className="btn btn-outline" type="button" onClick={() => addBlock(POST_CONTENT_BLOCK.PARAGRAPH)}>
                <Plus size={16} /> Thêm đoạn văn
              </button>
              <button className="btn btn-outline" type="button" onClick={() => addBlock(POST_CONTENT_BLOCK.HEADING)}>
                <Type size={16} /> Thêm tiêu đề phụ
              </button>
              <button className="btn btn-outline" type="button" onClick={() => addBlock(POST_CONTENT_BLOCK.IMAGE)}>
                <ImagePlus size={16} /> Thêm hình ảnh
              </button>
            </div>
          </div>

          {errors.content && <span className="field-error">{errors.content}</span>}

          <div className="post-block-list">
            {values.content.map((block, blockIndex) => (
              <article className="post-content-block" key={block.id}>
                <div className="post-content-block-toolbar">
                  <strong>
                    {block.type === POST_CONTENT_BLOCK.HEADING && 'Tiêu đề phụ'}
                    {block.type === POST_CONTENT_BLOCK.PARAGRAPH && 'Đoạn văn'}
                    {block.type === POST_CONTENT_BLOCK.IMAGE && 'Hình ảnh'}
                  </strong>
                  <div>
                    <button
                      className="icon-btn"
                      type="button"
                      onClick={() => moveBlock(block.id, -1)}
                      disabled={blockIndex === 0}
                      aria-label="Di chuyển block lên"
                    >
                      <ArrowUp size={16} />
                    </button>
                    <button
                      className="icon-btn"
                      type="button"
                      onClick={() => moveBlock(block.id, 1)}
                      disabled={blockIndex === values.content.length - 1}
                      aria-label="Di chuyển block xuống"
                    >
                      <ArrowDown size={16} />
                    </button>
                    <button
                      className="icon-btn text-danger"
                      type="button"
                      onClick={() => removeBlock(block.id)}
                      aria-label="Xóa block"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {block.type === POST_CONTENT_BLOCK.HEADING && (
                  <input
                    value={block.text || ''}
                    onChange={(event) => updateBlock(block.id, { text: event.target.value })}
                    placeholder="Nhập tiêu đề phụ"
                  />
                )}

                {block.type === POST_CONTENT_BLOCK.PARAGRAPH && (
                  <textarea
                    rows={5}
                    value={block.text || ''}
                    onChange={(event) => updateBlock(block.id, { text: event.target.value })}
                    placeholder="Nhập đoạn văn"
                  />
                )}

                {block.type === POST_CONTENT_BLOCK.IMAGE && (
                  <div className="post-image-block-fields">
                    <div className="post-image-block-row">
                      <label className="btn btn-outline post-image-picker">
                        {uploadingBlockId === block.id ? <Loader2 className="spin-icon" size={16} /> : <ImagePlus size={16} />}
                        {block.imageUrl ? 'Thay ảnh' : 'Tải ảnh'}
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={(event) => uploadBlockImage(block.id, event)}
                          disabled={Boolean(uploadingBlockId)}
                        />
                      </label>
                      <input
                        value={block.imageUrl || ''}
                        onChange={(event) => updateBlock(block.id, { imageUrl: event.target.value })}
                        placeholder="Hoặc dán URL ảnh"
                      />
                    </div>

                    {block.imageUrl && (
                      <figure className="post-image-block-preview">
                        <img src={block.imageUrl} alt={block.caption || values.title || 'Ảnh trong bài viết'} />
                      </figure>
                    )}

                    <input
                      value={block.caption || ''}
                      onChange={(event) => updateBlock(block.id, { caption: event.target.value })}
                      placeholder="Chú thích ảnh"
                    />
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>

        <div className="post-form-actions">
          <button className="btn btn-outline" type="button" onClick={handleCancel} disabled={isSaving}>
            <X size={17} /> Hủy
          </button>
          {mode === 'create' && (
            <button className="btn btn-outline" type="button" onClick={() => handleSubmit(POST_STATUS.DRAFT)} disabled={isSaving || isUploadingCover || Boolean(uploadingBlockId)}>
              {isSaving ? <Loader2 size={17} className="spin-icon" /> : <Save size={17} />}
              Lưu bản nháp
            </button>
          )}
          <button className="btn btn-primary" type="button" onClick={() => handleSubmit(mode === 'create' ? POST_STATUS.PUBLISHED : values.status)} disabled={isSaving || isUploadingCover || Boolean(uploadingBlockId)}>
            {isSaving ? <Loader2 size={17} className="spin-icon" /> : <Send size={17} />}
            {mode === 'create' ? 'Đăng bài' : 'Lưu thay đổi'}
          </button>
        </div>
      </form>

      <ConfirmModal
        isOpen={showCancelConfirm}
        title="Rời khỏi form?"
        message="Bài viết có thay đổi chưa lưu. Nếu rời đi, các thay đổi này sẽ bị mất."
        confirmText="Rời form"
        cancelText="Ở lại"
        isDanger
        onConfirm={() => {
          setIsDirty(false);
          onCancel(true);
        }}
        onCancel={() => setShowCancelConfirm(false)}
      />
    </>
  );
};

export default PostForm;
