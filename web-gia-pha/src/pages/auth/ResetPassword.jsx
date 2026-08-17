import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff, Lock } from 'lucide-react';
import apiClient from '../../utils/apiClient';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get('token');
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!resetToken) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Lỗi</h1>
            <p>Liên kết không hợp lệ hoặc đã hết hạn.</p>
          </div>
          <button className="auth-button" onClick={() => navigate('/login')}>
            Quay lại Đăng nhập
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      toast.error('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    try {
      setIsLoading(true);
      await apiClient.post('/auth/reset-password', { resetToken, newPassword });
      toast.success('Đặt lại mật khẩu thành công!');
      navigate('/login', { replace: true });
    } catch (error) {
      const message = error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Đặt lại mật khẩu</h1>
          <p>Nhập mật khẩu mới cho tài khoản của bạn</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <div className="input-with-icon">
              <Lock className="input-icon" size={20} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Mật khẩu mới"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={isLoading}
              />
              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <div className="input-with-icon">
              <Lock className="input-icon" size={20} />
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Xác nhận mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
              />
              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button type="submit" className="auth-button" disabled={isLoading}>
            {isLoading ? 'Đang xử lý...' : 'Xác nhận'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
