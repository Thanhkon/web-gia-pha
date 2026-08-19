import { useState, useEffect, useCallback, useRef } from 'react';
import * as notificationService from '../services/notificationService';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { useSelector } from 'react-redux';

export const useNotifications = (isAuthenticated) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const token = useSelector((state) => state.auth.token);
  const abortControllerRef = useRef(null);

  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await notificationService.getUnreadCount();
      setUnreadCount(data.count);
    } catch (error) {
      console.error('Failed to fetch unread count', error);
    }
  }, [isAuthenticated]);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const data = await notificationService.getNotifications();
      setNotifications(data);
      // Cập nhật lại số lượng chưa đọc dựa trên danh sách mới
      setUnreadCount(data.filter((n) => !n.isRead).length);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const markAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read', error);
    }
  };

  // Thay thế Polling bằng Server-Sent Events (SSE)
  useEffect(() => {
    if (!isAuthenticated || !token) return;

    fetchUnreadCount();
    
    abortControllerRef.current = new AbortController();
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

    const connectSSE = async () => {
      try {
        await fetchEventSource(`${apiUrl}/notifications/stream`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: abortControllerRef.current.signal,
          onmessage(ev) {
            if (ev.data) {
              const newNotification = JSON.parse(ev.data);
              
              setNotifications(prev => {
                // Kiểm tra trùng lặp
                if (prev.find(n => n.id === newNotification.id)) return prev;
                return [newNotification, ...prev];
              });
              setUnreadCount(prev => prev + 1);
            }
          },
          onclose() {
            // Có thể thêm logic reconnect tùy chỉnh nếu muốn, 
            // thư viện này tự động reconnect mặc định
          },
          onerror(err) {
            console.error('SSE Error:', err);
            // Throw err để thư viện tự động reconnect
            throw err;
          }
        });
      } catch (err) {
        console.error('SSE connection failed:', err);
      }
    };

    connectSSE();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [isAuthenticated, fetchUnreadCount, token]);

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
};
