import React, { useState } from "react";
import { X, Plus, AlertCircle } from "lucide-react";
import { useDispatch } from "react-redux";
import { createFamily } from "../../store/slices/familiesSlice";
import apiClient from "../../utils/apiClient"; // Import apiClient để gọi API upload ảnh
import "../../css/components/ConfirmModal.css";

const CreateFamilyModal = ({ isOpen, onClose, onSuccess }) => {
    const dispatch = useDispatch();
    const [formData, setFormData] = useState({
        name: "",
        originPlace: "",
        description: "",
        file: null,
        previewUrl: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFormData((prev) => ({
                ...prev,
                file: selectedFile,
                previewUrl: URL.createObjectURL(selectedFile),
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!formData.name.trim()) {
            setError("Vui lòng nhập tên gia phả");
            return;
        }

        setLoading(true);

        try {
            // 1. Tạo JSON Payload gửi lên API
            const payload = {
                name: formData.name.trim(),
                originPlace: formData.originPlace?.trim() || null,
                description: formData.description?.trim() || null,
            };

            // 2. Gọi Redux Thunk tạo Family
            const createdFamily = await dispatch(
                createFamily(payload),
            ).unwrap();

            // 3. Nếu có file ảnh, gọi API upload cover image riêng
            if (formData.file && createdFamily?.id) {
                const imageData = new FormData();
                imageData.append("image", formData.file);

                await apiClient.post(
                    `/families/${createdFamily.id}/cover-image`,
                    imageData,
                    {
                        headers: { "Content-Type": "multipart/form-data" },
                    },
                );
            }

            onSuccess?.();
            onClose();
            setFormData({
                name: "",
                originPlace: "",
                description: "",
                file: null,
                previewUrl: "",
            });
        } catch (err) {
            const errorMessage =
                typeof err === "object" && err !== null
                    ? Array.isArray(err.message)
                        ? err.message.join(", ")
                        : err.message || JSON.stringify(err)
                    : String(err);

            setError(errorMessage || "Đã xảy ra lỗi khi tạo gia phả");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-container">
                <div className="modal-header">
                    <h2>Tạo gia phả mới</h2>
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
                        {error && (
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                    color: "#e53e3e",
                                    backgroundColor: "#fed7d7",
                                    padding: "0.75rem",
                                    borderRadius: "var(--radius-md)",
                                }}
                            >
                                <AlertCircle size={18} />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="form-group">
                            <label>
                                Tên gia phả{" "}
                                <span className="text-primary">*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Ví dụ: Gia phả họ Nguyễn"
                                className="form-control"
                            />
                        </div>

                        <div className="form-group">
                            <label>Nguyên quán / Quê gốc</label>
                            <input
                                type="text"
                                name="originPlace"
                                value={formData.originPlace}
                                onChange={handleChange}
                                placeholder="Ví dụ: Hưng Yên"
                                className="form-control"
                            />
                        </div>

                        <div className="form-group">
                            <label>Ảnh đại diện (Tải lên)</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="form-control"
                                style={{ padding: "6px" }}
                            />
                            {formData.previewUrl && (
                                <div
                                    style={{
                                        marginTop: "10px",
                                        borderRadius: "6px",
                                        overflow: "hidden",
                                        height: "120px",
                                    }}
                                >
                                    <img
                                        src={formData.previewUrl}
                                        alt="Preview"
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <label>Mô tả ngắn</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Mô tả về dòng họ..."
                                className="form-control"
                                rows={3}
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-outline"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            {loading ? (
                                "Đang tạo..."
                            ) : (
                                <>
                                    <Plus size={18} /> Tạo mới
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateFamilyModal;
