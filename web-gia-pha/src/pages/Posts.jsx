import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FileText, Loader2, PlusCircle } from 'lucide-react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useFamilyActor } from '../hooks/useFamilyActor';
import ConfirmModal from '../components/common/ConfirmModal';
import Pagination from '../components/common/Pagination';
import PostCard from '../components/Posts/PostCard';
import PostFilters from '../components/Posts/PostFilters';
import { canCreatePost, getPostActor, isPostManager } from '../services/postService';
import { fetchPosts, publishPost, hidePost, deletePost } from '../store/slices/postsSlice';
import { POST_ROLE_LABELS, POST_ROLES } from '../types/posts';
import '../css/pages/Posts.css';

const PAGE_SIZE = 6;

const defaultFilters = {
  keyword: '',
  category: '',
  status: '',
  visibility: '',
  sortDirection: 'newest',
};

const Posts = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const { familyId } = useParams();
  const navigate = useNavigate();
  const authUser = useFamilyActor();
  const isAuthenticated = Boolean(authUser);
  const actor = useMemo(() => getPostActor(authUser, isAuthenticated, familyId), [authUser, isAuthenticated, familyId]);
  const viewActor = actor;
  const isManager = useMemo(() => isPostManager(viewActor), [viewActor]);

  const dispatch = useDispatch();
  const { list: posts = [], total, totalPages, page, loading: isLoading } = useSelector(state => state.posts);
  const [loadError, setLoadError] = useState('');
  const [notice, setNotice] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  const filters = useMemo(() => ({
    keyword: searchParams.get('keyword') || '',
    category: searchParams.get('category') || '',
    status: searchParams.get('status') || '',
    visibility: searchParams.get('visibility') || '',
    sortDirection: searchParams.get('sort') || 'newest',
  }), [searchParams]);

  const currentPage = Number(searchParams.get('page')) || 1;

  const fetchedParamsRef = React.useRef(null);

  const loadPosts = useCallback(async () => {
    const currentParams = JSON.stringify({ currentPage, filters, familyId });
    if (fetchedParamsRef.current === currentParams) return;

    setLoadError('');
    try {
      await dispatch(fetchPosts({
        options: {
          actor: viewActor,
          filters,
        },
        legacyPage: currentPage,
        legacyPageSize: PAGE_SIZE,
      })).unwrap();
      fetchedParamsRef.current = currentParams;
    } catch (error) {
      setLoadError(error.message || error || 'Không thể tải danh sách bài viết.');
    }
  }, [currentPage, filters, viewActor, familyId, dispatch]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  useEffect(() => {
    if (!location.state?.notice) return;

    setNotice({ type: 'success', text: location.state.notice });
    navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
  }, [location.pathname, location.search, location.state, navigate]);

  const updateParams = (nextFilters, nextPage = 1) => {
    const params = new URLSearchParams();

    if (nextFilters.keyword) params.set('keyword', nextFilters.keyword);
    if (nextFilters.category) params.set('category', nextFilters.category);
    if (isManager && nextFilters.status) params.set('status', nextFilters.status);
    if (isManager && nextFilters.visibility) params.set('visibility', nextFilters.visibility);
    if (nextFilters.sortDirection && nextFilters.sortDirection !== 'newest') params.set('sort', nextFilters.sortDirection);
    if (nextPage > 1) params.set('page', String(nextPage));

    setSearchParams(params);
  };

  const handleStatusAction = async (post, action) => {
    setConfirmAction(null);

    try {
      if (action === 'publish') {
        await dispatch(publishPost({ id: post.id, actor })).unwrap();
        setNotice({ type: 'success', text: 'Bài viết đã được đăng.' });
      } else if (action === 'hide') {
        await dispatch(hidePost({ id: post.id, actor })).unwrap();
        setNotice({ type: 'success', text: 'Bài viết đã được ẩn.' });
      } else {
        await dispatch(deletePost({ id: post.id, actor })).unwrap();
        setNotice({ type: 'success', text: 'Bài viết đã được xóa.' });
      }
    } catch (error) {
      setNotice({ type: 'error', text: error.message || error || 'Thao tác thất bại.' });
    }
  };

  return (
    <div className="posts-page container animate-fade-in">
      <header className="posts-page-header">
        <div>
          <span className="posts-eyebrow">Hoạt động dòng họ</span>
          <h1>Bài viết</h1>
          <p>Lưu giữ tin tức, câu chuyện, thông báo và tư liệu của dòng họ theo từng phạm vi hiển thị rõ ràng.</p>
        </div>

        {canCreatePost(viewActor) && (
          <Link className="btn btn-primary" to={familyId ? `/${familyId}/posts/new` : '/posts/new'}>
            <PlusCircle size={18} /> Tạo bài viết
          </Link>
        )}
      </header>

      <PostFilters
        filters={filters}
        actor={viewActor}
        onChange={(nextFilters) => updateParams(nextFilters, 1)}
        onReset={() => updateParams(defaultFilters, 1)}
      />

      {notice && (
        <div className={`posts-notice posts-notice-${notice.type}`} role="status">
          {notice.text}
          <button type="button" onClick={() => setNotice(null)}>Đóng</button>
        </div>
      )}

      <div className="posts-results-bar">
        <span>{pagination.total} bài viết phù hợp</span>
        <span>{viewActor.role === POST_ROLES.GUEST ? 'Bạn đang xem với quyền khách.' : `Đang xem với quyền ${POST_ROLE_LABELS[viewActor.role]}.`}</span>
      </div>

      {isLoading ? (
        <div className="posts-loading">
          <Loader2 className="spin-icon" size={28} />
          <span>Đang tải danh sách bài viết...</span>
        </div>
      ) : loadError ? (
        <div className="posts-empty-state posts-error-state">
          <FileText size={42} />
          <h2>Không tải được bài viết</h2>
          <p>{loadError}</p>
          <button className="btn btn-outline" type="button" onClick={loadPosts}>Thử lại</button>
        </div>
      ) : posts.length === 0 ? (
        <div className="posts-empty-state">
          <FileText size={42} />
          <h2>Chưa có bài viết phù hợp</h2>
          <p>Thử xóa bớt điều kiện lọc hoặc tạo bài viết mới cho dòng họ.</p>
        </div>
      ) : (
        <div className="posts-grid">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              actor={viewActor}
              onPublish={(item) => setConfirmAction({ post: item, action: 'publish' })}
              onHide={(item) => setConfirmAction({ post: item, action: 'hide' })}
              onDelete={(item) => setConfirmAction({ post: item, action: 'delete' })}
            />
          ))}
        </div>
      )}

      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={(page) => updateParams(filters, page)}
      />

      <ConfirmModal
        isOpen={Boolean(confirmAction)}
        title={confirmAction?.action === 'delete' ? 'Xóa bài viết?' : 'Cập nhật trạng thái?'}
        message={
          confirmAction?.action === 'delete'
            ? `Bạn chắc chắn muốn xóa "${confirmAction?.post.title}"? Thao tác này không thể hoàn tác.`
            : `Bạn muốn ${confirmAction?.action === 'hide' ? 'ẩn' : 'đăng'} bài "${confirmAction?.post.title}"?`
        }
        confirmText={confirmAction?.action === 'delete' ? 'Xóa' : 'Xác nhận'}
        cancelText="Hủy"
        isDanger={confirmAction?.action === 'delete'}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => handleStatusAction(confirmAction.post, confirmAction.action)}
      />
    </div>
  );
};

export default Posts;
