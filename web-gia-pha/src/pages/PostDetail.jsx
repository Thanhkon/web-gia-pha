import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CalendarDays, Edit3, EyeOff, Loader2, RotateCcw, Trash2 } from 'lucide-react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ConfirmModal from '../components/common/ConfirmModal';
import PostBadge from '../components/Posts/PostBadge';
import { POST_CONTENT_BLOCK, POST_ROLES, POST_STATUS } from '../types/posts';
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

const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const getPostDate = (post) => post?.publishedAt || post?.updatedAt || post?.createdAt;

const formatDate = (value) => {
  if (!value) return '';
  return dateFormatter.format(new Date(value));
};

const getReadingTime = (post) => {
  const wordCount = (post?.content || []).reduce((total, block) => {
    if (block.type !== POST_CONTENT_BLOCK.HEADING && block.type !== POST_CONTENT_BLOCK.PARAGRAPH) {
      return total;
    }

    const count = String(block.text || '').trim().split(/\s+/).filter(Boolean).length;
    return total + count;
  }, 0);

  return Math.max(1, Math.ceil(wordCount / 200));
};

const getHeadingId = (block) => {
  const rawId = String(block.id || block.text || '').toLowerCase();
  const safeId = rawId
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `post-section-${safeId || 'heading'}`;
};

const truncateText = (value, maxLength = 84) => {
  const text = String(value || '').trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
};

const ArticleImage = ({ block, title }) => {
  const [hasError, setHasError] = useState(false);

  if (!block.imageUrl || hasError) {
    return null;
  }

  return (
    <figure className="post-detail-figure">
      <img
        src={block.imageUrl}
        alt={block.caption || title}
        loading="lazy"
        onError={() => setHasError(true)}
      />
      {block.caption && <figcaption>{block.caption}</figcaption>}
    </figure>
  );
};

const renderContentBlock = (block, post) => {
  if (block.type === POST_CONTENT_BLOCK.HEADING) {
    return (
      <h2 className="post-detail-heading" id={getHeadingId(block)} key={block.id}>
        {block.text}
      </h2>
    );
  }

  if (block.type === POST_CONTENT_BLOCK.PARAGRAPH) {
    return <p key={block.id}>{block.text}</p>;
  }

  if (block.type === POST_CONTENT_BLOCK.IMAGE) {
    return <ArticleImage block={block} key={block.id} title={post.title} />;
  }

  return null;
};

const PostThumb = ({ post, backTarget, variant = 'compact' }) => {
  const [thumbHasError, setThumbHasError] = useState(false);
  const dateValue = getPostDate(post);
  const hasThumb = post.coverImage && !thumbHasError;

  return (
    <Link
      className={`post-detail-related-link post-detail-related-link-${variant}`}
      to={`/${post.familyId}/posts/${post.id}`}
      state={{ fromList: backTarget }}
    >
      {hasThumb ? (
        <img src={post.coverImage} alt="" loading="lazy" onError={() => setThumbHasError(true)} />
      ) : (
        <span className="post-detail-thumb-fallback">{post.category}</span>
      )}
      <span>
        <small>{post.category}</small>
        <strong>{post.title}</strong>
        {dateValue && (
          <time dateTime={dateValue}>{formatDate(dateValue)}</time>
        )}
      </span>
    </Link>
  );
};

const RecentPostsSidebar = ({ isLoading, error, posts, backTarget }) => (
  <aside className="post-detail-sidebar" aria-labelledby="recent-posts-title">
    <h2 id="recent-posts-title">Bài viết gần đây</h2>
    {isLoading && (
      <div className="post-detail-side-state">
        <Loader2 className="spin-icon" size={18} />
        <span>Đang tải...</span>
      </div>
    )}
    {!isLoading && error && (
      <p className="post-detail-side-state post-detail-side-error">{error}</p>
    )}
    {!isLoading && !error && posts.length === 0 && (
      <p className="post-detail-side-state">Chưa có bài viết gần đây.</p>
    )}
    {!isLoading && !error && posts.length > 0 && (
      <div className="post-detail-side-list">
        {posts.map((item) => (
          <PostThumb backTarget={backTarget} key={item.id} post={item} />
        ))}
      </div>
    )}
  </aside>
);

const RelatedPosts = ({ isLoading, error, posts, backTarget }) => (
  <section className="post-detail-related" aria-labelledby="related-posts-title">
    <div className="post-detail-related-header">
      <h2 id="related-posts-title">Bài viết liên quan</h2>
    </div>
    {isLoading && (
      <div className="post-detail-related-state">
        <Loader2 className="spin-icon" size={20} />
        <span>Đang tải bài viết liên quan...</span>
      </div>
    )}
    {!isLoading && error && (
      <p className="post-detail-related-state post-detail-side-error">{error}</p>
    )}
    {!isLoading && !error && posts.length === 0 && (
      <p className="post-detail-related-state">Chưa có bài viết liên quan.</p>
    )}
    {!isLoading && !error && posts.length > 0 && (
      <div className="post-detail-related-grid">
        {posts.map((item) => (
          <PostThumb backTarget={backTarget} key={item.id} post={item} variant="card" />
        ))}
      </div>
    )}
  </section>
);

const PostDetail = () => {
  const { familyId, id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const actor = useMemo(() => getPostActor(user, isAuthenticated, familyId), [user, isAuthenticated, familyId]);
  const publicHomePath = familyId ? `/${familyId}/home` : '/';
  const publicPostsPath = familyId ? `/${familyId}/posts` : '/posts';
  const backTarget = location.state?.fromList || publicPostsPath;
  const isAdminContext = String(backTarget).startsWith('/admin');
  const viewActor = useMemo(() => {
    if (isAdminContext || !actor?.familyId || actor.role === POST_ROLES.GUEST) {
      return actor;
    }

    return {
      ...actor,
      role: POST_ROLES.MEMBER,
      canCreatePost: false,
      canManagePosts: false,
    };
  }, [actor, isAdminContext]);
  const isManager = useMemo(() => isPostManager(viewActor), [viewActor]);

  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [coverHasError, setCoverHasError] = useState(false);
  const [recentPosts, setRecentPosts] = useState([]);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [isListsLoading, setIsListsLoading] = useState(false);
  const [listsError, setListsError] = useState('');
  const [notice, setNotice] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  const loadPost = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');

    try {
      const result = await postService.getPostById(id, viewActor);
      setPost(result);
    } catch (error) {
      setPost(null);
      setLoadError(error.message || 'Không thể tải bài viết.');
    } finally {
      setIsLoading(false);
    }
  }, [id, viewActor]);

  const loadPostLists = useCallback(async (currentPost) => {
    if (!currentPost) {
      setRecentPosts([]);
      setRelatedPosts([]);
      return;
    }

    setIsListsLoading(true);
    setListsError('');

    try {
      const result = await postService.getPosts({
        actor: viewActor,
        filters: {
          status: POST_STATUS.PUBLISHED,
          sortDirection: 'newest',
        },
        page: 1,
        pageSize: 12,
      });
      const candidates = result.items.filter((item) => item.id !== currentPost.id);
      const sameCategory = candidates.filter((item) => item.category === currentPost.category);
      const fallback = candidates.filter((item) => item.category !== currentPost.category);

      setRecentPosts(candidates.slice(0, 5));
      setRelatedPosts([...sameCategory, ...fallback].slice(0, 3));
    } catch (error) {
      setRecentPosts([]);
      setRelatedPosts([]);
      setListsError(error.message || 'Không thể tải danh sách bài viết.');
    } finally {
      setIsListsLoading(false);
    }
  }, [viewActor]);

  useEffect(() => {
    setCoverHasError(false);
    setNotice(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    loadPost();
  }, [loadPost]);

  useEffect(() => {
    loadPostLists(post);
  }, [loadPostLists, post]);

  useEffect(() => {
    if (!post?.title) return undefined;
    const previousTitle = document.title;
    document.title = `${post.title} | Gia phả`;
    return () => {
      document.title = previousTitle;
    };
  }, [post?.title]);

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
          <p>{loadError || 'Bài viết không tồn tại hoặc bạn không có quyền truy cập nội dung này.'}</p>
        </div>
      </div>
    );
  }

  const displayDate = getPostDate(post);
  const readingTime = getReadingTime(post);
  const postsCrumb = isAdminContext
    ? { label: 'Quản lý bài viết', to: backTarget }
    : { label: 'Bài viết', to: publicPostsPath };

  return (
    <article className="post-detail-page container animate-fade-in">
      <nav className="post-detail-breadcrumb" aria-label="Breadcrumb">
        <Link to={isAdminContext ? '/admin' : publicHomePath}>{isAdminContext ? 'Bảng điều khiển' : 'Trang chủ'}</Link>
        <span>/</span>
        <Link to={postsCrumb.to}>{postsCrumb.label}</Link>
        <span>/</span>
        <span title={post.title}>{truncateText(post.title, 72)}</span>
      </nav>

      <button className="btn btn-outline posts-back-btn" type="button" onClick={handleBack}>
        <ArrowLeft size={17} /> Quay lại danh sách
      </button>

      {notice && (
        <div className={`posts-notice posts-notice-${notice.type}`} role="status">
          {notice.text}
          <button type="button" onClick={() => setNotice(null)}>Đóng</button>
        </div>
      )}

      <header className="post-detail-header">
        <div className="post-detail-category">{post.category}</div>
        <h1>{post.title}</h1>
        {post.summary && <p className="post-detail-summary">{post.summary}</p>}
        <div className="post-detail-meta">
          {displayDate && (
            <span>
              <CalendarDays size={15} />
              <time dateTime={displayDate}>{formatDate(displayDate)}</time>
            </span>
          )}
          <span>{readingTime} phút đọc</span>
        </div>
        <div className="post-card-badges post-detail-badges">
          {isManager && <PostBadge type="status" value={post.status} />}
          <PostBadge type="visibility" value={post.visibility} />
        </div>
      </header>

      {post.coverImage && !coverHasError && (
        <figure className="post-detail-hero">
          <img src={post.coverImage} alt={post.title} onError={() => setCoverHasError(true)} />
        </figure>
      )}

      <div className="post-detail-actions">
        {canUpdatePost(viewActor, post) && (
          <Link className="btn btn-outline" to={familyId ? `/${familyId}/posts/${post.id}/edit` : `/posts/${post.id}/edit`} state={{ fromList: backTarget }}>
            <Edit3 size={17} /> Sửa
          </Link>
        )}
        {canHidePost(viewActor, post) && (
          <button className="btn btn-outline" type="button" onClick={() => setConfirmAction('hide')}>
            <EyeOff size={17} /> Ẩn
          </button>
        )}
        {canPublishPost(viewActor, post) && (
          <button className="btn btn-outline" type="button" onClick={() => setConfirmAction('publish')}>
            <RotateCcw size={17} /> {post.status === POST_STATUS.HIDDEN ? 'Đăng lại' : 'Đăng bài'}
          </button>
        )}
        {canDeletePost(viewActor, post) && (
          <button className="btn btn-outline text-danger" type="button" onClick={() => setConfirmAction('delete')}>
            <Trash2 size={17} /> Xóa
          </button>
        )}
      </div>

      <div className="post-article-layout">
        <main className="post-detail-content">
          {post.content.map((block) => renderContentBlock(block, post))}
        </main>

        <RecentPostsSidebar
          backTarget={backTarget}
          error={listsError}
          isLoading={isListsLoading}
          posts={recentPosts}
        />
      </div>

      <RelatedPosts
        backTarget={backTarget}
        error={listsError}
        isLoading={isListsLoading}
        posts={relatedPosts}
      />

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
