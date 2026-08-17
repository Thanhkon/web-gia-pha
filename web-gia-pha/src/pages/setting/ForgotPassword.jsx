import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import { Send } from 'lucide-react';
import apiClient from '../../utils/apiClient';

const ForgotPassword = () => {
  const currentUser = useSelector((state) => state.auth.user);
  const [username, setUsername] = useState(currentUser?.username || '');
  const [isLoading, setIsLoading] = useState(false);

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
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="tab-pane">
      <div className="tab-header">
        <h3>Quên Mật Khẩu</h3>
        <p>Nhận liên kết đặt lại mật khẩu qua email</p>
      </div>
      <div className="tab-content">
        <form onSubmit={handleSubmit} className="setting-form">
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nhập username của bạn"
              disabled={isLoading}
              required
              className="form-input"
            />
          </div>
          <button type="submit" className="save-btn" disabled={isLoading}>
            <Send size={18} />
            {isLoading ? 'Đang gửi...' : 'Gửi Yêu Cầu'}
          </button>
        </form>
      </div>
    </div>
  );
};
 
export default ForgotPassword;