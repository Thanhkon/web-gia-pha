import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import '../../css/components/ConfirmModal.css';

interface AlertModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
  buttonText?: string;
  type?: 'warning' | 'danger';
}
const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  title,
  message,
  onClose,
  buttonText = "Đã hiểu",
  type = "warning"
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="modal-container confirm-modal">
        <button className="modal-close-btn" onClick={onClose} style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', cursor: 'pointer' }}>
          <X size={20} color="#6b7280" />
        </button>

        <div className="confirm-modal-header" style={{ textAlign: 'center' }}>
          <div className={`confirm-icon-wrapper ${type === 'danger' ? 'confirm-icon-danger' : 'confirm-icon-warning'}`}>
            <AlertCircle size={24} />
          </div>

          <h3 className="confirm-modal-title">
            {title}
          </h3>

          <p className="confirm-modal-message">
            {message}
          </p>
        </div>

        <div className="confirm-modal-actions" style={{ justifyContent: 'center' }}>
          <button
            className={`btn ${type === 'danger' ? 'btn-danger' : 'btn-primary'}`}
            onClick={onClose}
            style={{ minWidth: '120px' }}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;
