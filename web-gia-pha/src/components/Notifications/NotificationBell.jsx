import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotifications';
import '../../css/components/Notifications.css';

const NotificationBell = ({ isAuthenticated, activeFamilyId }) => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    fetchNotifications,
  } = useNotifications(isAuthenticated);

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchNotifications();
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    setIsOpen(false);

    // Xử lý chuyển trang dựa trên type
    switch (notification.type) {
      case 'NEW_POST':
        // Cần activeFamilyId để chuyển đúng, tạm thời chuyển về trang chọn gia phả nếu không có context
        navigate(activeFamilyId ? `/${activeFamilyId}/posts/${notification.referenceId}` : '/admin/families');
        break;
      case 'JOIN_APPROVED':
      case 'JOIN_REJECTED':
        // Người dùng xem danh sách gia phả của mình
        navigate(`/admin/families`);
        break;
      case 'REQUEST_APPROVED':
      case 'REQUEST_REJECTED':
        // Nếu có activeFamilyId thì vào edit-requests của family đó
        navigate(activeFamilyId ? `/${activeFamilyId}/edit-requests` : `/admin/families`);
        break;
      case 'NEW_EDIT_REQUEST':
        // Dành cho Admin: Quản lý yêu cầu chỉnh sửa
        navigate(activeFamilyId ? `/admin/families/${activeFamilyId}/requests` : `/admin/families`);
        break;
      case 'NEW_EVENT':
        navigate(activeFamilyId ? `/${activeFamilyId}/events` : `/admin/families`);
        break;
      default:
        break;
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="notification-container" ref={dropdownRef}>
      <button className="notification-bell-btn" onClick={handleToggle}>
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Thông báo</h3>
            {unreadCount > 0 && (
              <button className="mark-all-read-btn" onClick={markAllAsRead}>
                <Check size={16} className="icon-mr-4" /> Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="notification-empty">
                <p>Bạn không có thông báo nào mới.</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-icon">
                    {notification.isRead ? (
                      <CheckCircle2 size={24} className="text-secondary" />
                    ) : (
                      <div className="unread-dot"></div>
                    )}
                  </div>
                  <div className="notification-content">
                    <h4>{notification.title}</h4>
                    <p>{notification.content}</p>
                    <span className="notification-time">
                      {new Date(notification.createdAt).toLocaleString('vi-VN')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
