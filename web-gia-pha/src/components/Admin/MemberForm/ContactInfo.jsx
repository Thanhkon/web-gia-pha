import React from 'react';

const ContactInfo = ({ formData, onChange }) => {
  return (
    <>
      <div className="form-section">
        <h3 className="form-section-title">3. Nơi sinh / Nơi ở</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Nơi sinh</label>
            <input type="text" className="form-control" value={formData.birthPlace} onChange={e => onChange('birthPlace', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Nơi ở hiện tại</label>
            <input type="text" className="form-control" value={formData.address} onChange={e => onChange('address', e.target.value)} />
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3 className="form-section-title">4. Công việc / Học vấn</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Nghề nghiệp</label>
            <input type="text" className="form-control" value={formData.occupation} onChange={e => onChange('occupation', e.target.value)} placeholder="VD: Giáo viên, Bác sĩ..." />
          </div>
          <div className="form-group">
            <label>Học vấn / Bằng cấp</label>
            <input type="text" className="form-control" value={formData.education} onChange={e => onChange('education', e.target.value)} placeholder="VD: Cử nhân, Thạc sĩ..." />
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3 className="form-section-title">5. Tiểu sử / Ghi chú</h3>
        <div className="form-group">
          <label>Tóm tắt tiểu sử</label>
          <textarea className="form-control" rows="3" value={formData.biography} onChange={e => onChange('biography', e.target.value)} placeholder="Vài nét về cuộc đời, thành tựu..." />
        </div>
        <div className="form-group">
          <label>Ghi chú thêm</label>
          <textarea className="form-control" rows="2" value={formData.notes} onChange={e => onChange('notes', e.target.value)} />
        </div>
      </div>
    </>
  );
};

export default ContactInfo;
