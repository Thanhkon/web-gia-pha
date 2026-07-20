import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);

  if (!isAuthenticated) {
    // Chưa đăng nhập thì đá về trang chủ (hoặc có thể trỏ về /login)
    return <Navigate to="/" replace />;
  }

  // Nếu đã đăng nhập, cho phép render các route con
  return <Outlet />;
};

export default ProtectedRoute;
