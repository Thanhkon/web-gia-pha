import React, { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import avatarMale from '../../assets/avatar-male.svg';
import avatarFemale from '../../assets/avatar-female.svg';

const FamilyNodeCard = ({ person, onAddChild, onAddSpouse, id, onViewDetails }) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div id={id} className={`node-card ${person.gender} ${person.isInLaw ? 'in-law' : ''} ${person.isDeleted ? 'node-deleted' : ''}`} onClick={() => onViewDetails && onViewDetails(person)}>

      {/* Nút Thêm Mới Góc Thẻ */}
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
      <img
        src={person.imageUrl || (person.gender === 'male' ? avatarMale : avatarFemale)}
        alt={person.fullName}
        className="node-avatar"
      />
      <div className="node-name">{person.fullName}</div>
      <div className="node-dates">
        {person.birthYear || (person.birthDate && person.birthDate.split('-')[0]) || '?'}
        {person.isDeceased ? ` - ${person.deathYear || (person.deathDate && person.deathDate.split('-')[0]) || '?'}` : ''}
      </div>
      <div className="node-badges">
        <span className="badge">Đời {person.generation}</span>
        {person.role && <span className="badge primary">{person.role}</span>}
      </div>
    </div>
  );
};

export default FamilyNodeCard;
