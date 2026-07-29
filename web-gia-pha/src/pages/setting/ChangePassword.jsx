import { useState } from 'react';
import { Lock, Eye, EyeOff, Save } from 'lucide-react';
import { changePasswordApi } from '../../../api/passwordApi';
import Modal from '../../components/Modal';

const ChangePassword = () => {
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass1, setShowNewPass1] = useState(false);
  const [showNewPass2, setShowNewPass2] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handlePasswordChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
  };

  const handleSubmitPassword = async (e) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('Mật khẩu mới và xác nhận mật khẩu không khớp!');
      return;
    }

    try {
      const response = await changePasswordApi({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      setModalMessage('Cập nhật mật khẩu thành công!' || response.message);
      setModalOpen(true);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      alert(error.message || 'Đổi mật khẩu thất bại!');
    }
  };

  return (
    <div className="tab-pane">
      <div className="pane-title">
        <Lock size={20} />
        <h3>Đổi Mật Khẩu</h3>
      </div>

      <form onSubmit={handleSubmitPassword} className="setting-form">
        <div className="form-group">
          <label>Mật khẩu hiện tại</label>
          <div className="input-wrapper">
            <input
              type={showOldPass ? "text" : "password"}
              name="currentPassword"
              placeholder="Nhập mật khẩu hiện tại"
              value={passwordForm.currentPassword}
              onChange={handlePasswordChange}
              required
            />
            <button
              onClick={() => setShowOldPass(!showOldPass)}
              className='btn-showPass'
              type='button'
              tabIndex={-1}
            >
              {showOldPass ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label>Mật khẩu mới</label>
          <div className="input-wrapper">
            <input
              type={showNewPass1 ? "text" : "password"}
              name="newPassword"
              placeholder="Nhập mật khẩu mới"
              value={passwordForm.newPassword}
              onChange={handlePasswordChange}
              required
            />
            <button
              onClick={() => setShowNewPass1(!showNewPass1)}
              className='btn-showPass'
              type='button'
              tabIndex={-1}
            >
              {showNewPass1 ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label>Xác nhận mật khẩu mới</label>
          <div className="input-wrapper">
            <input
              type={showNewPass2 ? "text" : "password"}
              name="confirmPassword"
              placeholder="Nhập lại mật khẩu mới"
              value={passwordForm.confirmPassword}
              onChange={handlePasswordChange}
              required
            />
            <button
              onClick={() => setShowNewPass2(!showNewPass2)}
              className='btn-showPass'
              type='button'
              tabIndex={-1}
            >
              {showNewPass2 ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <button type="submit" className="save-btn">
          <Save size={16} /> Cập nhật mật khẩu
        </button>
      </form>

      <Modal
        isOpen={modalOpen}
        message={modalMessage}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
};

export default ChangePassword;