import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Star, Save, Loader } from "lucide-react";
import apiClient from "../../utils/apiClient";
import Modal from "../../components/Modal";
import { fetchFamilies } from "../../store/slices/familiesSlice";
import "../../css/pages/Setting.css";

const PreferredFamily = () => {
    const dispatch = useDispatch();
    const user = useSelector((state) => state.auth.user);
    const { list: userFamilies, loading } = useSelector((state) => state.families);

    const [selectedFamilyId, setSelectedFamilyId] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState("");

    useEffect(() => {
        dispatch(fetchFamilies());
    }, [dispatch]);

    useEffect(() => {
        if (user?.preferredFamilyId) {
            setSelectedFamilyId(String(user.preferredFamilyId));
        }
    }, [user]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await apiClient.put("/users/profile", {
                preferredFamilyId: selectedFamilyId ? Number(selectedFamilyId) : null,
            });
            
            setModalMessage("Đã cập nhật gia phả ưu tiên thành công!");
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
                <Star size={20} />
                <h3>Gia Phả Ưu Tiên</h3>
            </div>
            
            <p className="mb-4" style={{ color: '#666' }}>
                Gia phả ưu tiên là gia phả sẽ được tự động mở lên khi bạn vừa đăng nhập hoặc truy cập vào website, giúp bạn tiết kiệm thời gian nếu bạn tham gia nhiều gia phả cùng lúc.
            </p>

            {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Loader size={16} className="spin" /> Đang tải danh sách...
                </div>
            ) : (
                <div className="form-group" style={{ maxWidth: '400px' }}>
                    <label>Chọn Gia phả mặc định</label>
                    <select 
                        className="form-control" 
                        value={selectedFamilyId}
                        onChange={(e) => setSelectedFamilyId(e.target.value)}
                    >
                        <option value="">-- Không chọn (Mở danh sách gia phả) --</option>
                        {userFamilies?.map((family) => (
                            <option key={family.id} value={family.id}>
                                {family.name}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            <button 
                className="btn-primary mt-4" 
                onClick={handleSave} 
                disabled={isSaving || loading}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
                {isSaving ? <Loader size={18} className="spin" /> : <Save size={18} />}
                Lưu Thay Đổi
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

export default PreferredFamily;
