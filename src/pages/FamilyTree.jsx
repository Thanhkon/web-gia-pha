import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { usePanZoom } from '../hooks/usePanZoom';
import MemberForm from '../components/Admin/MemberForm/MemberForm';
import { addMember, addRelationship } from '../store/slices/membersSlice';
import { buildAdjacencyLists } from '../utils/familyTreeUtils';
import TreeToolbar from '../components/FamilyTree/TreeToolbar';
import TreeGraph from '../components/FamilyTree/TreeGraph';
import MemberProfileModal from '../components/MemberProfileModal';
import { getTreeData } from '../utils/familyTreeUtils';
import '../css/pages/FamilyTree.css';

// Hằng số ngoài component — không bao giờ bị tạo lại, tránh stale closure trong useCallback
const EMPTY_MEMBER = {
  fullName: '', otherName: '', gender: 'male',
  generation: 1, branch: '', isInLaw: false,
  fatherId: '', motherId: '', spouseId: '',
  birthDate: '',
  isDeceased: false, deathDate: '', deathLunarDate: '',
  birthPlace: '', address: '',
  education: '', occupation: '', biography: '', notes: ''
};

const FamilyTree = () => {
  const containerRef = useRef(null);

  const dispatch = useDispatch();
  const persons = useSelector(state => state.members.persons);
  const relationships = useSelector(state => state.members.relationships);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newMember, setNewMember] = useState(EMPTY_MEMBER);
  const [viewingMember, setViewingMember] = useState(null);

  const onAddChild = useCallback((person) => {
    setNewMember({
      ...EMPTY_MEMBER,
      [person.gender === 'male' ? 'fatherId' : 'motherId']: person.id,
      generation: Number(person.generation) + 1
    });
    setIsModalOpen(true);
  }, []); // dep rỗng vì EMPTY_MEMBER là hằng số ổn định

  const onAddSpouse = useCallback((person) => {
    setNewMember({
      ...EMPTY_MEMBER,
      gender: person.gender === 'male' ? 'female' : 'male',
      spouseId: person.id,
      isInLaw: true,
      generation: Number(person.generation)
    });
    setIsModalOpen(true);
  }, []);

  const onViewDetails = useCallback((person) => {
    setViewingMember(person);
  }, []);

  const handleAddSubmit = useCallback(async (submittedData) => {
    return new Promise(resolve => {
      setTimeout(() => {
        const newId = crypto.randomUUID();
        dispatch(addMember({ ...submittedData, id: newId }));

        if (submittedData.fatherId) {
          dispatch(addRelationship({ type: 'biological_child', person_a: submittedData.fatherId, person_b: newId }));
        }
        if (submittedData.motherId) {
          dispatch(addRelationship({ type: 'biological_child', person_a: submittedData.motherId, person_b: newId }));
        }
        if (submittedData.spouseId) {
          dispatch(addRelationship({ type: 'marriage', person_a: submittedData.spouseId, person_b: newId }));
        }

        setIsModalOpen(false);
        setNewMember(EMPTY_MEMBER);
        resolve();
      }, 300);
    });
  }, [dispatch]);

  const {
    scale, position, isDragging,
    onMouseDown, onMouseMove, onMouseUp, onMouseLeave, onWheel,
    resetView, zoomIn, zoomOut
  } = usePanZoom(0.85);

  const centerTree = useCallback(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
    resetView();
  }, [resetView]);

  const [filters, setFilters] = useState({
    hideDaughtersInLaw: false,
    hideSonsInLaw: false,
    hideDaughters: false,
    hideSons: false,
    groupChildrenBySpouse: false,
  });

  // Tính toán dữ liệu đồ thị — chỉ tính lại khi persons/relationships thay đổi
  const { personsMap, adj, roots } = useMemo(() => {
    const pMap = new Map();
    const currentPersons = persons.filter(p => !p.isDeleted);
    currentPersons.forEach(p => pMap.set(p.id, p));

    const adjacency = buildAdjacencyLists(relationships, pMap);

    const rootNodes = currentPersons.filter(p => {
      const parents = adjacency[p.id]?.parents || [];
      return parents.length === 0 && !p.isInLaw;
    });

    return { personsMap: pMap, adj: adjacency, roots: rootNodes };
  }, [persons, relationships]);

  // personsArray để truyền vào MemberForm — tránh Object.values() mỗi render
  const personsArray = useMemo(() => Array.from(personsMap.values()), [personsMap]);

  // Căn giữa lần đầu render
  useEffect(() => {
    const timer = setTimeout(centerTree, 100);
    return () => clearTimeout(timer);
  }, [centerTree]);

  if (roots.length === 0) return (
    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
      Chưa có dữ liệu gia phả. Hãy thêm thành viên đầu tiên trong trang Quản trị.
    </div>
  );

  return (
    <div className="tree-page">
      <TreeToolbar
        filters={filters}
        setFilters={setFilters}
        zoomIn={zoomIn}
        zoomOut={zoomOut}
        centerTree={centerTree}
      />

      <div
        className={`tree-container ${isDragging ? 'dragging' : ''}`}
        ref={containerRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
        onWheel={onWheel}
      >
        <div
          className="tree-canvas"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`
          }}
        >
          <TreeGraph
            roots={roots}
            personsMap={personsMap}
            adj={adj}
            filters={filters}
            onAddChild={onAddChild}
            onAddSpouse={onAddSpouse}
            onViewDetails={onViewDetails}
          />
        </div>
      </div>

      {isModalOpen && (
        <MemberForm
          initialData={newMember}
          persons={personsArray}
          relationships={relationships}
          isEditing={false}
          onSubmit={handleAddSubmit}
          onCancel={() => setIsModalOpen(false)}
        />
      )}

      {viewingMember && (
        <MemberProfileModal
          member={viewingMember}
          onClose={() => setViewingMember(null)}
        />
      )}
    </div>
  );
};

export default FamilyTree;
