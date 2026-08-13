import React from 'react';
interface LogoutConfirmModalProps {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({ show, onClose, onConfirm }) => {
  if (!show) return null;
  return (
    <div className="logout-confirm-backdrop" onClick={onClose}>
      <div className="logout-confirm-modal" onClick={(event) => event.stopPropagation()}>
        <p className="logout-confirm-text">Bạn có chắc chắn muốn đăng xuất?</p>
        <div className="logout-confirm-actions">
          <button type="button" className="logout-cancel-btn" onClick={onClose}>
            Quay lại
          </button>
          <button type="button" className="logout-confirm-btn" onClick={onConfirm}>
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutConfirmModal;
