import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Bell, Save, Loader } from "lucide-react";
import apiClient from "../../utils/apiClient";
import Modal from "../../components/Modal";

const Notifications = () => {
    const user = useSelector((state) => state.auth.user);
    const [notifSettings, setNotifSettings] = useState({
        anniversaryEmail: true,
        treeUpdate: true,
    });
    const [isSaving, setIsSaving] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState("");

    useEffect(() => {
        if (user?.notificationSettings) {
            setNotifSettings((prev) => ({
                ...prev,
                ...user.notificationSettings
            }));
        }
    }, [user]);

    const handleNotifToggle = (key) => {
        setNotifSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSaveSettings = async () => {
        setIsSaving(true);
        try {
            await apiClient.put("/users/profile", {
                notificationSettings: notifSettings,
            });
            setModalMessage("Đã lưu cấu hình thông báo thành công!");
            setModalOpen(true);
            
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } catch (error) {
            setModalMessage(error.response?.data?.message || "Có lỗi xảy ra khi lưu thiết lập.");
            setModalOpen(true);
        } finally {
            setIsSaving(false);
        }
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

            <button 
                onClick={handleSaveSettings} 
                className="save-btn"
                disabled={isSaving}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
                {isSaving ? <Loader size={16} className="spin" /> : <Save size={16} />}
                Lưu cài đặt
            </button>

            <Modal 
                isOpen={modalOpen} 
                onClose={() => setModalOpen(false)} 
                title="Thông báo"
            >
                <p>{modalMessage}</p>
                <div className="modal-actions">
                    <button className="btn-primary" onClick={() => setModalOpen(false)}>
                        Đóng
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default Notifications;
