import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import '../../css/components/ConfirmModal.css';

const ConfirmModal = ({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  onSecondaryConfirm,
  confirmText = "Xác nhận", 
  cancelText = "Hủy", 
  secondaryText,
  isDanger = false, 
  isLoading = false 
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay">
      <div className="modal-container confirm-modal">
        <div className="confirm-modal-header">
          <div className={`confirm-icon-wrapper ${isDanger ? 'confirm-icon-danger' : 'confirm-icon-warning'}`}>
            {isDanger ? <Trash2 size={24} /> : <AlertTriangle size={24} />}
          </div>
          
          <h3 className="confirm-modal-title">
            {title}
          </h3>
          
          <p className="confirm-modal-message">
            {message}
          </p>
        </div>

        <div className="confirm-modal-actions">
          <button className="btn btn-outline" onClick={onCancel} disabled={isLoading}>
            {cancelText}
          </button>
          
          {onSecondaryConfirm && (
            <button 
              className="btn btn-secondary" 
              onClick={onSecondaryConfirm}
              disabled={isLoading}
            >
              {secondaryText}
            </button>
          )}

          <button 
            className={`btn ${isDanger ? 'btn-danger' : 'btn-primary'}`} 
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Đang xử lý...' : confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmModal;
