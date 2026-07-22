import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { usePanZoom } from '../hooks/usePanZoom';
import MemberForm from '../components/Admin/MemberForm/MemberForm';
import { addMember, addRelationship } from '../store/slices/membersSlice';
import { buildAdjacencyLists } from '../utils/familyTreeUtils';
import TreeToolbar from '../components/FamilyTree/TreeToolbar';
import TreeGraph from '../components/FamilyTree/TreeGraph';
import MemberProfileModal from '../components/MemberProfileModal';
import KinshipModal from '../components/FamilyTree/KinshipModal';
import { getTreeData } from '../utils/familyTreeUtils';
import { computeKinship } from '../utils/kinshipHelpers';
import '../css/pages/FamilyTree.css';

// Hằng số ngoài component — không bao giờ bị tạo lại, tránh stale closure trong useCallback
const EMPTY_MEMBER = {
  fullName: '', otherName: '', gender: 'male',
  generation: 1, birthOrder: 1, branch: '', isInLaw: false,
  fatherId: '', motherId: '', spouseId: '',
  birthDate: '',
  isDeceased: false, deathDate: '', deathLunarDate: '',
  birthPlace: '', address: '',
  education: '', occupation: '', biography: '', notes: ''
};

const FamilyTree = () => {
  const containerRef = useRef(null);

  // Ngăn chặn cuộn trang mặc định (vì onWheel của React bị giới hạn passive event)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const preventScroll = (e) => e.preventDefault();
    el.addEventListener('wheel', preventScroll, { passive: false });
    return () => el.removeEventListener('wheel', preventScroll);
  }, []);


  const dispatch = useDispatch();
  const persons = useSelector(state => state.members.persons);
  const relationships = useSelector(state => state.members.relationships);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newMember, setNewMember] = useState(EMPTY_MEMBER);
  const [viewingMember, setViewingMember] = useState(null);

  // Tra cứu quan hệ xưng hô
  const [isKinshipMode, setIsKinshipMode] = useState(false);
  const [kinshipNodeA, setKinshipNodeA] = useState(null);
  const [kinshipNodeB, setKinshipNodeB] = useState(null);
  const [kinshipResult, setKinshipResult] = useState(null);
  const [isKinshipModalOpen, setIsKinshipModalOpen] = useState(false);

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
    if (isKinshipMode) {
      if (!kinshipNodeA) {
        setKinshipNodeA(person);
      } else if (!kinshipNodeB && person.id !== kinshipNodeA.id) {
        setKinshipNodeB(person);
      }
      return;
    }
    setViewingMember(person);
  }, [isKinshipMode, kinshipNodeA, kinshipNodeB]);

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
    resetView, zoomIn, zoomOut, updatePosition, updateScale
  } = usePanZoom(0.85);

  const centerTree = useCallback(() => {
    if (!containerRef.current) return;

    const defaultScale = 0.85;
    const width = containerRef.current.clientWidth;

    // Do transform-origin là 0 0, khi scale xuống 0.85, khung vẽ sẽ bị thu nhỏ còn 85% chiều rộng.
    // Khoảng trống hụt đi chia đôi sẽ là phần bù (offset) để đẩy khung vẽ ra chính giữa.
    const centerX = (width - (width * defaultScale)) / 2;

    updateScale(defaultScale);
    updatePosition({ x: centerX, y: 0 });
  }, [updateScale, updatePosition]);

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

  // Tính toán quan hệ khi đã chọn đủ 2 người
  useEffect(() => {
    if (kinshipNodeA && kinshipNodeB) {
      const result = computeKinship(kinshipNodeA, kinshipNodeB, personsArray, relationships);
      setKinshipResult(result);
      setIsKinshipModalOpen(true);
    }
  }, [kinshipNodeA, kinshipNodeB, personsArray, relationships]);

  const handleCloseKinshipModal = () => {
    setIsKinshipModalOpen(false);
    setKinshipNodeA(null);
    setKinshipNodeB(null);
    setKinshipResult(null);
  };

  const handleToggleKinshipMode = () => {
    setIsKinshipMode(prev => !prev);
    if (isKinshipMode) {
      // Khi tắt chế độ tra cứu thì reset trạng thái
      setKinshipNodeA(null);
      setKinshipNodeB(null);
      setKinshipResult(null);
      setIsKinshipModalOpen(false);
    }
  };

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
        isKinshipMode={isKinshipMode}
        onToggleKinshipMode={handleToggleKinshipMode}
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
            isKinshipMode={isKinshipMode}
            kinshipNodeA={kinshipNodeA}
            kinshipNodeB={kinshipNodeB}
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
          persons={personsArray}
          relationships={relationships}
          onClose={() => setViewingMember(null)}
        />
      )}

      <KinshipModal
        isOpen={isKinshipModalOpen}
        onClose={handleCloseKinshipModal}
        kinshipResult={kinshipResult}
        personA={kinshipNodeA}
        personB={kinshipNodeB}
      />
    </div>
  );
};

export default FamilyTree;
