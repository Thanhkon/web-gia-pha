import { useState } from 'react';
import { Shield, Save } from 'lucide-react';

const Privacy = () => {
  const [privacySettings, setPrivacySettings] = useState({
    showBirthDate: true,
    showPhone: false,
    showAddress: false,
  });

  const handlePrivacyToggle = (key) => {
    setPrivacySettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveSettings = () => {
    alert('Đã lưu cấu hình quyền riêng tư!');
  };

  return (
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
  );
};

export default Privacy;