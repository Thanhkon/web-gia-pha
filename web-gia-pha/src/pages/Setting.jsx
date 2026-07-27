import React, { useState } from 'react';
import { Shield, Key, Lock, Bell, Eye, EyeOff, Save, HelpCircle, Construction } from 'lucide-react';
import '../css/pages/Setting.css';

const Setting = () => {
  const [activeTab, setActiveTab] = useState('security');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass1, setShowNewPass1] = useState(false);
  const [showNewPass2, setShowNewPass2] = useState(false);
  
  // Form Đổi Mật Khẩu State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Settings State (Quyền riêng tư & Thông báo)
  const [privacySettings, setPrivacySettings] = useState({
    showBirthDate: true,
    showPhone: false,
    showAddress: false,
    publicProfile: true,
  });

  const [notifSettings, setNotifSettings] = useState({
    anniversaryEmail: true,
    treeUpdate: true,
    eventReminders: true,
  });

  const handlePasswordChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
  };

  const handlePrivacyToggle = (key) => {
    setPrivacySettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleNotifToggle = (key) => {
    setNotifSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Gọi API Đổi Mật Khẩu: PUT /auth/change-password
  const handleSubmitPassword = async (e) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('Mật khẩu mới và xác nhận mật khẩu không khớp!');
      return;
    }

    try {
      const response = await fetch('/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      if (response.ok) {
        alert('Cập nhật mật khẩu thành công!');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Đổi mật khẩu thất bại!');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      alert('Lỗi kết nối máy chủ!');
    }
  };

  const handleSaveSettings = () => {
    alert('Đã lưu cấu hình cài đặt!');
  };

  return (
    <div className="setting-page">
      <div className="setting-container">
        
        {/* Header */}
        <div className="setting-header">
          <h2>Cài Đặt Tài Khoản</h2>
        </div>

        <div className="setting-content">
          
          {/* Sidebar Tabs */}
          <div className="setting-sidebar">
            
            {/* Quên mật khẩu */}
            <button
              className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <Key size={18} />
              <span>Đổi Mật Khẩu</span>
            </button>

            {/* Quên mật khẩu */}
            <button
              className={`tab-btn ${activeTab === 'forgot' ? 'active' : ''}`}
              onClick={() => setActiveTab('forgot')}
            >
              <HelpCircle size={18} />
              <span>Quên Mật Khẩu</span>
            </button>

            {/* Quyền riêng tư */}
            <button
              className={`tab-btn ${activeTab === 'privacy' ? 'active' : ''}`}
              onClick={() => setActiveTab('privacy')}
            >
              <Eye size={18} />
              <span>Quyền Riêng Tư</span>
            </button>

            {/* Thông báo */}
            <button
              className={`tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('notifications')}
            >
              <Bell size={18} />
              <span>Thông Báo</span>
            </button>
          </div>

          {/* Main Panel */}
          <div className="setting-panel">
            
            {/* ĐỔI MẬT KHẨU */}
            {activeTab === 'security' && (
              <div className="tab-pane">
                <div className="pane-title">
                  <Lock size={20} />
                  <h3>Đổi Mật Khẩu</h3>
                </div>

                <form onSubmit={handleSubmitPassword} className="setting-form">
                  {/* Old Pass */}
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

                  {/* New Pass */}
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

                  {/* Check New Pass */}
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
              </div>
            )}

            {/* TAB 2: QUÊN MẬT KHẨU (Gán cho tính năng đang xây dựng) */}
            {activeTab === 'forgot' && (
              <div className="tab-pane under-construction-pane">
                <Construction size={60} className="construction-icon" />
                <h3>Tính năng đang được xây dựng</h3>
                <p>Chúng tôi đang nỗ lực hoàn thiện chức năng này. Vui lòng quay lại sau!</p>
              </div>
            )}

            {/* TAB 3: QUYỀN RIÊNG TƯ */}
            {activeTab === 'privacy' && (
              <div className="tab-pane">
                <div className="pane-title">
                  <Shield size={20} />
                  <h3>Quyền Riêng Tư Gia Tộc</h3>
                </div>

                <div className="toggle-list">
                  <div className="toggle-item">
                    <div className="toggle-info">
                      <strong>Hiển thị Ngày sinh</strong>
                      <p>Cho phép các thành viên khác xem ngày sinh trên cây gia phả</p>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={privacySettings.showBirthDate}
                        onChange={() => handlePrivacyToggle('showBirthDate')}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>

                  <div className="toggle-item">
                    <div className="toggle-info">
                      <strong>Hiển thị Số điện thoại</strong>
                      <p>Ẩn/Hiện số điện thoại trên thông tin thành viên gia phả</p>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={privacySettings.showPhone}
                        onChange={() => handlePrivacyToggle('showPhone')}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>

                  <div className="toggle-item">
                    <div className="toggle-info">
                      <strong>Hiển thị Địa chỉ</strong>
                      <p>Hiện thông tin nơi ở trên sơ đồ dòng họ</p>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={privacySettings.showAddress}
                        onChange={() => handlePrivacyToggle('showAddress')}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                </div>

                <button onClick={handleSaveSettings} className="save-btn">
                  <Save size={16} /> Lưu thiết lập
                </button>
              </div>
            )}

            {/* TAB 4: THÔNG BÁO */}
            {activeTab === 'notifications' && (
              <div className="tab-pane">
                <div className="pane-title">
                  <Bell size={20} />
                  <h3>Cài Đặt Thông Báo</h3>
                </div>

                <div className="toggle-list">
                  <div className="toggle-item">
                    <div className="toggle-info">
                      <strong>Nhắc lịch Giỗ / Lễ hội dòng họ</strong>
                      <p>Nhận thông báo qua Email trước các ngày Giỗ quan trọng</p>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={notifSettings.anniversaryEmail}
                        onChange={() => handleNotifToggle('anniversaryEmail')}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>

                  <div className="toggle-item">
                    <div className="toggle-info">
                      <strong>Cập nhật Cây Gia Phả</strong>
                      <p>Thông báo khi có thành viên mới được thêm hoặc thông tin thay đổi</p>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={notifSettings.treeUpdate}
                        onChange={() => handleNotifToggle('treeUpdate')}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                </div>

                <button onClick={handleSaveSettings} className="save-btn">
                  <Save size={16} /> Lưu cài đặt
                </button>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};

export default Setting;