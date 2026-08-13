import React, { useState } from 'react';
import { Send, AlertCircle, Plus, X } from 'lucide-react';
import SearchableSelect from '../common/SearchableSelect';
import AlertModal from '../common/AlertModal';

interface Person {
  id: string;
  fullName: string;
  otherName: string;
  gender: string;
  dateOfBirth: string;
  birthLunarDate: string;
  birthYear: string;
  isDeceased: boolean;
  dateOfDeath: string;
  deathLunarDate: string;
  placeOfBirth: string;
  occupation: string;
  currentAddress: string;
  phone: number;
  email: string;
  note: string;
  role: string;
  generation: number;
}

export const FIELD_DICT = {
  fullName: 'Họ và tên',
  otherName: 'Tên gọi khác',
  gender: 'Giới tính',
  dateOfBirth: 'Ngày sinh (Dương lịch)',
  birthLunarDate: 'Ngày sinh (Âm lịch)',
  birthYear: 'Năm sinh',
  isDeceased: 'Đã khuất (true/false)',
  dateOfDeath: 'Ngày mất (Dương lịch)',
  deathLunarDate: 'Ngày mất (Âm lịch)',
  placeOfBirth: 'Nơi sinh',
  occupation: 'Nghề nghiệp',
  currentAddress: 'Quê quán/Địa chỉ',
  phone: 'Số điện thoại',
  email: 'Email',
  note: 'Ghi chú',
  role: 'Vai trò',
  generation: 'Đời thứ mấy'
};

interface RequestFromProps {
  persons: Person[];
  onSubmit: (request: any) => Promise<void>;
  pendingCount: number;
}

const RequestForm = ({ persons, onSubmit, pendingCount }: RequestFromProps) => {
  const [selectedPersonId, setSelectedPersonId] = useState('');
  const [changes, setChanges] = useState<Record<string, { old: string; new: string }>>({});
  const [reason, setReason] = useState('');
  const [submitterName, setSubmitterName] = useState('');
  const [submitterPhone, setSubmitterPhone] = useState('');

  const [selectedFieldToAdd, setSelectedFieldToAdd] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationAlert, setValidationAlert] = useState({ isOpen: false, message: '' });

  const selectedPerson = persons.find(p => p.id === selectedPersonId);

  const handleFieldChange = (field: string, newValue: any) => {
    setChanges(prev => ({
      ...prev,
      [field]: { old: String(selectedPerson?.[field as keyof Person] || ''), new: newValue }
    }));
  };

  const handleRemoveField = (field: string) => {
    setChanges(prev => {
      const newChanges = { ...prev };
      delete newChanges[field as keyof typeof FIELD_DICT];
      return newChanges;
    });
  };

  const addFieldToChanges = () => {
    if (selectedFieldToAdd && !changes[selectedFieldToAdd]) {
      setChanges(prev => ({
        ...prev,
        [selectedFieldToAdd]: { old: String(selectedPerson?.[selectedFieldToAdd as keyof Person] || ''), new: '' }
      }));
    }
    setSelectedFieldToAdd('');
  };

  const handlePreview = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!e.currentTarget.checkValidity()) {
      setValidationAlert({
        isOpen: true,
        message: 'Vui lòng điền đầy đủ các trường thông tin bắt buộc có dấu (*) trước khi tiếp tục.'
      });
      return;
    }

    if (pendingCount >= 5) {
      setValidationAlert({ isOpen: true, message: 'Bạn đang có quá 5 yêu cầu chờ duyệt. Vui lòng chờ Admin xử lý trước khi gửi thêm.' });
      return;
    }
    if (!selectedPersonId || !reason || !submitterName || Object.keys(changes).length === 0) {
      setValidationAlert({ isOpen: true, message: 'Vui lòng chọn thành viên, nhập thông tin thay đổi, lý do và tên người gửi.' });
      return;
    }

    const emptyFields = Object.values(changes).filter(c => String(c.new).trim() === '');
    if (emptyFields.length > 0) {
      setValidationAlert({ isOpen: true, message: 'Vui lòng nhập giá trị mới cho tất cả các trường bạn muốn thay đổi, hoặc xóa trường đó đi nếu không cần thiết.' });
      return;
    }

    setShowPreview(true);
  };

  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        type: 'edit_member',
        targetMemberId: selectedPersonId,
        targetMemberName: selectedPerson?.fullName || '',
        changes,
        reason: reason || '',
        submittedBy: {
          name: submitterName || '',
          phone: submitterPhone || ''
        }
      });

      setSelectedPersonId('');
      setChanges({});
      setReason('');
      setSubmitterName('');
      setSubmitterPhone('');
      setShowPreview(false);
    } catch (err) {
      console.error('Lỗi khi gửi yêu cầu:', err);
      // Toast error is handled in parent component where onSubmit is defined
    } finally {
      setIsSubmitting(false);
    }
  };

  const personOptions = persons.map(p => ({
    value: p.id,
    label: `${p.fullName} (Đời ${p.generation})`
  }));

  const availableFieldOptions = Object.keys(FIELD_DICT)
    .filter(key => !changes[key])
    .map(key => ({
      value: key,
      label: FIELD_DICT[key as keyof typeof FIELD_DICT]
    }));

  return (
    <div className="request-form-card panel">
      <div className="panel-header">
        <h2 className="panel-title">Tạo yêu cầu mới</h2>
      </div>
      <div className="panel-body">
        {pendingCount >= 5 && (
          <div className="alert-warning">
            <AlertCircle size={20} />
            <span>Bạn đã đạt giới hạn 5 yêu cầu đang chờ duyệt. Vui lòng đợi.</span>
          </div>
        )}

        <form onSubmit={handlePreview} noValidate className="request-form">
          <div className="form-group">
            <label>Chọn thành viên cần sửa <span className="required">*</span></label>
            <SearchableSelect
              options={personOptions}
              value={selectedPersonId}
              onChange={(val) => {
                setSelectedPersonId(val);
                setChanges({});
              }}
              placeholder="-- Gõ để tìm thành viên --"
              disabled={pendingCount >= 5}
            />
          </div>

          {selectedPerson && (
            <div className="changes-section">
              <h4>Thông tin muốn thay đổi</h4>
              <p className="changes-help">Thêm các trường bạn muốn sửa và nhập thông tin mới.</p>

              <div className="changes-grid">
                {Object.keys(changes).map(field => (
                  <div key={field} className="change-field-row">
                    <label>
                      {FIELD_DICT[field as keyof typeof FIELD_DICT]}
                      <span className="current-val-text"> (Hiện tại: {String(selectedPerson?.[field as keyof Person] || 'Trống')})</span>
                    </label>
                    <div className="change-input-group">
                      <input
                        type="text"
                        className="form-control flex-1"
                        placeholder={`Nhập ${FIELD_DICT[field as keyof typeof FIELD_DICT].toLowerCase()} mới...`}
                        value={changes[field].new}
                        onChange={(e) => handleFieldChange(field, e.target.value)}
                        disabled={pendingCount >= 5}
                      />
                      <button type="button" className="btn-remove-icon" onClick={() => handleRemoveField(field)} title="Xóa trường này">
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {availableFieldOptions.length > 0 && (
                <div className="add-field-control">
                  <select
                    className="form-control"
                    value={selectedFieldToAdd}
                    onChange={e => setSelectedFieldToAdd(e.target.value)}
                    disabled={pendingCount >= 5}
                  >
                    <option value="">-- Chọn trường cần sửa --</option>
                    {availableFieldOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <button type="button" className="btn btn-outline" onClick={addFieldToChanges} disabled={!selectedFieldToAdd || pendingCount >= 5}>
                    <Plus size={16} className="icon-mr-4" /> Thêm
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="form-group">
            <label>Lý do chỉnh sửa <span className="required">*</span></label>
            <textarea
              className="form-control"
              placeholder="Vui lòng mô tả chi tiết lý do bạn muốn đổi thông tin (VD: Tên đệm bị sai, cập nhật nghề nghiệp mới...)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              rows={3}
              disabled={pendingCount >= 5}
            ></textarea>
          </div>

          <div className="edit-request-form-row">
            <div className="form-group">
              <label>Họ và tên người gửi <span className="required">*</span></label>
              <input
                type="text"
                className="form-control"
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
                className="form-control"
                placeholder="Tuỳ chọn..."
                value={submitterPhone}
                onChange={(e) => setSubmitterPhone(e.target.value)}
                disabled={pendingCount >= 5}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary submit-btn" disabled={pendingCount >= 5}>
            <Send size={18} className="icon-mr-8" /> Xem trước yêu cầu
          </button>
        </form>
      </div>

      {showPreview && (
        <div className="modal-overlay">
          <div className="modal-container preview-modal">
            <div className="modal-header">
              <h2>Xác nhận yêu cầu chỉnh sửa</h2>
              <button type="button" className="icon-btn" onClick={() => setShowPreview(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <p>Bạn đang gửi yêu cầu sửa đổi thông tin cho thành viên <strong>{selectedPerson?.fullName}</strong>.</p>

              <div className="diff-section my-4">
                <h4>Các thay đổi đề xuất:</h4>
                <table className="diff-table">
                  <thead>
                    <tr>
                      <th>Trường dữ liệu</th>
                      <th>Đang có</th>
                      <th>Đề xuất mới</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(changes).map(field => (
                      <tr key={field}>
                        <td className="field-name">{FIELD_DICT[field as keyof typeof FIELD_DICT] || field}</td>
                        <td className="old-val"><del>{String(changes[field].old) || '(Trống)'}</del></td>
                        <td className="new-val"><ins>{String(changes[field].new) || '(Trống)'}</ins></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="preview-summary-box">
                <p><strong>Lý do:</strong> {reason}</p>
                <p><strong>Người gửi:</strong> {submitterName} {submitterPhone ? `(${submitterPhone})` : ''}</p>
              </div>

              <div className="alert-warning mt-4">
                Lưu ý: Yêu cầu của bạn sẽ được gửi đến Quản trị viên để kiểm tra và phê duyệt trước khi áp dụng vào gia phả.
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline" onClick={() => setShowPreview(false)}>Quay lại sửa</button>
              <button type="button" className="btn btn-primary" onClick={handleConfirmSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Đang gửi...' : <><Send size={16} className="icon-mr-8" /> Xác nhận gửi</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <AlertModal
        isOpen={validationAlert.isOpen}
        title="Lỗi nhập liệu"
        message={validationAlert.message}
        onClose={() => setValidationAlert({ isOpen: false, message: '' })}
      />
    </div>
  );
};

export default RequestForm;
