import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { Pencil, Image } from 'lucide-react';
import defaultAvatar from '../assets/avatar-female.svg';
import '../css/pages/Profile.css';


// Các ô nhập liệu
const ProfileField = ({
  label,
  value,
  editable,
  onChange,
  type = 'text',
  fullWidth = false,
  options = [],
  maxLength,
}) => {
  const fieldClassName = `profile-field ${fullWidth ? 'full-width' : ''}`;
  const isReadOnly = !editable;

  // Ô chọn dạng Dropdown
  if (type === 'select') {
    return (
      <div className={fieldClassName}>
        <span className="profile-label">{label}</span>
        <select
          className="profile-input"
          value={value}
          onChange={onChange}
          disabled={isReadOnly}
          tabIndex={isReadOnly ? -1 : 0}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  // Ô nhập văn bản description/note
  if (type === 'textarea') {
    return (
      <div className={fieldClassName}>
        <span className="profile-label">{label}</span>
        <div className="profile-textarea-wrap">
          <textarea
            className="profile-input profile-textarea"
            value={value}
            onChange={onChange}
            onInput={(event) => {
              event.target.style.height = 'auto';
              event.target.style.height = `${event.target.scrollHeight}px`;
            }}
            readOnly={isReadOnly}
            tabIndex={isReadOnly ? -1 : 0}
            rows={4}
            maxLength={maxLength}
          />
          <div className="profile-char-counter">{value.length}/{maxLength}</div>
        </div>
      </div>
    );
  }

  // Ô nhập văn bản/ngày/số cơ bản (Text, Date, Tel, Email)
  return (
    <div className={fieldClassName}>
      <span className="profile-label">{label}</span>
      <input
        className="profile-input"
        type={type}
        value={value}
        onChange={onChange}
        readOnly={isReadOnly}
        tabIndex={isReadOnly ? -1 : 0}
      />
    </div>
  );
};

// MAIN COMPONENT
const ProfilePage = () => {
  const [showAvatarPreview, setShowAvatarPreview] = useState(false);

  useEffect(() => {
    document.title = "My Profile";
    
    if (showAvatarPreview) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showAvatarPreview]);
  
  const dispatch = useDispatch();
  const { profileId } = useParams();
  const { user } = useSelector((state) => state.auth);
  
  // Trạng thái cho phép chỉnh sửa & hiển thị 
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef(null);
  
  // State lưu trữ dữ liệu form
  const [formData, setFormData] = useState(() => ({
    firstName: user?.firstName || 'An',
    lastName: user?.lastName || 'Nguyễn Văn',
    otherName: user?.otherName || 'An đẹp zai',
    gender: user?.gender || 'male',
    birthday: user?.birthday || '1990-01-01',
    address: user?.address || 'Hà Nội',
    education: user?.education || 'Đại học',
    occupation: user?.occupation || 'Kỹ sư phần mềm',
    email: user?.email || 'example@email.com',
    phone: user?.phone || '0900000000',
    note: user?.note || 'An đẹp zai, nhà mặt phố, bố làm to!',
    avatar: user?.avatar || defaultAvatar,
  }));

  const isSelfProfile = profileId === 'me';

  // Cập nhật giá trị các trường trong formData khi gõ input
  const handleFieldChange = (field) => (event) => {
    setFormData((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  // Hàm xử lý chọn ảnh đại diện
  const handleAvatarChange = (e) => {
    e.preventDefault();
    const file = e.target.files && e.target.files[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setFormData((prev) => ({
        ...prev,
        avatar: previewUrl,
      }));
      setShowAvatarPreview(false);
    }
  }

  // Xử lý khi nhấn nút EDIT / SAVE (Gọi API lưu profile)
  const handleSaveProfile = async () => {
    if (isEditing) {
      try {
        if(!user?.token) return;

        // Gửi dữ liệu cập nhật tới API Backend
        const apiBaseUrl = import.meta.env.VITE_API_URL;
        const response = await fetch(`${apiBaseUrl}/users/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(user?.token && { 'Authorization': `Bearer ${user.token}` }),
          },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          const updatedUser = await response.json();
          setIsEditing(false);
        } else {
          console.warn("Cập nhật dữ liệu tạm thời trên giao diện.");
          setIsEditing(false);
        }
      } catch (error) {
        console.error("Lỗi khi cập nhật profile:", error);
        setIsEditing(false);
      }
    } else {
      setIsEditing(true); // Chuyển sang chế độ chỉnh sửa
    }
  };

  return (
    <div className="profile-page animate-fade-in">
      <div className="container profile-page-container">
        <div className="profile-card">
          
          {/* Avatar, Tiêu đề & Nút Edit/Save */}
          <div className="profile-header-row">
            <div className="profile-header-left">
              <div className="profile-avatar-wrap">
                <button
                  type="button"
                  className="profile-avatar-button"
                  onClick={() => isEditing && setShowAvatarPreview((prev) => !prev)}
                  disabled={!isEditing}
                >
                  <img src={formData.avatar} alt="avatar" className="profile-avatar" />
                </button>
              </div>
              <div>
                <h1 className="profile-title">
                  {isSelfProfile ? 'Thông tin cá nhân' : 'Thông tin thành viên'}
                </h1>
                <p className="profile-subtitle">
                  {isSelfProfile ? 'Trang cá nhân của bạn' : 'Xem thông tin cơ bản'}
                </p>
              </div>
            </div>

            <button
              type="button"
              className="profile-edit-btn"
              onClick={handleSaveProfile}
            >
              <Pencil size={16} />
              {isEditing ? 'SAVE' : 'EDIT'}
            </button>
          </div>

          {/* Zoom ảnh đại diện */}
          {showAvatarPreview && (
            <div className="profile-avatar-modal-backdrop" onClick={() => setShowAvatarPreview(false)}>
              <div className="profile-avatar-modal" onClick={(event) => event.stopPropagation()}>
                <img src={formData.avatar} alt="Avatar preview" className="profile-avatar-modal-image" />
                
                {/* Nút chọn ảnh */}
                <button 
                  type="button" 
                  className="profile-avatar-change-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Image size={18} />
                  <span>Chọn ảnh đại diện</span>
                </button>

                {/* Input file */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
              </div>
            </div>
          )}

          {/* Các ô nhập liệu */}
          <div className="profile-grid-wrap">
            {!isEditing && <div className="profile-grid-overlay" aria-hidden="true"></div>}
            <div className="profile-grid">
              <ProfileField
                label="lastName"
                value={formData.lastName}
                editable={isEditing}
                onChange={handleFieldChange('lastName')}
              />
              <ProfileField
                label="firstName"
                value={formData.firstName}
                editable={isEditing}
                onChange={handleFieldChange('firstName')}
              />
              <ProfileField
                label="NickName"
                value={formData.otherName}
                editable={isEditing}
                onChange={handleFieldChange('otherName')}
              />
              <ProfileField
                label="Gender"
                value={formData.gender}
                editable={isEditing}
                onChange={handleFieldChange('gender')}
                type="select"
                options={[
                  { value: 'female', label: 'Nữ' },
                  { value: 'male', label: 'Nam' },
                  { value: 'other', label: 'Khác' },
                  { value: 'none', label: 'Không muốn trả lời'}
                ]}
              />
              <ProfileField
                label="Birthday"
                value={formData.birthday}
                editable={isEditing}
                onChange={handleFieldChange('birthday')}
                type="date"
              />
              <ProfileField
                label="Address"
                value={formData.address}
                editable={isEditing}
                onChange={handleFieldChange('address')}
              />
              <ProfileField
                label="Education"
                value={formData.education}
                editable={isEditing}
                onChange={handleFieldChange('education')}
              />
              <ProfileField
                label="Occupation"
                value={formData.occupation}
                editable={isEditing}
                onChange={handleFieldChange('occupation')}
              />
              <ProfileField
                label="Email"
                value={formData.email}
                editable={isEditing}
                onChange={handleFieldChange('email')}
                type="email"
              />
              <ProfileField
                label="Phone"
                value={formData.phone}
                editable={isEditing}
                onChange={handleFieldChange('phone')}
                type="tel"
              />
              <ProfileField
                label="Note"
                value={formData.note}
                editable={isEditing}
                onChange={handleFieldChange('note')}
                type="textarea"
                fullWidth
                maxLength={500}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProfilePage;