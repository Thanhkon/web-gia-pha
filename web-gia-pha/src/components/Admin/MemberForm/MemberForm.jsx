import React, { useState } from 'react';
import { X, RefreshCw } from 'lucide-react';
import GeneralInfo from './GeneralInfo';
import DateInfo from './DateInfo';
import ContactInfo from './ContactInfo';
import ConfirmModal from '../../common/ConfirmModal';
import '../../../css/components/MemberForm.css';

const MemberForm = ({ initialData, persons, relationships, isEditing, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const handleCancelClick = () => {
    const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialData);
    if (hasChanges) {
      setShowCancelConfirm(true);
    } else {
      onCancel();
    }
  };

  /**
   * handleChange: xử lý tất cả side effects ngay trong hàm thay đổi.
   * Trước đây dùng useEffect để "reactive sync" state → state (anti-pattern, gây double render).
   * Giờ tính toán trực tiếp trong một lần setState duy nhất.
   */
  const handleChange = (field, value) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };

      // 1. Tự động bật "Đã khuất" nếu nhập ngày mất
      if ((field === 'deathDate' || field === 'deathLunarDate') && value) {
        next.isDeceased = true;
      }

      // 2. Tự động gợi ý Mẹ khi chọn Cha (nếu Cha có hôn nhân đã biết)
      if (field === 'fatherId' && value && !prev.motherId && relationships) {
        const marriage = relationships.find(
          r => r.type === 'marriage' && (r.person_a === value || r.person_b === value)
        );
        if (marriage) {
          const spouseId = marriage.person_a === value ? marriage.person_b : marriage.person_a;
          const spouse = persons?.find(p => p.id === spouseId && p.gender === 'female');
          if (spouse) next.motherId = spouse.id;
        }
      }

      // 3. Tự động gợi ý Cha khi chọn Mẹ (nếu Mẹ có hôn nhân đã biết)
      if (field === 'motherId' && value && !prev.fatherId && relationships) {
        const marriage = relationships.find(
          r => r.type === 'marriage' && (r.person_a === value || r.person_b === value)
        );
        if (marriage) {
          const spouseId = marriage.person_a === value ? marriage.person_b : marriage.person_a;
          const spouse = persons?.find(p => p.id === spouseId && p.gender === 'male');
          if (spouse) next.fatherId = spouse.id;
        }
      }

      // 4. Tự động tính "Đời thứ mấy"
      if (field === 'spouseId' && next.isInLaw && value) {
        const spouse = persons?.find(p => p.id === value);
        if (spouse) next.generation = Number(spouse.generation);
      } else if (field === 'isInLaw' && value && next.spouseId) {
        const spouse = persons?.find(p => p.id === next.spouseId);
        if (spouse) next.generation = Number(spouse.generation);
      } else if ((field === 'fatherId' || field === 'motherId') && value) {
        const parent = persons?.find(p => p.id === value);
        if (parent) next.generation = Number(parent.generation) + 1;
      }

      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.birthDate) {
      const selectedDate = new Date(formData.birthDate);
      const today = new Date();
      if (selectedDate > today) {
        alert('Lỗi: Ngày sinh không thể lớn hơn ngày hiện tại!');
        return;
      }
    }

    const extractedYear = formData.birthDate
      ? parseInt(formData.birthDate.substring(0, 4))
      : (formData.birthYear || 1900);

    if (formData.fatherId) {
      const father = persons?.find(p => p.id === formData.fatherId);
      if (father && extractedYear <= (father.birthYear || 0)) {
        alert('Lỗi: Năm sinh của con phải lớn hơn năm sinh của Cha!');
        return;
      }
    }
    if (formData.motherId) {
      const mother = persons?.find(p => p.id === formData.motherId);
      if (mother && extractedYear <= (mother.birthYear || 0)) {
        alert('Lỗi: Năm sinh của con phải lớn hơn năm sinh của Mẹ!');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onSubmit({ ...formData, birthYear: extractedYear, generation: parseInt(formData.generation) || 1 });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container member-form-container">
        <div className="modal-header">
          <h2>{isEditing ? 'Cập nhật Thành viên' : 'Thêm Thành viên mới'}</h2>
        </div>

        <form onSubmit={handleSubmit} className="member-form">
          <div className="member-form-scrollable">
            <GeneralInfo formData={formData} onChange={handleChange} persons={persons} />
            <DateInfo formData={formData} onChange={handleChange} />
            <ContactInfo formData={formData} onChange={handleChange} />
          </div>

          <div className="member-form-footer">
            <button type="button" className="btn btn-outline" onClick={handleCancelClick} disabled={isSubmitting}>Hủy</button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? (
                <span><RefreshCw size={14} className="spin-icon" style={{ display: 'inline', marginRight: '6px' }} /> Đang lưu...</span>
              ) : (
                isEditing ? 'Lưu thay đổi' : 'Lưu thành viên'
              )}
            </button>
          </div>
        </form>
      </div>

      <ConfirmModal
        isOpen={showCancelConfirm}
        title="Xác nhận hủy"
        message="Bạn có dữ liệu chưa lưu. Bạn có chắc chắn muốn đóng form? Mọi thay đổi sẽ bị mất."
        onConfirm={onCancel}
        confirmText="Đóng & Bỏ qua"
        onCancel={() => setShowCancelConfirm(false)}
        cancelText="Tiếp tục chỉnh sửa"
        isDanger={true}
      />
    </div>
  );
};

export default MemberForm;
