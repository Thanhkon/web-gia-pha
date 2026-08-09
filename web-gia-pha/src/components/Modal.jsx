import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import "../css/components/Modal.css";

const Modal = ({ isOpen, message, onClose, children }) => {
    // Khóa/mở cuộn trang khi modal bật/tắt
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }

        // Cleanup: Khôi phục lại cuộn chuột khi unmount
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return createPortal(
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-body">
                    <p>{message}</p>
                </div>
                <div className="modal-footer-1">
                    {/* Nếu có nút riêng thì hiển thị, ko thì chỉ có nút "Xác nhận" */}
                    {children ? (
                        children
                    ) : (
                        <button className="modal-btn" onClick={onClose}>
                            Xác nhận
                        </button>
                    )}
                </div>
            </div>
        </div>,
        document.body,
    );
};

export default Modal;
