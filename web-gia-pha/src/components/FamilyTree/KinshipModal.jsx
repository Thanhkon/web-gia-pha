import React from 'react';
import { X } from 'lucide-react';
import '../../css/components/KinshipModal.css';

const getAvatarPlaceholder = (gender) => {
  return gender === 'female' ? '/src/assets/avatar-female.svg' : '/src/assets/avatar-male.svg';
};

const KinshipModal = ({ isOpen, onClose, kinshipResult, personA, personB }) => {
  if (!isOpen || !kinshipResult || !personA || !personB) return null;

  const relationTitle = kinshipResult.distance === 0 ? "Quan hệ Hôn nhân" : (kinshipResult.description || "Quan hệ xưng hô");

  return (
    <div className="kinship-modal-overlay">
      <div className="kinship-modal-content">
        <div className="kinship-modal-header">
          <h2>{relationTitle}</h2>
          <button className="kinship-close-btn" onClick={onClose} title="Đóng">
            <X size={24} />
          </button>
        </div>
        
        <div className="kinship-modal-body">
          {/* Vế của Person B đối với Person A (A gọi B là gì) */}
          <div className="kinship-card">
            <div className="kinship-role">VAI {kinshipResult.aCallsB?.toUpperCase()}</div>
            <div className="kinship-avatar">
              <img src={personB.imageUrl || getAvatarPlaceholder(personB.gender)} alt={personB.fullName} />
            </div>
            <div className="kinship-name">{personB.fullName}</div>
            {personB.birthYear && (
              <div className="kinship-years">
                ({personB.birthYear} - {personB.deathYear || (personB.isDeceased ? '?' : 'Nay')})
              </div>
            )}
            <div className="kinship-gender">Giới tính: {personB.gender === 'female' ? 'Nữ' : 'Nam'}</div>
          </div>

          {/* Vế của Person A đối với Person B (B gọi A là gì) */}
          <div className="kinship-card">
            <div className="kinship-role">VAI {kinshipResult.bCallsA?.toUpperCase()}</div>
            <div className="kinship-avatar">
              <img src={personA.imageUrl || getAvatarPlaceholder(personA.gender)} alt={personA.fullName} />
            </div>
            <div className="kinship-name">{personA.fullName}</div>
            {personA.birthYear && (
              <div className="kinship-years">
                ({personA.birthYear} - {personA.deathYear || (personA.isDeceased ? '?' : 'Nay')})
              </div>
            )}
            <div className="kinship-gender">Giới tính: {personA.gender === 'female' ? 'Nữ' : 'Nam'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KinshipModal;
