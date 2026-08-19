import React, { useEffect } from 'react';
import { useFamily } from '../../hooks/useFamily';
import Pagination from '../../components/common/Pagination';
import { useActivityLogs } from '../../hooks/useActivityLogs';
import { ACTIVITY_ACTION_LABELS, ACTIVITY_ACTION_COLORS } from '../../constants/activity';
import '../../css/pages/AdminActivityLog.css';

const AdminActivityLog = () => {
  const familyId = useFamily();

  const {
    logs,
    loading,
    pagination,
    filters,
    fetchLogs,
    handleFilterChange,
    applyFilters,
    handlePageChange,
    resetFilters,
  } = useActivityLogs(familyId);

  useEffect(() => {
    fetchLogs(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [familyId]);

  return (
    <div className="admin-activity-container">
      <div className="activity-header">
        <h1 className="activity-title">Nhật ký hoạt động</h1>
        <p className="activity-subtitle">Theo dõi các thay đổi và hoạt động trong gia phả</p>
      </div>

      <div className="activity-filters-card">
        <div className="activity-filters-layout">
          <div className="activity-filter-group">
            <label className="activity-filter-label">Hành động</label>
            <select
              name="action"
              value={filters.action}
              onChange={handleFilterChange}
              className="activity-filter-input"
            >
              <option value="">Tất cả</option>
              {Object.entries(ACTIVITY_ACTION_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div className="activity-filter-group">
            <label className="activity-filter-label">Từ ngày</label>
            <input
              type="date"
              name="fromDate"
              value={filters.fromDate}
              onChange={handleFilterChange}
              className="activity-filter-input"
            />
          </div>

          <div className="activity-filter-group">
            <label className="activity-filter-label">Đến ngày</label>
            <input
              type="date"
              name="toDate"
              value={filters.toDate}
              onChange={handleFilterChange}
              className="activity-filter-input"
            />
          </div>

          <div className="activity-filter-actions">
            <button onClick={applyFilters} className="btn-filter">
              Lọc
            </button>
            <button onClick={resetFilters} className="btn-reset">
              Xóa lọc
            </button>
          </div>
        </div>
      </div>

      <div className="activity-table-card">
        <div className="activity-table-wrapper">
          <table className="activity-table">
            <thead>
              <tr>
                <th>Thời gian</th>
                <th>Người thực hiện</th>
                <th>Hành động</th>
                <th>Đối tượng</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4}>
                    <div className="activity-loading">
                      <div className="spinner"></div>
                      Đang tải dữ liệu...
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <div className="activity-empty">
                      <div className="activity-empty-icon">
                        <i className="fi fi-rr-document"></i>
                      </div>
                      <p>Không có hoạt động nào được tìm thấy</p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td className="activity-time">
                      {(() => {
                        const d = new Date(log.createdAt);
                        // Do cấu hình database không lưu timezone (lưu 04:41 theo UTC) 
                        // nhưng khi lấy ra Node.js hiểu nhầm là giờ local nên bị lùi 7 tiếng.
                        // Bù lại 7 tiếng ở frontend để hiển thị đúng giờ thực tế.
                        d.setHours(d.getHours() + 7);

                        const timeFormatter = new Intl.DateTimeFormat('vi-VN', {
                          timeZone: 'Asia/Ho_Chi_Minh',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false
                        });
                        const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
                          timeZone: 'Asia/Ho_Chi_Minh',
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        });
                        return `${timeFormatter.format(d)} - ${dateFormatter.format(d)}`;
                      })()}
                    </td>
                    <td>
                      <div className="activity-actor">
                        <div className="activity-actor-avatar">
                          {log.actorName?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <span className="activity-actor-name">{log.actorName || 'Hệ thống'}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`action-badge ${ACTIVITY_ACTION_COLORS[log.action] || 'badge-gray'}`}>
                        {ACTIVITY_ACTION_LABELS[log.action] || log.action}
                      </span>
                    </td>
                    <td className="activity-target">
                      {log.targetName || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="activity-pagination-container">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminActivityLog;
