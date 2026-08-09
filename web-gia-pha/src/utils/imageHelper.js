// src/utils/imageHelper.js
import defaultAvatar from '../assets/avatar-female.svg'; 

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "");

export const getAvatarUrl = (url) => {
  if (!url || url === defaultAvatar) return defaultAvatar;
  if (
    url.startsWith("http") ||
    url.startsWith("blob:") ||
    url.startsWith("data:")
  ) {
    return url;
  }
  const cleanPath = url.startsWith("/") ? url : `/${url}`;
  return `${API_URL}${cleanPath}`;
};