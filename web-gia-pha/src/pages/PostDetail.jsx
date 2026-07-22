import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CalendarDays, Edit3, EyeOff, Loader2, RotateCcw, Trash2, UserRound } from 'lucide-react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ConfirmModal from '../components/common/ConfirmModal';
import PostBadge from '../components/Posts/PostBadge';
import { POST_STATUS } from '../types/posts';
import {
  canDeletePost,
  canHidePost,
  isPostManager,
  canPublishPost,
  canUpdatePost,
  getPostActor,
  postService,
} from '../services/postService';
import '../css/pages/Posts.css';

const dateTimeFormatter = new Intl.DateTimeFormat('vi-VN', {
  hour: '2-digit',
  minute: '2-digit',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const PostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const actor = useMemo(() => getPostActor(user, isAuthenticated), [user, isAuthenticated]);
  const isManager = useMemo(() => isPostManager(actor), [actor]);

  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  const backTarget = location.state?.fromList || '/posts';

  const loadPost = useCallback(async () => {
    setIsLoading(true);
    const result = await postService.getPostById(id, actor);
    setPost(result);
    setIsLoading(false);
  }, [actor, id]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  const handleBack = () => {
    navigate(backTarget);
  };

  const handleStatusAction = async (action) => {
    setConfirmAction(null);

    try {
      if (action === 'publish') {
        await postService.publishPost(post.id, actor);
        setNotice({ type: 'success', text: 'Bài viết đã được đăng.' });
      } else if (action === 'hide') {
        await postService.hidePost(post.id, actor);
        setNotice({ type: 'success', text: 'Bài viết đã được ẩn.' });
      } else {
        await postService.deletePost(post.id, actor);
        navigate(backTarget, { replace: true, state: { notice: 'Bài viết đã được xóa.' } });
        return;
      }

      await loadPost();
    } catch (error) {
      setNotice({ type: 'error', text: error.message || 'Thao tác thất bại.' });
    }
  };

  if (isLoading) {
    return (
      <div className="posts-page container">
        <div className="posts-loading">
          <Loader2 className="spin-icon" size={28} />
          <span>Đang tải bài viết...</span>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="posts-page container animate-fade-in">
        <button className="btn btn-outline" type="button" onClick={handleBack}>
          <ArrowLeft size={17} /> Quay lại
        </button>
        <div className="posts-empty-state">
          <h1>Không tìm thấy bài viết</h1>
          <p>Bài viết không tồn tại hoặc bạn không có quyền truy cập nội dung này.</p>
        </div>
      </div>
    );
  }

  const displayDate = post.publishedAt || post.updatedAt || post.createdAt;

  return (
    <article className="post-detail-page container animate-fade-in">
      <button className="btn btn-outline posts-back-btn" type="button" onClick={handleBack}>
        <ArrowLeft size={17} /> Quay lại danh sách
      </button>

      {notice && (
        <div className={`posts-notice posts-notice-${notice.type}`} role="status">
          {notice.text}
          <button type="button" onClick={() => setNotice(null)}>Đóng</button>
        </div>
      )}

      <div className="post-detail-hero">
        {post.coverImage ? (
          <img src={post.coverImage} alt={post.title} />
        ) : (
          <div className="post-cover-fallback">
            <span>{post.category}</span>
          </div>
        )}
      </div>

      <header className="post-detail-header">
        <div className="post-card-badges">
          {isManager && <PostBadge type="status" value={post.status} />}
          <PostBadge type="visibility" value={post.visibility} />
        </div>
        <h1>{post.title}</h1>
        <div className="post-detail-meta">
          <span>{post.category}</span>
          <span><UserRound size={15} /> {post.author.name}</span>
          <span><CalendarDays size={15} /> {dateTimeFormatter.format(new Date(displayDate))}</span>
        </div>
      </header>

      <div className="post-detail-actions">
        {canUpdatePost(actor, post) && (
          <Link className="btn btn-outline" to={`/posts/${post.id}/edit`} state={{ fromList: backTarget }}>
            <Edit3 size={17} /> Sửa
          </Link>
        )}
        {canHidePost(actor, post) && (
          <button className="btn btn-outline" type="button" onClick={() => setConfirmAction('hide')}>
            <EyeOff size={17} /> Ẩn
          </button>
        )}
        {canPublishPost(actor, post) && (
          <button className="btn btn-outline" type="button" onClick={() => setConfirmAction('publish')}>
            <RotateCcw size={17} /> {post.status === POST_STATUS.HIDDEN ? 'Đăng lại' : 'Đăng bài'}
          </button>
        )}
        {canDeletePost(actor, post) && (
          <button className="btn btn-outline text-danger" type="button" onClick={() => setConfirmAction('delete')}>
            <Trash2 size={17} /> Xóa
          </button>
        )}
      </div>

      <div className="post-detail-content">
        {post.content.split('\n').map((paragraph) => (
          paragraph.trim()
            ? <p key={paragraph.slice(0, 40)}>{paragraph}</p>
            : null
        ))}
      </div>

      <ConfirmModal
        isOpen={Boolean(confirmAction)}
        title={confirmAction === 'delete' ? 'Xóa bài viết?' : 'Cập nhật trạng thái?'}
        message={
          confirmAction === 'delete'
            ? `Bạn chắc chắn muốn xóa "${post.title}"? Thao tác này không thể hoàn tác.`
            : `Bạn muốn ${confirmAction === 'hide' ? 'ẩn' : 'đăng'} bài "${post.title}"?`
        }
        confirmText={confirmAction === 'delete' ? 'Xóa' : 'Xác nhận'}
        cancelText="Hủy"
        isDanger={confirmAction === 'delete'}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => handleStatusAction(confirmAction)}
      />
    </article>
  );
};

export default PostDetail;
