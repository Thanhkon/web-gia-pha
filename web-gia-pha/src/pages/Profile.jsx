import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { Pencil, Image } from 'lucide-react';
import defaultAvatar from '../assets/avatar-female.svg';
import { updateProfileApi } from '../../api/profileApi'; 
import { login } from '../store/slices/authSlice';
import '../css/pages/Profile.css';

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
          <div className="profile-char-counter">{value ? value.length : 0}/{maxLength}</div>
        </div>
      </div>
    );
  }

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

const ProfilePage = () => {
  const [showAvatarPreview, setShowAvatarPreview] = useState(false);
  const dispatch = useDispatch();
  const { profileId } = useParams();
  const { user } = useSelector((state) => state.auth);
  
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    otherName: user?.otherName || '',
    gender: user?.gender || '',
    birthday: user?.birthday || '',
    address: user?.address || '',
    education: user?.education || '',
    occupation: user?.occupation || '',
    email: user?.email || '',
    phone: user?.phone || '',
    note: user?.note || '',
    avatar: user?.avatar 
      ? (user.avatar.startsWith('blob:') || user.avatar.startsWith('http') || user.avatar.startsWith('/') ? user.avatar : `http://localhost:3000/images/${user.avatar}`) 
      : defaultAvatar,
  });

  const [selectedFile, setSelectedFile] = useState(null);

  const isSelfProfile = profileId === 'me';

  const handleFieldChange = (field) => (event) => {
    setFormData((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleAvatarChange = (e) => {
    e.preventDefault();
    const file = e.target.files && e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const previewUrl = URL.createObjectURL(file);
      setFormData((prev) => ({
        ...prev,
        avatar: previewUrl,
      }));
      setShowAvatarPreview(false);
    }
  };

  const handleSaveProfile = async () => {
    if (isEditing) {
      try {
        const dataToSend = new FormData();

        if (user?.id) {
          dataToSend.append('id', user.id);
        }
        
        Object.keys(formData).forEach((key) => {
          if (key !== 'avatar') {
            dataToSend.append(key, formData[key]);
          }
        });

        if (selectedFile) {
          dataToSend.append('avatar', selectedFile);
        }

        const response = await updateProfileApi(dataToSend);
        const updatedUser = response.data || response;

        dispatch(login({ ...user, ...updatedUser }));
        setIsEditing(false);
      } catch (error) {
        console.error("Lỗi khi cập nhật profile:", error);
        setIsEditing(false);
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

          {showAvatarPreview && (
            <div className="profile-avatar-modal-backdrop" onClick={() => setShowAvatarPreview(false)}>
              <div className="profile-avatar-modal" onClick={(event) => event.stopPropagation()}>
                <img src={formData.avatar} alt="Avatar preview" className="profile-avatar-modal-image" />
                <button 
                  type="button" 
                  className="profile-avatar-change-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Image size={18} />
                  <span>Chọn ảnh đại diện</span>
                </button>
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
                  { value: 'none', label: 'Không muốn trả lời' }
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
                type="textarea" fullWidth maxLength={500} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;