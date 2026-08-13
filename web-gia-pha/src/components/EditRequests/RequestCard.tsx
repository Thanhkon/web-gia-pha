import React from 'react';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import { FIELD_DICT } from './RequestForm';

interface RequestCardProps {
  request: {
    status?: string;
    targetMember?: { fullName: string };
    targetMemberName?: string;
    submittedByName?: string;
    submittedBy?: { name: string };
    createdAt: string;
    reason: string;
    changes: Record<string, { old: any; new: any }>;
    adminNote?: string;
    reviewedAt?: string;
  };
}

const RequestCard: React.FC<RequestCardProps> = ({ request }) => {
  const getStatusBadge = () => {
    switch (request.status?.toLowerCase()) {
      case 'pending':
        return <span className="badge badge-warning"><Clock size={12} /> Đang chờ</span>;
      case 'approved':
        return <span className="badge badge-success"><CheckCircle size={12} /> Đã duyệt</span>;
      case 'rejected':
        return <span className="badge badge-danger"><XCircle size={12} /> Từ chối</span>;
      default:
        return null;
    }
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="request-card">
      <div className="request-card-header">
        <div>
          <h4 className="request-target">Sửa thông tin: <strong>{request.targetMember?.fullName || request.targetMemberName || 'Không rõ'}</strong></h4>
          <div className="request-meta">
            <span>Gửi bởi: <strong>{request.submittedByName || request.submittedBy?.name || 'Ẩn danh'}</strong></span>
            <span>•</span>
            <span>{formatDate(request.createdAt)}</span>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      <div className="request-card-body">
        <p className="request-reason"><strong>Lý do:</strong> {request.reason}</p>

        <div className="request-changes-summary">
          <strong>Các thay đổi:</strong>
          <ul>
            {Object.entries(request.changes).map(([field, vals]) => (
              <li key={field}>
                <strong>{FIELD_DICT[field as keyof typeof FIELD_DICT] || field}</strong>: <del>{String(vals.old) || '(Trống)'}</del> <span>→</span> <ins>{String(vals.new) || '(Trống)'}</ins>
              </li>
            ))}
          </ul>
        </div>

        {request.status?.toLowerCase() === 'rejected' && request.adminNote && (
          <div className="request-reject-reason">
            <strong>Ghi chú từ Admin:</strong> {request.adminNote}
          </div>
        )}

        {request.status?.toLowerCase() === 'approved' && request.reviewedAt && (
          <div className="request-approve-info">
            Duyệt vào lúc {formatDate(request.reviewedAt)} bởi Admin.
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestCard;
