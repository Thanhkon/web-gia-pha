import React, { useEffect, useMemo, useState } from 'react';
import { ImagePlus, Loader2, Save, Send, X } from 'lucide-react';
import ConfirmModal from '../common/ConfirmModal';
import { POST_CATEGORIES, POST_STATUS, POST_VISIBILITY, POST_VISIBILITY_LABELS } from '../../types/posts';

const MAX_LOCAL_IMAGE_SIZE = 2 * 1024 * 1024;

const emptyPost = {
  title: '',
  summary: '',
  content: '',
  category: POST_CATEGORIES[0],
  coverImage: '',
  visibility: POST_VISIBILITY.INTERNAL,
};

const PostForm = ({ mode = 'create', initialPost, onSubmit, onCancel, onDirtyChange, isSaving = false }) => {
  const initialValues = useMemo(() => ({
    ...emptyPost,
    ...initialPost,
    status: initialPost?.status || POST_STATUS.DRAFT,
  }), [initialPost]);

  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [localImageNote, setLocalImageNote] = useState('');
  const [localImagePreview, setLocalImagePreview] = useState('');

  useEffect(() => {
    setValues(initialValues);
    setIsDirty(false);
    setLocalImageNote('');
    setLocalImagePreview('');
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

  const validate = () => {
    const nextErrors = {};

    if (!values.title.trim()) {
      nextErrors.title = 'Vui lòng nhập tiêu đề bài viết.';
    }

    if (!values.content.trim()) {
      nextErrors.content = 'Vui lòng nhập nội dung bài viết.';
    }

    if (!values.category) {
      nextErrors.category = 'Vui lòng chọn danh mục.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (status) => {
    if (isSaving) return;
    if (!validate()) return;

    await onSubmit({
      ...values,
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

  const handleLocalImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setLocalImagePreview('');
      setLocalImageNote('Vui lòng chọn đúng định dạng ảnh.');
      event.target.value = '';
      return;
    }

    if (file.size > MAX_LOCAL_IMAGE_SIZE) {
      setLocalImagePreview('');
      setLocalImageNote('Ảnh preview tối đa 2 MB. Vui lòng chọn ảnh nhỏ hơn hoặc nhập URL ảnh.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setLocalImagePreview(reader.result);
      setLocalImageNote('Ảnh chỉ dùng để preview cục bộ, chưa upload và sẽ không được lưu vào bài viết.');
    };
    reader.readAsDataURL(file);
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
                setLocalImagePreview('');
              }}
              placeholder="Dán URL ảnh"
            />
          </label>
        </div>

        <div className="post-image-row">
          <label className="btn btn-outline post-image-picker">
            <ImagePlus size={17} /> Chọn ảnh preview
            <input type="file" accept="image/*" onChange={handleLocalImage} />
          </label>
          <span>{localImageNote || 'Có thể nhập URL ảnh hoặc chọn ảnh tối đa 2 MB để preview cục bộ.'}</span>
        </div>

        {(localImagePreview || values.coverImage) && (
          <div className="post-form-preview">
            <img src={localImagePreview || values.coverImage} alt="Xem trước ảnh đại diện" />
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

        <label className="form-group">
          <span>Nội dung <strong className="required">*</strong></span>
          <textarea
            rows={12}
            value={values.content}
            onChange={(event) => setField('content', event.target.value)}
            placeholder="Viết nội dung bài viết"
            aria-invalid={Boolean(errors.content)}
          />
          {errors.content && <span className="field-error">{errors.content}</span>}
        </label>

        <div className="post-form-actions">
          <button className="btn btn-outline" type="button" onClick={handleCancel} disabled={isSaving}>
            <X size={17} /> Hủy
          </button>
          {mode === 'create' && (
            <button className="btn btn-outline" type="button" onClick={() => handleSubmit(POST_STATUS.DRAFT)} disabled={isSaving}>
              {isSaving ? <Loader2 size={17} className="spin-icon" /> : <Save size={17} />}
              Lưu bản nháp
            </button>
          )}
          <button className="btn btn-primary" type="button" onClick={() => handleSubmit(mode === 'create' ? POST_STATUS.PUBLISHED : values.status)} disabled={isSaving}>
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
