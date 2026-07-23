import React, { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import avatarMale from '../../assets/avatar-male.svg';
import avatarFemale from '../../assets/avatar-female.svg';

const FamilyNodeCard = ({ person, onAddChild, onAddSpouse, id, onViewDetails, isKinshipMode, kinshipNodeA, kinshipNodeB }) => {
  const [showMenu, setShowMenu] = useState(false);
  const isSelectedA = isKinshipMode && kinshipNodeA?.id === person.id;
  const isSelectedB = isKinshipMode && kinshipNodeB?.id === person.id;

  return (
    <div 
      id={id} 
      className={`node-card ${person.gender} ${person.isInLaw ? 'in-law' : ''} ${person.isDeceased ? 'node-deceased' : ''} ${person.isDeleted ? 'node-deleted' : ''} ${isSelectedA ? 'kinship-selected' : ''} ${isSelectedB ? 'kinship-target' : ''} ${isKinshipMode ? 'kinship-mode-hover' : ''}`} 
      onClick={() => onViewDetails && onViewDetails(person)}
    >

      {/* Nút Thêm Mới Góc Thẻ (ẩn trong chế độ kinship) */}
      {!isKinshipMode && (
        <div className="node-add-btn-wrapper" onMouseLeave={() => setShowMenu(false)} onClick={e => e.stopPropagation()}>
          <button className="node-add-btn" onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}>
            <PlusCircle size={16} />
          </button>
          {showMenu && (
            <div className="node-add-menu">
              <button onClick={() => { setShowMenu(false); onAddSpouse(person); }}>Thêm Vợ/Chồng</button>
              <button onClick={() => { setShowMenu(false); onAddChild(person); }}>Thêm Con cái</button>
            </div>
          )}
        </div>
      )}
      <img
        src={person.avatarUrl || (person.gender === 'male' ? avatarMale : avatarFemale)}
        alt={person.fullName}
        className="node-avatar"
      />
      <div className="node-name">{person.fullName}</div>
      <div className="node-dates">
        {person.birthYear || (person.dateOfBirth && new Date(person.dateOfBirth).getFullYear()) || '?'}
        {person.isDeceased ? ` - ${person.deathYear || (person.dateOfDeath && new Date(person.dateOfDeath).getFullYear()) || '?'}` : ''}
      </div>
      <div className="node-badges">
        <span className="badge">Đời {person.generation}</span>
        {person.role && <span className="badge primary">{person.role}</span>}
      </div>
    </div>
  );
};

export default FamilyNodeCard;
