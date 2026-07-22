import React from 'react';
import { FilterX, Search } from 'lucide-react';
import {
  POST_CATEGORIES,
  POST_STATUS,
  POST_STATUS_LABELS,
  POST_VISIBILITY,
  POST_VISIBILITY_LABELS,
} from '../../types/posts';
import { isPostManager } from '../../services/postService';

const PostFilters = ({ filters, actor, onChange, onReset }) => {
  const isManager = isPostManager(actor);
  const statusOptions = [POST_STATUS.PUBLISHED, POST_STATUS.DRAFT, POST_STATUS.HIDDEN];
  const visibilityOptions = [POST_VISIBILITY.PUBLIC, POST_VISIBILITY.INTERNAL];

  const handleChange = (name, value) => {
    onChange({ ...filters, [name]: value });
  };

  const hasFilters = Boolean(
    filters.keyword
      || filters.category
      || (isManager && filters.status)
      || (isManager && filters.visibility)
      || filters.sortDirection !== 'newest'
  );

  return (
    <section className="posts-filter-panel" aria-label="Bộ lọc bài viết">
      <div className="posts-search-field">
        <Search size={18} />
        <input
          type="search"
          value={filters.keyword}
          placeholder="Tìm theo tiêu đề"
          onChange={(event) => handleChange('keyword', event.target.value)}
        />
      </div>

      <div className={`posts-filter-grid ${isManager ? '' : 'posts-filter-grid-basic'}`}>
        <label className="posts-filter-control">
          <span>Danh mục</span>
          <select value={filters.category} onChange={(event) => handleChange('category', event.target.value)}>
            <option value="">Tất cả danh mục</option>
            {POST_CATEGORIES.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </label>

        {isManager && (
          <label className="posts-filter-control">
            <span>Trạng thái</span>
            <select value={filters.status} onChange={(event) => handleChange('status', event.target.value)}>
              <option value="">Tất cả trạng thái</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>{POST_STATUS_LABELS[status]}</option>
              ))}
            </select>
          </label>
        )}

        {isManager && (
          <label className="posts-filter-control">
            <span>Phạm vi</span>
            <select value={filters.visibility} onChange={(event) => handleChange('visibility', event.target.value)}>
              <option value="">Tất cả phạm vi</option>
              {visibilityOptions.map((visibility) => (
                <option key={visibility} value={visibility}>{POST_VISIBILITY_LABELS[visibility]}</option>
              ))}
            </select>
          </label>
        )}

        <label className="posts-filter-control">
          <span>Sắp xếp</span>
          <select value={filters.sortDirection} onChange={(event) => handleChange('sortDirection', event.target.value)}>
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
          </select>
        </label>
      </div>

      <button className="btn btn-outline posts-clear-filter" type="button" onClick={onReset} disabled={!hasFilters}>
        <FilterX size={17} /> Xóa lọc
      </button>
    </section>
  );
};

export default PostFilters;
