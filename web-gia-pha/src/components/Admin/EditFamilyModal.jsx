import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { updateFamily } from '../../store/slices/familiesSlice';

const EditFamilyModal = ({ isOpen, onClose, family, onSuccess }) => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    name: '',
    originPlace: '',
    description: '',
    coverImg: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (family) {
      setFormData({
        name: family.name || '',
        originPlace: family.originPlace || '',
        description: family.description || '',
        coverImg: family.coverImg || ''
      });
    }
  }, [family]);

  if (!isOpen || !family) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, coverImg: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.name.trim()) {
      setError('Vui lòng nhập tên gia phả');
      return;
    }

    setLoading(true);
    try {
      await dispatch(updateFamily({ id: family.id, data: formData })).unwrap();
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err || 'Đã xảy ra lỗi khi cập nhật gia phả');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>Chỉnh sửa gia phả</h2>
          <button className="btn btn-outline" style={{ border: 'none', padding: '0.25rem' }} onClick={onClose}><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form-wrapper">
          <div className="modal-body">
            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#e53e3e', backgroundColor: '#fed7d7', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label>
                Tên gia phả <span className="text-primary">*</span>
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
                style={{ padding: '6px' }}
              />
              {formData.coverImg && (
                <div style={{ marginTop: '10px', borderRadius: '6px', overflow: 'hidden', height: '120px' }}>
                  <img src={formData.coverImg} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={loading}>
              Hủy
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Đang lưu...' : <><Save size={18} /> Lưu thay đổi</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditFamilyModal;
