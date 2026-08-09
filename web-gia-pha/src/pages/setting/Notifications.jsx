import { useState } from "react";
import { Bell, Save } from "lucide-react";

const Notifications = () => {
    const [notifSettings, setNotifSettings] = useState({
        anniversaryEmail: true,
        treeUpdate: true,
    });

    const handleNotifToggle = (key) => {
        setNotifSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSaveSettings = () => {
        alert("Đã lưu cấu hình thông báo!");
    };

    return (
        <div className="tab-pane">
            <div className="pane-title">
                <Bell size={20} />
                <h3>Cài Đặt Thông Báo</h3>
            </div>

            <div className="toggle-list">
                <div className="toggle-item">
                    <div className="toggle-info">
                        <strong>Nhắc lịch Giỗ / Lễ hội dòng họ</strong>
                        <p>
                            Nhận thông báo qua Email trước các ngày Giỗ quan
                            trọng
                        </p>
                    </div>
                    <label className="switch">
                        <input
                            type="checkbox"
                            checked={notifSettings.anniversaryEmail}
                            onChange={() =>
                                handleNotifToggle("anniversaryEmail")
                            }
                        />
                        <span className="slider"></span>
                    </label>
                </div>

                <div className="toggle-item">
                    <div className="toggle-info">
                        <strong>Cập nhật Cây Gia Phả</strong>
                        <p>
                            Thông báo khi có thành viên mới được thêm hoặc thông
                            tin thay đổi
                        </p>
                    </div>
                    <label className="switch">
                        <input
                            type="checkbox"
                            checked={notifSettings.treeUpdate}
                            onChange={() => handleNotifToggle("treeUpdate")}
                        />
                        <span className="slider"></span>
                    </label>
                </div>
            </div>

            <button onClick={handleSaveSettings} className="save-btn">
                <Save size={16} /> Lưu cài đặt
            </button>
        </div>
    );
};

export default Notifications;
