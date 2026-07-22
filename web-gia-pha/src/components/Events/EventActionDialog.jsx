import React, { useState } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { recurrenceScopeLabels } from '../../constants/eventConstants';
import { RecurrenceEditScope } from '../../types/events';

const EventActionDialog = ({
  isOpen,
  mode,
  event,
  isRecurring,
  isLoading,
  onClose,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');
  const [scope, setScope] = useState(RecurrenceEditScope.THIS_EVENT);
  const isDelete = mode === 'delete';

  if (!isOpen || !event) return null;

  const handleConfirm = () => {
    if (!isDelete && !reason.trim()) return;
    onConfirm({
      reason: reason.trim(),
      scope: isRecurring ? scope : undefined,
    });
  };

  return (
    <div className="modal-overlay events-modal-overlay">
      <div className="modal-container confirm-modal event-action-dialog">
        <div className="confirm-modal-header">
          <div className={`confirm-icon-wrapper ${isDelete ? 'confirm-icon-danger' : 'confirm-icon-warning'}`}>
            {isDelete ? <Trash2 size={24} /> : <AlertTriangle size={24} />}
          </div>
          <h3 className="confirm-modal-title">
            {isDelete ? 'Xóa sự kiện' : 'Hủy sự kiện'}
          </h3>
          <p className="confirm-modal-message">
            {isDelete
              ? `Bạn chắc chắn muốn xóa "${event.title}"?`
              : `Nhập lý do hủy "${event.title}".`}
          </p>
        </div>

        {!isDelete && (
          <div className="form-group event-dialog-field">
            <label htmlFor="cancel-reason">Lý do hủy</label>
            <textarea
              id="cancel-reason"
              className="form-control event-textarea"
              rows={3}
              value={reason}
              onChange={(inputEvent) => setReason(inputEvent.target.value)}
              placeholder="Ví dụ: dời lịch do thời tiết"
            />
            {!reason.trim() && <span className="form-error">Vui lòng nhập lý do hủy.</span>}
          </div>
        )}

        {isRecurring && (
          <div className="form-group event-dialog-field">
            <label htmlFor="recurrence-scope">Phạm vi áp dụng</label>
            <select
              id="recurrence-scope"
              className="form-control"
              value={scope}
              onChange={(inputEvent) => setScope(inputEvent.target.value)}
            >
              {Object.values(RecurrenceEditScope).map((value) => (
                <option key={value} value={value}>{recurrenceScopeLabels[value]}</option>
              ))}
            </select>
          </div>
        )}

        <div className="confirm-modal-actions">
          <button className="btn btn-outline" type="button" onClick={onClose} disabled={isLoading}>
            <X size={16} /> Đóng
          </button>
          <button
            className={`btn ${isDelete ? 'btn-danger' : 'btn-primary'}`}
            type="button"
            onClick={handleConfirm}
            disabled={isLoading || (!isDelete && !reason.trim())}
          >
            {isLoading ? 'Đang xử lý...' : (isDelete ? 'Xóa sự kiện' : 'Hủy sự kiện')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventActionDialog;
