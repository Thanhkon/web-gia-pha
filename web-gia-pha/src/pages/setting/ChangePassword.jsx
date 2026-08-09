import { useState } from "react";
import { useSelector } from "react-redux";
import apiClient from "../../utils/apiClient";
import { Lock, Eye, EyeOff, Save } from "lucide-react";
import Modal from "../../components/Modal";

const ChangePassword = () => {
    const [showAllPass, setShowAllPass] = useState(false);
    const [showOldPass, setShowOldPass] = useState(false);
    const [showNewPass1, setShowNewPass1] = useState(false);
    const [showNewPass2, setShowNewPass2] = useState(false);
    const [error, setError] = useState("");

    const [modalOpen, setModalOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState(" ");

    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const authUser = useSelector((state) => state.auth.user);

    // Cập nhật state khi nhập dữ liệu vào form
    const handlePasswordChange = (e) => {
        setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
    };

    // Bật/tắt hiển thị mật khẩu cho tất cả các ô input cùng lúc
    const handleToggleShowAll = () => {
        const nextState = !showAllPass;
        setShowAllPass(nextState);
        setShowOldPass(nextState);
        setShowNewPass1(nextState);
        setShowNewPass2(nextState);
    };

    // Gửi yêu cầu đổi mật khẩu tới backend
    const handleSubmitPassword = async (e) => {
        e.preventDefault();

        if (!passwordForm.currentPassword) {
            setError("Mật khẩu hiện tại không được để trống!");
            return;
        }
        if (!passwordForm.newPassword) {
            setError("Mật khẩu mới không được để trống!");
            return;
        }
        if (!passwordForm.confirmPassword) {
            setError("Xác nhận mật khẩu không được để trống!");
            return;
        }
        if (passwordForm.newPassword.length < 6) {
            setError("Mật khẩu không được ít hơn 6 kí tự!");
            return;
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setError("Mật khẩu không khớp!");
            return;
        }

        try {
            const usernameToSend = authUser?.username ?? null;

            if (!usernameToSend) {
                setError("Không tìm thấy người dùng. Vui lòng đăng nhập lại.");
                return;
            }

            const response = await apiClient.post("/auth/change-password", {
                username: usernameToSend,
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
            });

            setModalMessage(
                response.data?.message || "Cập nhật mật khẩu thành công!",
            );
            setError("");
            setModalOpen(true);
            setPasswordForm({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            });
        } catch (err) {
            const msg =
                err?.response?.data?.message ||
                err.message ||
                "Đổi mật khẩu thất bại!";
            setError(msg);
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
                    {/* Error Message */}
                    {error && <p className="password-error">{error}</p>}

                    <label>Mật khẩu hiện tại</label>
                    <div className="input-wrapper">
                        <input
                            type={showOldPass ? "text" : "password"}
                            name="currentPassword"
                            placeholder="Nhập mật khẩu hiện tại"
                            value={passwordForm.currentPassword}
                            onChange={handlePasswordChange}
                        />
                        <button
                            onClick={() => setShowOldPass(!showOldPass)}
                            className="btn-showPass"
                            type="button"
                            tabIndex={-1}
                        >
                            {showOldPass ? (
                                <EyeOff size={20} />
                            ) : (
                                <Eye size={20} />
                            )}
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
                        />
                        <button
                            onClick={() => setShowNewPass1(!showNewPass1)}
                            className="btn-showPass"
                            type="button"
                            tabIndex={-1}
                        >
                            {showNewPass1 ? (
                                <EyeOff size={20} />
                            ) : (
                                <Eye size={20} />
                            )}
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
                        />
                        <button
                            onClick={() => setShowNewPass2(!showNewPass2)}
                            className="btn-showPass"
                            type="button"
                            tabIndex={-1}
                        >
                            {showNewPass2 ? (
                                <EyeOff size={20} />
                            ) : (
                                <Eye size={20} />
                            )}
                        </button>
                    </div>
                </div>

                <button
                    type="button"
                    className="showAll"
                    onClick={handleToggleShowAll}
                >
                    {showAllPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    <span>{showAllPass ? "Ẩn tất cả" : "Hiện tất cả"}</span>
                </button>

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
