import apiClient from '../utils/apiClient';

export const getNotifications = async () => {
  const response = await apiClient.get('/notifications');
  return response.data;
};

export const getUnreadCount = async () => {
  const response = await apiClient.get('/notifications/unread-count');
  return response.data;
};

export const markAsRead = async (id) => {
  const response = await apiClient.patch(`/notifications/${id}/read`);
  return response.data;
};

export const markAllAsRead = async () => {
  const response = await apiClient.patch('/notifications/read-all');
  return response.data;
};
