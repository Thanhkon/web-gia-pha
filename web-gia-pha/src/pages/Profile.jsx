import React, { useState, useRef, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { Pencil, Image } from "lucide-react";
import apiClient from "../utils/apiClient";
import { createPortal } from "react-dom";
import defaultAvatar from "../assets/avatar-female.svg";
import Modal from "../components/Modal";
import { getAvatarUrl } from "../utils/imageHelper";
import "../css/pages/Profile.css";

const ProfilePage = () => {
    const [showAvatarPreview, setShowAvatarPreview] = useState(false);
    const [avatarFile, setAvatarFile] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState("");

    const { profileId } = useParams();
    const { token } = useSelector((state) => state.auth);
    const [isEditing, setIsEditing] = useState(false);
    const fileInputRef = useRef(null);
    const isSelfProfile = !profileId || profileId === "me";

    const [formData, setFormData] = useState({
        fullName: "",
        phone: "",
        address: "",
        dateOfBirth: "",
        avatarUser: defaultAvatar,
    });

    // Lấy thông tin cá nhân user từ API
    const fetchProfileData = useCallback(async () => {
        try {
            const endpoint = isSelfProfile
                ? "/users/profile"
                : `/users/${profileId}`;
            const response = await apiClient.get(endpoint);
            const data = response.data;

            if (data) {
                const userData = data.user || data;

                setFormData({
                    fullName: userData.fullName || userData.username || "",
                    phone: userData.phone || "",
                    address: userData.address || "",
                    dateOfBirth: userData.dateOfBirth
                        ? String(userData.dateOfBirth).split("T")[0]
                        : "",
                    avatarUser:
                        userData.avatarUser ||
                        userData.avatarUrl ||
                        defaultAvatar,
                });
            }
        } catch (error) {
            console.error("Lỗi khi tải thông tin profile:", error);
        }
    }, [isSelfProfile, profileId]);

    // Tải dữ liệu người dùng và cập nhật tiêu đề trang khi token thay đổi
    useEffect(() => {
        document.title = "My Profile";
        if (token) {
            fetchProfileData();
        }
    }, [token, fetchProfileData]);

    // Bật/tắt thanh cuộn của trang khi mở hoặc đóng modal xem trước avatar
    useEffect(() => {
        if (showAvatarPreview) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [showAvatarPreview]);

    // Cập nhật giá trị tương ứng vào state formData
    const handleFieldChange = (field) => (event) => {
        setFormData((prev) => ({
            ...prev,
            [field]: event.target.value,
        }));
    };

    // Xử lý sự kiện chọn file ảnh mới và tạo URL xem trước cho avatar
    const handleAvatarChange = (e) => {
        e.preventDefault();
        const file = e.target.files && e.target.files[0];
        if (file) {
            setAvatarFile(file);
            const previewUrl = URL.createObjectURL(file);
            setFormData((prev) => ({
                ...prev,
                avatarUser: previewUrl,
            }));
            setShowAvatarPreview(false);
        }
    };

    // Tải file ảnh avatar lên server và trả về đường dẫn URL của ảnh
    const uploadAvatarFile = async (file) => {
        const formDataUpload = new FormData();
        formDataUpload.append("file", file);

        const response = await apiClient.post(
            "/users/upload-avatar",
            formDataUpload,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            },
        );
        return response.data.url;
    };

    // Lưu thông tin người dùng đã chỉnh sửa hoặc bật chế độ chỉnh sửa
    const handleSaveProfile = async () => {
        if (isEditing) {
            try {
                if (!token) return;

                let finalAvatarUser = formData.avatarUser;

                if (avatarFile) {
                    finalAvatarUser = await uploadAvatarFile(avatarFile);
                } else if (
                    finalAvatarUser &&
                    finalAvatarUser.startsWith("data:")
                ) {
                    finalAvatarUser = null;
                }

                const payload = {
                    fullName: formData.fullName?.trim() || null,
                    phone: formData.phone?.trim() || null,
                    address: formData.address?.trim() || null,
                    dateOfBirth: formData.dateOfBirth || null,
                    avatarUser: finalAvatarUser,
                };

                const endpoint = isSelfProfile
                    ? "/users/profile"
                    : `/users/${profileId}`;

                const response = await apiClient.put(endpoint, payload);

                if (response.status >= 200 && response.status < 300) {
                    await fetchProfileData();
                    setAvatarFile(null);
                    setIsEditing(false);

                    setModalMessage("Cập nhật thành công!");
                    setModalOpen(true);
                }
            } catch (error) {
                setIsEditing(false);
                setModalMessage("Lỗi khi cập nhật profile!");
                setModalOpen(true);
            }
        } else {
            setIsEditing(true);
        }
    };

    return (
        <div className="profile-page animate-fade-in">
            <div className="container profile-page-container">
                <div className="profile-card">
                    <div className="profile-header-row">
                        <div className="profile-header-left">
                            <div className="profile-avatar-wrap">
                                <button
                                    type="button"
                                    className="profile-avatar-button"
                                    onClick={() =>
                                        isEditing &&
                                        setShowAvatarPreview((prev) => !prev)
                                    }
                                    disabled={!isEditing}
                                >
                                    <img
                                        src={getAvatarUrl(formData.avatarUser)}
                                        alt="avatar"
                                        className="profile-avatar"
                                    />
                                </button>
                            </div>
                            <div>
                                <h1 className="profile-title">
                                    {isSelfProfile
                                        ? "Thông tin cá nhân"
                                        : "Thông tin người dùng"}
                                </h1>
                                <p className="profile-subtitle">
                                    {isSelfProfile
                                        ? "Trang cá nhân của bạn"
                                        : "Xem thông tin cơ bản"}
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            className="profile-edit-btn"
                            onClick={handleSaveProfile}
                        >
                            <Pencil size={16} />
                            {isEditing ? "SAVE" : "EDIT"}
                        </button>
                    </div>

                    {showAvatarPreview &&
                        createPortal(
                            <div
                                className="profile-avatar-modal-backdrop"
                                onClick={() => setShowAvatarPreview(false)}
                            >
                                <div
                                    className="profile-avatar-modal"
                                    onClick={(event) => event.stopPropagation()}
                                >
                                    <img
                                        src={getAvatarUrl(formData.avatarUser)}
                                        alt="Avatar preview"
                                        className="profile-avatar-modal-image"
                                    />
                                    <button
                                        type="button"
                                        className="profile-avatar-change-btn"
                                        onClick={() =>
                                            fileInputRef.current?.click()
                                        }
                                    >
                                        <Image size={18} />
                                        <span>Chọn ảnh đại diện</span>
                                    </button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleAvatarChange}
                                        accept="image/*"
                                        style={{ display: "none" }}
                                    />
                                </div>
                            </div>,
                            document.body,
                        )}

                    <div className="profile-grid-wrap">
                        {!isEditing && (
                            <div
                                className="profile-grid-overlay"
                                aria-hidden="true"
                            ></div>
                        )}
                        <div className="profile-grid">
                            <div className="profile-field">
                                <span className="profile-label">Họ và tên</span>
                                <input
                                    className="profile-input"
                                    type="text"
                                    value={formData.fullName}
                                    placeholder="Full name"
                                    onChange={handleFieldChange("fullName")}
                                    readOnly={!isEditing}
                                    tabIndex={!isEditing ? -1 : 0}
                                />
                            </div>

                            <div className="profile-field">
                                <span className="profile-label">Liên lạc</span>
                                <input
                                    className="profile-input"
                                    type="text"
                                    value={formData.phone}
                                    placeholder="Phone number"
                                    onChange={handleFieldChange("phone")}
                                    readOnly={!isEditing}
                                    tabIndex={!isEditing ? -1 : 0}
                                />
                            </div>

                            <div className="profile-field">
                                <span className="profile-label">Địa chỉ</span>
                                <input
                                    className="profile-input"
                                    type="text"
                                    value={formData.address}
                                    placeholder="Address"
                                    onChange={handleFieldChange("address")}
                                    readOnly={!isEditing}
                                    tabIndex={!isEditing ? -1 : 0}
                                />
                            </div>

                            <div className="profile-field">
                                <span className="profile-label">Ngày sinh</span>
                                <input
                                    className="profile-input"
                                    type="date"
                                    value={formData.dateOfBirth}
                                    onChange={handleFieldChange("dateOfBirth")}
                                    readOnly={!isEditing}
                                    tabIndex={!isEditing ? -1 : 0}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Modal
                isOpen={modalOpen}
                message={modalMessage}
                onClose={() => setModalOpen(false)}
            />
        </div>
    );
};

export default ProfilePage;
