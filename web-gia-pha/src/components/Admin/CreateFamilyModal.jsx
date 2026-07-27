import React, { useState } from 'react';
import { X, Plus, AlertCircle } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { createFamily } from '../../store/slices/familiesSlice';
import '../../css/components/ConfirmModal.css'; // Reuse existing styles if possible or create new

const CreateFamilyModal = ({ isOpen, onClose, onSuccess }) => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    name: '',
    originPlace: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
      await dispatch(createFamily(formData)).unwrap();
      onSuccess?.();
      onClose();
      setFormData({ name: '', originPlace: '', description: '' });
    } catch (err) {
      setError(err || 'Đã xảy ra lỗi khi tạo gia phả');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Tạo gia phả mới</h3>
          <button className="btn-close" onClick={onClose}><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-body">
          {error && (
            <div className="alert-error" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#dc2626', backgroundColor: '#fee2e2', padding: '12px', borderRadius: '8px' }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Tên gia phả <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ví dụ: Gia phả họ Nguyễn"
              className="form-input"
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Nguyên quán / Quê gốc</label>
            <input
              type="text"
              name="originPlace"
              value={formData.originPlace}
              onChange={handleChange}
              placeholder="Ví dụ: Hưng Yên"
              className="form-input"
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Mô tả ngắn</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Mô tả về dòng họ..."
              className="form-input"
              rows={3}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
            />
          </div>

          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>
              Hủy
            </button>
            <button type="submit" className="btn-confirm" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px' }}>
              {loading ? 'Đang tạo...' : <><Plus size={18} /> Tạo mới</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateFamilyModal;
