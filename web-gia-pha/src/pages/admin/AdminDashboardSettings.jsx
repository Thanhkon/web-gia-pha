import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useFamily } from '../../hooks/useFamily';
import { updateFamilyHero } from '../../store/slices/settingsSlice';
import { uploadFamilyCoverImage } from '../../store/slices/familiesSlice';
import { Save, Image as ImageIcon, Loader } from 'lucide-react';
import '../../css/pages/Setting.css';

const AdminDashboardSettings = () => {
  const dispatch = useDispatch();
  const familyId = useFamily();
  const { familiesSettings, hero: defaultHero } = useSelector((state) => state.settings);
  
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    bgImage: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Load current settings for this family, fallback to default hero
    const currentSettings = familiesSettings[familyId]?.hero || defaultHero;
    setFormData({
      title: currentSettings.title || '',
      subtitle: currentSettings.subtitle || '',
      bgImage: currentSettings.bgImage || ''
    });
  }, [familyId, familiesSettings, defaultHero]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, bgImage: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    let finalBgImage = formData.bgImage;

    if (imageFile) {
      try {
        const resultAction = await dispatch(uploadFamilyCoverImage({ familyId, file: imageFile }));
        if (uploadFamilyCoverImage.fulfilled.match(resultAction)) {
          finalBgImage = resultAction.payload.coverImageUrl;
          setFormData(prev => ({ ...prev, bgImage: finalBgImage }));
          setImageFile(null);
        }
      } catch (err) {
        console.error('Failed to upload image', err);
      }
    }

    dispatch(updateFamilyHero({ familyId, hero: { ...formData, bgImage: finalBgImage } }));
    
    setIsSaving(false);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="setting-page animate-fade-in">
      <div className="setting-container">
        <div className="setting-header">
          <h2>Cấu hình Trang chủ (Hero Banner)</h2>
          <p>Tuỳ chỉnh giao diện trang tổng quan cho gia phả này.</p>
        </div>

        <div className="setting-content" style={{ display: 'block', padding: '2rem' }}>
          <form onSubmit={handleSubmit} className="setting-section active">
            <h3 className="section-title">Nội dung Banner (Hero)</h3>
            
            <div className="form-group">
              <label>Tiêu đề chính</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Ví dụ: Gia Phả Họ Nguyễn"
                className="form-control"
              />
            </div>

            <div className="form-group" style={{ marginTop: '1.5rem' }}>
              <label>Đoạn mô tả ngắn (Phụ đề)</label>
              <textarea
                name="subtitle"
                value={formData.subtitle}
                onChange={handleChange}
                placeholder="Nhập thông điệp chào mừng..."
                className="form-control"
                rows={4}
              />
            </div>

            <div className="form-group" style={{ marginTop: '1.5rem' }}>
              <label>Ảnh nền (Tải lên)</label>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="form-control"
                    style={{ padding: '6px' }}
                  />
                  <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                    Nên chọn ảnh có độ phân giải cao và khung hình ngang.
                  </p>
                </div>
                {formData.bgImage && (
                  <div style={{ width: '200px', height: '100px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                    <img src={formData.bgImage} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                {!formData.bgImage && (
                  <div style={{ width: '200px', height: '100px', borderRadius: '8px', border: '1px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    <ImageIcon size={32} />
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem' }}>
              {isSaved && <span style={{ color: '#10b981' }}>Đã lưu thành công!</span>}
              <button type="submit" className="btn btn-primary" disabled={isSaving}>
                {isSaving ? <Loader size={18} className="spin" /> : <Save size={18} />}
                {isSaving ? ' Đang lưu...' : ' Lưu Cấu Hình'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardSettings;
