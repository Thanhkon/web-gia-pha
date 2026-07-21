import React from 'react';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import { FIELD_DICT } from './RequestForm';

const RequestCard = ({ request }) => {
  const getStatusBadge = () => {
    switch (request.status) {
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

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="request-card">
      <div className="request-card-header">
        <div>
          <h4 className="request-target">Sửa thông tin: <strong>{request.targetMemberName}</strong></h4>
          <div className="request-meta">
            <span>Gửi bởi: <strong>{request.submittedBy.name}</strong></span>
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
                <strong>{FIELD_DICT[field] || field}</strong>: <del>{String(vals.old) || '(Trống)'}</del> <span>→</span> <ins>{String(vals.new) || '(Trống)'}</ins>
              </li>
            ))}
          </ul>
        </div>

        {request.status === 'rejected' && request.adminNote && (
          <div className="request-reject-reason">
            <strong>Ghi chú từ Admin:</strong> {request.adminNote}
          </div>
        )}
        
        {request.status === 'approved' && request.reviewedAt && (
          <div className="request-approve-info">
            Duyệt vào lúc {formatDate(request.reviewedAt)} bởi Admin.
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestCard;
