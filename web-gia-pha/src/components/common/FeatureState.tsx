import React from 'react';
import { Loader2, AlertCircle, Inbox } from 'lucide-react';
import '../../css/components/FeatureState.css';

interface FeatureStateProps {
  status: 'loading' | 'error' | 'empty' | 'success';
  error?: string;
  emptyMessage?: string;
  onRetry?: () => void;
  children?: React.ReactNode;
}

const FeatureState: React.FC<FeatureStateProps> = ({ status, error, emptyMessage, onRetry, children }) => {
  if (status === 'loading') {
    return (
      <div className="feature-state-container loading">
        <Loader2 className="spinner" size={40} />
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="feature-state-container error">
        <AlertCircle size={48} className="text-danger" />
        <h3>Đã xảy ra lỗi</h3>
        <p>{error || 'Không thể kết nối đến máy chủ.'}</p>
        {onRetry && (
          <button className="btn btn-primary mt-4" onClick={onRetry}>
            Thử lại
          </button>
        )}
      </div>
    );
  }

  if (status === 'empty') {
    return (
      <div className="feature-state-container empty">
        <Inbox size={48} className="text-muted" />
        <p>{emptyMessage || 'Chưa có dữ liệu.'}</p>
      </div>
    );
  }

  return children;
};

export default FeatureState;
