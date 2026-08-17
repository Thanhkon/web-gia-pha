import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import apiClient from '../../utils/apiClient';
import { useFamily } from '../../hooks/useFamily';
import Pagination from '../../components/common/Pagination';
import '../../css/pages/AdminActivityLog.css';

const ACTIVITY_ACTION_LABELS = {
  ADD_MEMBER: 'Thêm thành viên',
  EDIT_MEMBER: 'Sửa thành viên',
  DELETE_MEMBER: 'Xóa thành viên',
  APPROVE_REQUEST: 'Duyệt yêu cầu',
  REJECT_REQUEST: 'Từ chối yêu cầu',
  CREATE_POST: 'Đăng bài viết',
  EDIT_POST: 'Sửa bài viết',
  DELETE_POST: 'Xóa bài viết',
  CREATE_EVENT: 'Tạo sự kiện',
  EDIT_EVENT: 'Sửa sự kiện',
  DELETE_EVENT: 'Xóa sự kiện',
  JOIN_FAMILY: 'Tham gia gia phả',
  UPLOAD_PHOTO: 'Tải ảnh lên',
};

const ACTIVITY_ACTION_COLORS = {
  ADD_MEMBER: 'badge-green',
  EDIT_MEMBER: 'badge-blue',
  DELETE_MEMBER: 'badge-red',
  APPROVE_REQUEST: 'badge-emerald',
  REJECT_REQUEST: 'badge-rose',
  CREATE_POST: 'badge-indigo',
  EDIT_POST: 'badge-purple',
  DELETE_POST: 'badge-red',
  CREATE_EVENT: 'badge-teal',
  EDIT_EVENT: 'badge-cyan',
  DELETE_EVENT: 'badge-red',
  JOIN_FAMILY: 'badge-lime',
  UPLOAD_PHOTO: 'badge-yellow',
};

const AdminActivityLog = () => {
  const familyId = useFamily();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });

  const [filters, setFilters] = useState({
    action: '',
    fromDate: '',
    toDate: '',
  });

  const fetchLogs = async (page = 1) => {
    if (!familyId) return;

    try {
      setLoading(true);
      const params = new URLSearchParams({
        page,
        limit: pagination.limit,
      });

      if (filters.action) params.append('action', filters.action);
      if (filters.fromDate) params.append('fromDate', filters.fromDate);
      if (filters.toDate) params.append('toDate', filters.toDate);

      const res = await apiClient.get(`/families/${familyId}/activity-logs?${params.toString()}`);
      setLogs(res.data.data);
      setPagination({
        ...pagination,
        page: res.data.page,
        total: res.data.total,
        totalPages: res.data.totalPages,
      });
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      toast.error('Không thể tải nhật ký hoạt động');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [familyId]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    fetchLogs(1);
  };

  const handlePageChange = (newPage) => {
    fetchLogs(newPage);
  };

  const resetFilters = () => {
    setFilters({ action: '', fromDate: '', toDate: '' });
    // setTimeout to allow state to update before fetching
    setTimeout(() => fetchLogs(1), 0);
  };

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
                  <td colSpan="4">
                    <div className="activity-loading">
                      <div className="spinner"></div>
                      Đang tải dữ liệu...
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="4">
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
