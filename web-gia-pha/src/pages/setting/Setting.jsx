import { NavLink, Outlet } from 'react-router-dom';
import { Key, HelpCircle, Eye, Bell } from 'lucide-react';
import '../../css/pages/Setting.css';

const Setting = () => {
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
            <NavLink to="security" className="tab-btn">
              <Key size={18} />
              <span>Đổi Mật Khẩu</span>
            </NavLink>

            <NavLink to="forgot" className="tab-btn">
              <HelpCircle size={18} />
              <span>Quên Mật Khẩu</span>
            </NavLink>

            <NavLink to="privacy" className="tab-btn">
              <Eye size={18} />
              <span>Quyền Riêng Tư</span>
            </NavLink>

            <NavLink to="notifications" className="tab-btn">
              <Bell size={18} />
              <span>Thông Báo</span>
            </NavLink>
          </div>

          {/* Main Panel */}
          <div className="setting-panel">
            <Outlet />
          </div>

        </div>
      </div>
    </div>
  );
};

export default Setting;