import React from 'react';
import { useSelector } from 'react-redux';

const GeneralInfo = ({ formData, onChange, persons }) => {
  const relationships = useSelector(state => state.members.relationships);

  const availableMales = persons.filter(p => p.gender === 'male' && p.id !== formData.id);
  const availableFemales = persons.filter(p => p.gender === 'female' && p.id !== formData.id);

  // Phân nhóm Cha/Mẹ được ưu tiên nếu đã chọn một bên
  let prioritizedFemales = [];
  let otherFemales = availableFemales;
  if (formData.fatherId) {
    const fatherMarriages = relationships.filter(r => r.type === 'marriage' && (r.person_a === formData.fatherId || r.person_b === formData.fatherId));
    const wifeIds = fatherMarriages.map(m => m.person_a === formData.fatherId ? m.person_b : m.person_a);
    prioritizedFemales = availableFemales.filter(f => wifeIds.includes(f.id));
    otherFemales = availableFemales.filter(f => !wifeIds.includes(f.id));
  }

  let prioritizedMales = [];
  let otherMales = availableMales;
  if (formData.motherId) {
    const motherMarriages = relationships.filter(r => r.type === 'marriage' && (r.person_a === formData.motherId || r.person_b === formData.motherId));
    const husbandIds = motherMarriages.map(m => m.person_a === formData.motherId ? m.person_b : m.person_a);
    prioritizedMales = availableMales.filter(m => husbandIds.includes(m.id));
    otherMales = availableMales.filter(m => !husbandIds.includes(m.id));
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Lỗi: Ảnh quá lớn. Vui lòng chọn ảnh dưới 2MB!');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange('imageUrl', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="form-section">
      <h3 className="form-section-title">1. Thông tin Định danh</h3>
      <div className="form-row" style={{ alignItems: 'center', marginBottom: '15px' }}>
        <div style={{ marginRight: '20px', textAlign: 'center' }}>
          <img 
            src={formData.imageUrl || (formData.gender === 'male' ? 'https://ui-avatars.com/api/?name=User&background=FAF5F0&color=9B2C2C' : 'https://ui-avatars.com/api/?name=User&background=FCE7F3&color=C53030')} 
            alt="Avatar preview" 
            style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #e5e7eb', marginBottom: '8px' }} 
          />
          <div>
            <label htmlFor="avatar-upload" style={{ cursor: 'pointer', fontSize: '0.8rem', color: '#3b82f6', textDecoration: 'underline' }}>
              Tải ảnh lên
            </label>
            <input id="avatar-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
          </div>
        </div>
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div className="form-group">
            <label>Họ và tên *</label>
            <input type="text" required className="form-control" value={formData.fullName} onChange={e => onChange('fullName', e.target.value)} placeholder="Nhập họ tên đầy đủ" />
          </div>
          <div className="form-group">
            <label>Tên gọi khác</label>
            <input type="text" className="form-control" value={formData.otherName} onChange={e => onChange('otherName', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Giới tính *</label>
            <select className="form-control" value={formData.gender} onChange={e => onChange('gender', e.target.value)}>
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
            </select>
          </div>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Là con của Cha</label>
          <select className="form-control" value={formData.fatherId} onChange={e => onChange('fatherId', e.target.value)}>
            <option value="">-- Không rõ  --</option>
            {prioritizedMales.length > 0 && (
              <optgroup label="Các Chồng của Mẹ">
                {prioritizedMales.map(m => <option key={m.id} value={m.id}>{m.fullName} (Chồng)</option>)}
              </optgroup>
            )}
            <optgroup label="Danh sách khác">
              {otherMales.map(m => <option key={m.id} value={m.id}>{m.fullName} (Đời {m.generation})</option>)}
            </optgroup>
          </select>
        </div>
        <div className="form-group">
          <label>Là con của Mẹ</label>
          <select className="form-control" value={formData.motherId} onChange={e => onChange('motherId', e.target.value)}>
            <option value="">-- Không rõ --</option>
            {prioritizedFemales.length > 0 && (
              <optgroup label="Các Vợ của Cha">
                {prioritizedFemales.map(f => <option key={f.id} value={f.id}>{f.fullName} (Vợ)</option>)}
              </optgroup>
            )}
            <optgroup label="Danh sách khác">
              {otherFemales.map(f => <option key={f.id} value={f.id}>{f.fullName} (Đời {f.generation})</option>)}
            </optgroup>
          </select>
        </div>
      </div>

      {formData.isInLaw && (
        <div className="form-row">
          <div className="form-group">
            <label>{formData.gender === 'female' ? 'Là Vợ của' : 'Là Chồng của'}</label>
            <select className="form-control" value={formData.spouseId || ''} onChange={e => onChange('spouseId', e.target.value)}>
              <option value="">{formData.gender === 'female' ? '-- Chọn Chồng --' : '-- Chọn Vợ --'}</option>
              {(formData.gender === 'female' ? availableMales : availableFemales).map(p => (
                <option key={p.id} value={p.id}>{p.fullName} (Đời {p.generation})</option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="form-row form-row-3">
        <div className="form-group">
          <label>Đời thứ mấy *</label>
          <input type="number" required min="1" className="form-control" value={formData.generation} onChange={e => onChange('generation', e.target.value)} />
        </div>
        <div className="form-group">
          <label>Chi / Nhánh</label>
          <input type="text" className="form-control" value={formData.branch} onChange={e => onChange('branch', e.target.value)} placeholder="VD: Trưởng chi 1" />
        </div>
        <div className="form-group form-group-checkbox">
          <label className="checkbox-label checkbox-label-padded">
            <input type="checkbox" checked={formData.isInLaw} onChange={e => onChange('isInLaw', e.target.checked)} />
            Là Dâu / Rể
          </label>
        </div>
      </div>
    </div>
  );
};

export default GeneralInfo;
