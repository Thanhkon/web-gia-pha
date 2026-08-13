import React, { useState } from 'react';
import { X, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { FIELD_DICT } from './RequestForm';
import ConfirmModal from '../common/ConfirmModal';

interface RequestDetailModalProps {
  request: {
    id: string;
    targetMember?: { fullName: string };
    targetMemberName?: string;
    submittedByName?: string;
    submittedBy?: { name: string; phone: number };
    submittedByPhone?: number;
    reason: string;
    changes: Record<string, { old: any; new: any }>;
    adminNote?: string;
  };
  onClose: () => void;
  onApprove: (id: string, adminNote: string) => void;
  onReject: (id: string, adminNote: string) => void;
}

const RequestDetailModal: React.FC<RequestDetailModalProps> = ({ request, onClose, onApprove, onReject }) => {
  const [adminNote, setAdminNote] = useState('');
  const [confirmType, setConfirmType] = useState<'approve' | 'reject' | null>(null);

  if (!request) return null;

  const handleApproveClick = () => setConfirmType('approve');

  const handleRejectClick = () => {
    if (!adminNote.trim()) {
      toast.error('Vui lòng nhập lý do từ chối để thông báo cho người gửi.');
      return;
    }
    setConfirmType('reject');
  };

  const handleConfirm = () => {
    if (confirmType === 'approve') onApprove(request.id, adminNote);
    else if (confirmType === 'reject') onReject(request.id, adminNote);
    setConfirmType(null);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container request-detail-modal">
        <div className="modal-header">
          <h2>Chi tiết yêu cầu chỉnh sửa</h2>
        </div>

        <div className="modal-body request-detail-body">
          <div className="request-info-header">
            <h3>Mục tiêu: <strong>{request.targetMember?.fullName || request.targetMemberName || 'Không rõ'}</strong></h3>
            <div className="meta">
              <span>Người gửi: <strong>{request.submittedByName || request.submittedBy?.name || 'Ẩn danh'}</strong></span>
              {(request.submittedByPhone || request.submittedBy?.phone) && <span> (SĐT: {request.submittedByPhone || request.submittedBy?.phone})</span>}
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
                    <td className="field-name">{FIELD_DICT[field as keyof typeof FIELD_DICT] || field}</td>
                    <td className="old-val"><del>{String(vals.old) || '(Trống)'}</del></td>
                    <td className="new-val"><ins>{String(vals.new) || '(Trống)'}</ins></td>
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
            <button type="button" className="btn btn-danger" onClick={handleRejectClick}>
              <XCircle size={16} /> Từ chối
            </button>
            <button type="button" className="btn btn-success" onClick={handleApproveClick}>
              <CheckCircle size={16} /> Duyệt & Áp dụng
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!confirmType}
        title={confirmType === 'approve' ? 'Duyệt yêu cầu' : 'Từ chối yêu cầu'}
        message={
          confirmType === 'approve'
            ? `Xác nhận duyệt và áp dụng thay đổi cho ${request.targetMember?.fullName || request.targetMemberName || 'người này'}?`
            : 'Xác nhận TỪ CHỐI yêu cầu này?'
        }
        onConfirm={handleConfirm}
        onCancel={() => setConfirmType(null)}
        isDanger={confirmType === 'reject'}
        confirmText={confirmType === 'approve' ? 'Duyệt' : 'Từ chối'}
      />
    </div>
  );
};

export default RequestDetailModal;
