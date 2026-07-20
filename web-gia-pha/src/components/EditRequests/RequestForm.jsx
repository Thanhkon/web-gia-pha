import React, { useState } from 'react';
import { Send, AlertCircle } from 'lucide-react';

const RequestForm = ({ persons, onSubmit, pendingCount }) => {
  const [selectedPersonId, setSelectedPersonId] = useState('');
  const [changes, setChanges] = useState({});
  const [reason, setReason] = useState('');
  const [submitterName, setSubmitterName] = useState('');
  const [submitterPhone, setSubmitterPhone] = useState('');

  const selectedPerson = persons.find(p => p.id === selectedPersonId);

  const handleFieldChange = (field, newValue) => {
    setChanges(prev => ({
      ...prev,
      [field]: { old: selectedPerson[field] || '', new: newValue }
    }));
  };

  const handleRemoveField = (field) => {
    setChanges(prev => {
      const newChanges = { ...prev };
      delete newChanges[field];
      return newChanges;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pendingCount >= 5) {
      alert('Bạn đang có quá 5 yêu cầu chờ duyệt. Vui lòng chờ Admin xử lý trước khi gửi thêm.');
      return;
    }
    if (!selectedPersonId || !reason || !submitterName || Object.keys(changes).length === 0) {
      alert('Vui lòng chọn thành viên, nhập thông tin thay đổi, lý do và tên người gửi.');
      return;
    }

    onSubmit({
      type: 'edit_member',
      targetMemberId: selectedPersonId,
      targetMemberName: selectedPerson.fullName,
      changes,
      reason,
      submittedBy: {
        name: submitterName,
        phone: submitterPhone
      }
    });

    // Reset form
    setSelectedPersonId('');
    setChanges({});
    setReason('');
    setSubmitterName('');
    setSubmitterPhone('');
  };

  return (
    <div className="request-form-card panel">
      <div className="panel-header">
        <h2 className="panel-title">Tạo yêu cầu mới</h2>
      </div>
      <div className="panel-body">
        {pendingCount >= 5 && (
          <div className="alert-warning" style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#fffbeb', color: '#92400e', borderRadius: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <AlertCircle size={20} />
            <span>Bạn đã đạt giới hạn 5 yêu cầu đang chờ duyệt. Vui lòng đợi.</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="request-form">
          <div className="form-group">
            <label>Chọn thành viên cần sửa <span className="required">*</span></label>
            <select
              value={selectedPersonId}
              onChange={(e) => {
                setSelectedPersonId(e.target.value);
                setChanges({});
              }}
              required
              disabled={pendingCount >= 5}
            >
              <option value="">-- Chọn thành viên --</option>
              {persons.map(p => (
                <option key={p.id} value={p.id}>{p.fullName} (Đời {p.generation})</option>
              ))}
            </select>
          </div>

          {selectedPerson && (
            <div className="changes-section">
              <h4>Thông tin muốn thay đổi</h4>
              <p className="changes-help">Chỉ điền vào những trường bạn muốn sửa. Nếu không đổi, vui lòng để trống.</p>
              
              <div className="changes-grid">
                <div className="change-field-row">
                  <label>Năm sinh (Hiện tại: {selectedPerson.birthYear || '?'})</label>
                  <input
                    type="number"
                    placeholder="Nhập năm sinh mới..."
                    value={changes.birthYear?.new || ''}
                    onChange={(e) => handleFieldChange('birthYear', e.target.value)}
                    disabled={pendingCount >= 5}
                  />
                  {changes.birthYear && <button type="button" className="btn-remove" onClick={() => handleRemoveField('birthYear')}>Xóa</button>}
                </div>
                
                <div className="change-field-row">
                  <label>Nghề nghiệp (Hiện tại: {selectedPerson.occupation || 'Chưa rõ'})</label>
                  <input
                    type="text"
                    placeholder="Nhập nghề nghiệp mới..."
                    value={changes.occupation?.new || ''}
                    onChange={(e) => handleFieldChange('occupation', e.target.value)}
                    disabled={pendingCount >= 5}
                  />
                  {changes.occupation && <button type="button" className="btn-remove" onClick={() => handleRemoveField('occupation')}>Xóa</button>}
                </div>

                 <div className="change-field-row">
                  <label>Quê quán/Địa chỉ (Hiện tại: {selectedPerson.address || 'Chưa rõ'})</label>
                  <input
                    type="text"
                    placeholder="Nhập địa chỉ mới..."
                    value={changes.address?.new || ''}
                    onChange={(e) => handleFieldChange('address', e.target.value)}
                    disabled={pendingCount >= 5}
                  />
                  {changes.address && <button type="button" className="btn-remove" onClick={() => handleRemoveField('address')}>Xóa</button>}
                </div>
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Lý do chỉnh sửa <span className="required">*</span></label>
            <textarea
              placeholder="Vui lòng mô tả chi tiết lý do bạn muốn đổi thông tin (VD: Tên đệm bị sai, cập nhật nghề nghiệp mới...)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              rows={3}
              disabled={pendingCount >= 5}
            ></textarea>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Họ và tên người gửi <span className="required">*</span></label>
              <input
                type="text"
                placeholder="Nhập tên của bạn..."
                value={submitterName}
                onChange={(e) => setSubmitterName(e.target.value)}
                required
                disabled={pendingCount >= 5}
              />
            </div>
            <div className="form-group">
              <label>Số điện thoại liên hệ</label>
              <input
                type="tel"
                placeholder="Tuỳ chọn..."
                value={submitterPhone}
                onChange={(e) => setSubmitterPhone(e.target.value)}
                disabled={pendingCount >= 5}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary submit-btn" disabled={pendingCount >= 5}>
            <Send size={18} /> Gửi yêu cầu
          </button>
        </form>
      </div>
    </div>
  );
};

export default RequestForm;
