import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import apiClient from '../../utils/apiClient';
import '../../css/pages/Auth.css';

const ForgotPassword = () => {
  useEffect(() => {
    document.title = "Quên Mật Khẩu";
  }, []);

  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username) {
      toast.error('Vui lòng nhập username');
      return;
    }

    try {
      setIsLoading(true);
      const res = await apiClient.post('/auth/forgot-password', { username });
      toast.success(res.data.message || 'Yêu cầu đặt lại mật khẩu đã được gửi!');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-box">
        <h2>Quên Mật Khẩu</h2>
        <p style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
          Nhập username của bạn để nhận liên kết đặt lại mật khẩu
        </p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="input-box">
            <label className="label-auth">Username</label>
            <input
              type="text"
              placeholder="Nhập username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <button type="submit" className="btn-auth" disabled={isLoading} style={{ marginTop: '1rem' }}>
            {isLoading ? 'Đang gửi...' : 'Gửi yêu cầu'}
          </button>
        </form>
        <p style={{ marginTop: '1rem', textAlign: 'center' }}>
          <span
            style={{ color: 'var(--primary-color)', cursor: 'pointer' }}
            onClick={() => navigate('/login')}
          >
            Quay lại Đăng nhập
          </span>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
