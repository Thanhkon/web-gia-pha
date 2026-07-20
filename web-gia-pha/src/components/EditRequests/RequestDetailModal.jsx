import React, { useState } from 'react';
import { X, CheckCircle, XCircle } from 'lucide-react';

const RequestDetailModal = ({ request, onClose, onApprove, onReject }) => {
  const [adminNote, setAdminNote] = useState('');

  if (!request) return null;

  const handleApprove = () => {
    if (window.confirm(`Xác nhận duyệt yêu cầu sửa thông tin cho ${request.targetMemberName}?`)) {
      onApprove(request.id, adminNote);
    }
  };

  const handleReject = () => {
    if (!adminNote) {
      alert('Vui lòng nhập lý do từ chối để thông báo cho người gửi.');
      return;
    }
    if (window.confirm('Xác nhận TỪ CHỐI yêu cầu này?')) {
      onReject(request.id, adminNote);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container request-detail-modal">
        <div className="modal-header">
          <h2>Chi tiết yêu cầu chỉnh sửa</h2>
          <button type="button" className="icon-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-body request-detail-body">
          <div className="request-info-header">
            <h3>Mục tiêu: <strong>{request.targetMemberName}</strong></h3>
            <div className="meta">
              <span>Người gửi: <strong>{request.submittedBy.name}</strong></span>
              {request.submittedBy.phone && <span> (SĐT: {request.submittedBy.phone})</span>}
            </div>
          </div>

          <div className="request-reason-box">
            <strong>Lý do yêu cầu:</strong>
            <p>{request.reason}</p>
          </div>

          <div className="diff-section">
            <h4>Bảng so sánh thay đổi</h4>
            <table className="diff-table">
              <thead>
                <tr>
                  <th>Trường dữ liệu</th>
                  <th>Giá trị cũ</th>
                  <th>Giá trị mới (Đề xuất)</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(request.changes).map(([field, vals]) => (
                  <tr key={field}>
                    <td className="field-name">{field}</td>
                    <td className="old-val"><del>{vals.old || '(Trống)'}</del></td>
                    <td className="new-val"><ins>{vals.new || '(Trống)'}</ins></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="admin-action-section">
            <label>Ghi chú của Admin (bắt buộc khi từ chối):</label>
            <textarea
              placeholder="Nhập lý do từ chối hoặc ghi chú thêm..."
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              rows={3}
            ></textarea>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-outline" onClick={onClose}>Thoát</button>
          <div className="action-buttons">
            <button type="button" className="btn btn-danger" onClick={handleReject}>
              <XCircle size={16} /> Từ chối
            </button>
            <button type="button" className="btn btn-success" onClick={handleApprove}>
              <CheckCircle size={16} /> Duyệt & Áp dụng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestDetailModal;
