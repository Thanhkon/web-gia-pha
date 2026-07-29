import React from 'react';
import '../css/components/Modal.css';

const Modal = ({ isOpen, message, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-body">
          <p>{message}</p>
        </div>
        <div className="modal-footer">
          {/* Nếu có truyền nút riêng thì hiển thị, không thì dùng nút mặc định */}
          {children ? children : (
            <button className="modal-btn" onClick={onClose}>
              Xác nhận
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;