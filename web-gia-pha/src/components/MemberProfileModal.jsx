import React from 'react';
import { X, Edit2 } from 'lucide-react';
import '../css/components/MemberProfileModal.css';
import avatarMale from '../assets/avatar-male.svg';
import avatarFemale from '../assets/avatar-female.svg';

const MemberProfileModal = ({ member, persons = [], relationships = [], onClose, onEdit }) => {
  if (!member) return null;

  // Find relationships
  const findPerson = (id) => persons.find(p => p.id === id);
  const father = findPerson(member.fatherId);
  const mother = findPerson(member.motherId);
  
  const spouseIds = relationships
    .filter(r => r.type === 'marriage' && (r.person_a === member.id || r.person_b === member.id))
    .map(r => r.person_a === member.id ? r.person_b : r.person_a);
  const spouses = spouseIds.map(id => findPerson(id)).filter(Boolean);

  return (
    <div className="modal-overlay">
      <div className="modal-container profile-modal">
        <div className="modal-header">
          <h2>Hồ sơ Thành viên</h2>
        </div>
        <div className="modal-body">
          <div className="profile-view-header">
            <img 
              src={member.avatarUrl || (member.gender === 'male' ? avatarMale : avatarFemale)} 
              alt="avatar" 
              className="profile-view-avatar"
            />
            <div>
              <h3 className="profile-name">{member.fullName}</h3>
              {member.otherName && <p className="profile-other-name">Tên khác: {member.otherName}</p>}
              <div className="profile-badges">
                {member.isDeleted && <span className="badge-sm bg-gray">Đã xóa</span>}
                {member.isInLaw && <span className="badge-sm bg-purple">Dâu/Rể</span>}
                {member.role && <span className="badge-sm bg-blue">{member.role}</span>}
                {member.isDeceased && <span className="badge-sm bg-gray">Đã khuất</span>}
              </div>
            </div>
          </div>
          <div className="profile-view-details">
            <div className="detail-item"><strong>Giới tính:</strong> {member.gender === 'male' ? 'Nam' : 'Nữ'}</div>
            <div className="detail-item"><strong>Đời thứ:</strong> {member.generation}</div>
            <div className="detail-item"><strong>Năm sinh:</strong> {member.birthYear || (member.dateOfBirth && new Date(member.dateOfBirth).getFullYear()) || 'Chưa cập nhật'}</div>
            {member.isDeceased && (
               <div className="detail-item"><strong>Ngày mất (Âm):</strong> {member.deathLunarDate || 'Chưa cập nhật'}</div>
            )}
            <div className="detail-item"><strong>Nơi sinh:</strong> {member.placeOfBirth || 'Chưa cập nhật'}</div>
            <div className="detail-item full-width"><strong>Địa chỉ:</strong> {member.currentAddress || 'Chưa cập nhật'}</div>
            <div className="detail-item"><strong>Nghề nghiệp:</strong> {member.occupation || 'Chưa cập nhật'}</div>
            <div className="detail-item"><strong>Học vấn:</strong> {member.education || 'Chưa cập nhật'}</div>
            <div className="detail-item"><strong>Điện thoại:</strong> {member.phone || 'Chưa cập nhật'}</div>
            <div className="detail-item"><strong>Email:</strong> {member.email || 'Chưa cập nhật'}</div>
            
            <div className="detail-item full-width profile-relationships">
              <strong>Quan hệ gia đình:</strong>
              <div className="profile-relationships-list">
                <div>• Cha: {father ? father.fullName : 'Không rõ'}</div>
                <div>• Mẹ: {mother ? mother.fullName : 'Không rõ'}</div>
                {spouses.length > 0 && (
                  <div>• Vợ/Chồng: {spouses.map(s => s.fullName).join(', ')}</div>
                )}
              </div>
            </div>
            {member.biography && (
               <div className="detail-item full-width"><strong>Tiểu sử:</strong> <p className="profile-bio">{member.biography}</p></div>
            )}
          </div>
        </div>
        <div className="modal-footer">
          {onEdit && (
            <button type="button" className="btn btn-outline" onClick={() => {
              onClose();
              onEdit(member);
            }}>
              <Edit2 size={16} style={{ display: 'inline', marginRight: '4px' }} />
              Chỉnh sửa
            </button>
          )}
          <button type="button" className="btn btn-primary" onClick={onClose}>Đóng</button>
        </div>
      </div>
    </div>
  );
};

export default MemberProfileModal;
