import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, FilePenLine, Loader2 } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ConfirmModal from '../components/common/ConfirmModal';
import PostForm from '../components/Posts/PostForm';
import { canCreatePost, canUpdatePost, getPostActor, postService } from '../services/postService';
import '../css/pages/Posts.css';

const PostEditor = ({ mode = 'create' }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const actor = useMemo(() => getPostActor(user, isAuthenticated), [user, isAuthenticated]);

  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(mode === 'edit');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const pendingNavigationRef = useRef(null);

  const backTarget = location.state?.fromList || '/posts';
  const isCreateMode = mode === 'create';

  const loadPost = useCallback(async () => {
    if (isCreateMode) return;

    setIsLoading(true);
    const result = await postService.getPostById(id, actor);
    setPost(result);
    setIsLoading(false);
  }, [actor, id, isCreateMode]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  useEffect(() => {
    const message = 'Bài viết có thay đổi chưa lưu. Bạn chắc chắn muốn rời trang?';

    const handleDocumentClick = (event) => {
      if (!hasUnsavedChanges) return;
      if (event.target.closest('.post-editor-page')) return;

      const navigationTarget = event.target.closest('a, button.dropdown-item, button.notification-btn, button.user-dropdown-item');
      if (!navigationTarget) return;

      if (!window.confirm(message)) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        return;
      }

      setHasUnsavedChanges(false);
    };

    const handlePopState = () => {
      if (!hasUnsavedChanges) return;

      if (!window.confirm(message)) {
        navigate(`${location.pathname}${location.search}`, { replace: true });
        return;
      }

      setHasUnsavedChanges(false);
    };

    document.addEventListener('click', handleDocumentClick, true);
    window.addEventListener('popstate', handlePopState);

    return () => {
      document.removeEventListener('click', handleDocumentClick, true);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [hasUnsavedChanges, location.pathname, location.search, navigate]);

  const handleCancel = (force = false) => {
    if (!force && hasUnsavedChanges) {
      pendingNavigationRef.current = () => navigate(backTarget);
      setShowLeaveConfirm(true);
      return;
    }

    setHasUnsavedChanges(false);
    navigate(backTarget);
  };

  const confirmPendingNavigation = () => {
    const pendingNavigation = pendingNavigationRef.current;
    pendingNavigationRef.current = null;
    setShowLeaveConfirm(false);
    setHasUnsavedChanges(false);

    if (pendingNavigation) {
      pendingNavigation();
    }
  };

  const handleSubmit = async (payload) => {
    setError('');
    setIsSaving(true);

    try {
      const savedPost = isCreateMode
        ? await postService.createPost(payload, actor)
        : await postService.updatePost(id, payload, actor);

      setHasUnsavedChanges(false);
      navigate(`/posts/${savedPost.id}`, {
        replace: true,
        state: { fromList: backTarget },
      });
    } catch (submitError) {
      setError(submitError.message || 'Không thể lưu bài viết.');
      throw submitError;
    } finally {
      setIsSaving(false);
    }
  };

  if (isCreateMode && !canCreatePost(actor)) {
    return (
      <div className="posts-page container animate-fade-in">
        <button className="btn btn-outline posts-back-btn" type="button" onClick={() => handleCancel()}>
          <ArrowLeft size={17} /> Quay lại
        </button>
        <div className="posts-empty-state">
          <h1>Không có quyền tạo bài viết</h1>
          <p>Tài khoản hiện tại chưa được cấp quyền tạo nội dung cho dòng họ.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="posts-page container">
        <div className="posts-loading">
          <Loader2 className="spin-icon" size={28} />
          <span>Đang tải dữ liệu bài viết...</span>
        </div>
      </div>
    );
  }

  if (!isCreateMode && (!post || !canUpdatePost(actor, post))) {
    return (
      <div className="posts-page container animate-fade-in">
        <button className="btn btn-outline posts-back-btn" type="button" onClick={() => handleCancel()}>
          <ArrowLeft size={17} /> Quay lại
        </button>
        <div className="posts-empty-state">
          <h1>Không thể chỉnh sửa bài viết</h1>
          <p>Bài viết không tồn tại hoặc bạn không có quyền chỉnh sửa nội dung này.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="post-editor-page container animate-fade-in">
      <button className="btn btn-outline posts-back-btn" type="button" onClick={() => handleCancel()}>
        <ArrowLeft size={17} /> Quay lại
      </button>

      <header className="posts-page-header posts-editor-header">
        <div>
          <span className="posts-eyebrow">Bài viết</span>
          <h1>{isCreateMode ? 'Tạo bài viết' : 'Chỉnh sửa bài viết'}</h1>
          <p>{isCreateMode ? 'Soạn nội dung mới cho dòng họ, lưu nháp hoặc đăng ngay khi đã đủ thông tin.' : 'Cập nhật nội dung mà không tự thay đổi trạng thái xuất bản hiện tại.'}</p>
        </div>
        <FilePenLine size={42} />
      </header>

      {error && (
        <div className="posts-notice posts-notice-error" role="alert">
          {error}
          <button type="button" onClick={() => setError('')}>Đóng</button>
        </div>
      )}

      <div className="post-editor-panel">
        <PostForm
          mode={mode}
          initialPost={post}
          isSaving={isSaving}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          onDirtyChange={setHasUnsavedChanges}
        />
      </div>

      <ConfirmModal
        isOpen={showLeaveConfirm}
        title="Rời khỏi form?"
        message="Bài viết có thay đổi chưa lưu. Nếu rời đi, các thay đổi này sẽ bị mất."
        confirmText="Rời form"
        cancelText="Ở lại"
        isDanger
        onConfirm={confirmPendingNavigation}
        onCancel={() => {
          pendingNavigationRef.current = null;
          setShowLeaveConfirm(false);
        }}
      />
    </div>
  );
};

export default PostEditor;
