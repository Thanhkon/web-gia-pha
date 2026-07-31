import React from 'react';
import { CalendarDays, Edit3, EyeOff, RotateCcw, Trash2, UserRound } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { POST_STATUS, POST_VISIBILITY } from '../../types/posts';
import {
  canDeletePost,
  canHidePost,
  isPostManager,
  canPublishPost,
  canUpdatePost,
} from '../../services/postService';
import PostBadge from './PostBadge';

const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const PostCard = ({ post, actor, onPublish, onHide, onDelete }) => {
  const location = useLocation();
  const isManager = isPostManager(actor);
  const displayDate = post.publishedAt || post.updatedAt || post.createdAt;

  return (
    <article className="post-card">
      <Link
        to={`/${post.familyId}/posts/${post.id}`}
        state={{ fromList: `${location.pathname}${location.search}` }}
        className="post-card-cover"
        aria-label={`Xem bài viết ${post.title}`}
      >
        {post.coverImage ? (
          <img src={post.coverImage} alt={post.title} loading="lazy" />
        ) : (
          <div className="post-cover-fallback">
            <span>{post.category}</span>
          </div>
        )}
      </Link>

      <div className="post-card-body">
        <div className="post-card-badges">
          {isManager && <PostBadge type="status" value={post.status} />}
          {(isManager || post.visibility !== POST_VISIBILITY.PUBLIC) && <PostBadge type="visibility" value={post.visibility} />}
        </div>

        <Link
          to={`/${post.familyId}/posts/${post.id}`}
          state={{ fromList: `${location.pathname}${location.search}` }}
          className="post-card-title"
        >
          {post.title}
        </Link>

        <p className="post-card-summary">{post.summary}</p>

        <div className="post-card-meta">
          <span>{post.category}</span>
          <span><UserRound size={14} /> {post.author.name}</span>
          <span><CalendarDays size={14} /> {dateFormatter.format(new Date(displayDate))}</span>
        </div>

        <div className="post-card-actions">
          {canUpdatePost(actor, post) && (
            <Link
              className="btn btn-outline post-action-btn"
              to={`/${post.familyId}/posts/${post.id}/edit`}
              state={{ fromList: `${location.pathname}${location.search}` }}
              title="Sửa bài viết"
            >
              <Edit3 size={16} /> Sửa
            </Link>
          )}

          {canHidePost(actor, post) && (
            <button className="btn btn-outline post-action-btn" type="button" onClick={() => onHide(post)} title="Ẩn bài viết">
              <EyeOff size={16} /> Ẩn
            </button>
          )}

          {canPublishPost(actor, post) && (
            <button className="btn btn-outline post-action-btn" type="button" onClick={() => onPublish(post)} title="Đăng bài">
              <RotateCcw size={16} /> {post.status === POST_STATUS.HIDDEN ? 'Đăng lại' : 'Đăng'}
            </button>
          )}

          {canDeletePost(actor, post) && (
            <button className="btn btn-outline post-action-btn text-danger" type="button" onClick={() => onDelete(post)} title="Xóa bài viết">
              <Trash2 size={16} /> Xóa
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

export default PostCard;
