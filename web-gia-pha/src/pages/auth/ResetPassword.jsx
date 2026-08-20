import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import apiClient from '../../utils/apiClient';
import '../../css/pages/Auth.css';

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
      <div className="auth-page">
        <div className="auth-box">
          <h2>Lỗi</h2>
          <p style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
            Liên kết không hợp lệ hoặc đã hết hạn.
          </p>
          <button className="btn-auth" onClick={() => navigate('/login')}>
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
    <div className="auth-page">
      <div className="auth-box">
        <h2>Đặt Lại Mật Khẩu</h2>
        <p style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
          Nhập mật khẩu mới cho tài khoản của bạn
        </p>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-box">
            <label className="label-auth">Mật khẩu mới</label>
            <div className="password-wrapper">
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
                className="btn-showPass"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="input-box">
            <label className="label-auth">Xác nhận mật khẩu</label>
            <div className="password-wrapper">
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
                className="btn-showPass"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-auth" disabled={isLoading} style={{ marginTop: '1rem' }}>
            {isLoading ? 'Đang xử lý...' : 'Xác nhận'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
