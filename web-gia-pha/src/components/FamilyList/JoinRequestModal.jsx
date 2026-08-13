import React, { useState, useEffect } from "react";
import { Loader2, X } from "lucide-react";
import apiClient from "../../utils/apiClient";
import SearchableSelect from "../common/SearchableSelect";
import toast from "react-hot-toast";
import "../../css/components/ConfirmModal.css";

const JoinRequestModal = ({ isOpen, onClose, familyId, familyName }) => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(false);
    
    const [selectedMember, setSelectedMember] = useState("");
    const [note, setNote] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen && familyId) {
            fetchMembers();
            // Reset form
            setSelectedMember("");
            setNote("");
        }
    }, [isOpen, familyId]);

    const fetchMembers = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get(`/families/${familyId}/members`);
            setMembers(res.data?.members || []);
        } catch (error) {
            console.error("Lỗi khi tải danh sách thành viên:", error);
            toast.error("Không thể tải danh sách thành viên");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!selectedMember) {
            toast.error("Vui lòng chọn danh tính của bạn trên cây gia phả");
            return;
        }

        setSubmitting(true);
        try {
            await apiClient.post("/join-requests", {
                familyId,
                targetMemberId: Number(selectedMember),
                note
            });
            toast.success("Đã gửi yêu cầu tham gia thành công. Vui lòng chờ Quản trị viên duyệt.");
            onClose();
        } catch (error) {
            console.error("Lỗi khi gửi yêu cầu:", error);
            toast.error(
                error.response?.data?.message || "Có lỗi xảy ra khi gửi yêu cầu"
            );
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const memberOptions = members.map(m => ({
        value: m.id,
        label: `${m.fullName} ${m.dateOfBirth ? `(SN: ${new Date(m.dateOfBirth).getFullYear()})` : ''}`,
        group: `Đời thứ ${m.generation || '?'}`
    }));

    return (
        <div className="modal-overlay">
            <div className="modal-container">
                <div className="modal-header">
                    <h2>Xin gia nhập gia phả: {familyName}</h2>
                    <button
                        className="btn btn-outline"
                        style={{ border: "none", padding: "0.25rem" }}
                        onClick={onClose}
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form-wrapper">
                    <div className="modal-body">
                        {loading ? (
                            <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
                                <Loader2 size={32} className="animate-spin text-gray-500" />
                            </div>
                        ) : (
                            <>
                                <div className="form-group">
                                    <label>
                                        Bạn là ai trong gia phả này?{" "}
                                        <span className="text-primary">*</span>
                                    </label>
                                    <SearchableSelect
                                        options={memberOptions}
                                        value={selectedMember}
                                        onChange={setSelectedMember}
                                        placeholder="Tìm kiếm theo tên..."
                                    />
                                    <p style={{ fontSize: "0.875rem", color: "#6b7280", marginTop: "0.5rem" }}>
                                        Quản trị viên sẽ kiểm tra và xác nhận danh tính của bạn.
                                    </p>
                                </div>

                                <div className="form-group" style={{ marginTop: "1rem" }}>
                                    <label>Lời nhắn cho Quản trị viên (Tùy chọn)</label>
                                    <textarea
                                        className="form-control"
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                        placeholder="Ví dụ: Cháu là con của ông Nguyễn Văn A..."
                                        rows={3}
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-outline"
                            onClick={onClose}
                            disabled={submitting}
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={submitting || !selectedMember}
                        >
                            {submitting ? (
                                "Đang gửi..."
                            ) : (
                                "Gửi yêu cầu"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default JoinRequestModal;
