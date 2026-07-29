import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useSelector, useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { useFamily } from '../hooks/useFamily';
import { usePanZoom } from '../hooks/usePanZoom';
import MemberForm from '../components/Admin/MemberForm/MemberForm';
import { 
  fetchFamilyTree, 
  addMemberToFamily, 
  addParentChildRelation, 
  addMarriageRelation,
  selectFamilyTreeGraphData
} from '../store/slices/membersSlice';
import { buildAdjacencyLists } from '../utils/familyTreeUtils';
import TreeToolbar from '../components/FamilyTree/TreeToolbar';
import TreeGraph from '../components/FamilyTree/TreeGraph';
import MemberProfileModal from '../components/MemberProfileModal';
import KinshipModal from '../components/FamilyTree/KinshipModal';
import FeatureState from '../components/common/FeatureState';
import { getTreeData } from '../utils/familyTreeUtils';
import { computeKinship } from '../utils/kinshipHelpers';
import '../css/pages/FamilyTree.css';

// Hằng số ngoài component — không bao giờ bị tạo lại, tránh stale closure trong useCallback
const EMPTY_MEMBER = {
  fullName: '', otherName: '', gender: 'male',
  generation: 1, role: '', isInLaw: false,
  fatherId: '', motherId: '', spouseId: '',
  dateOfBirth: '',
  isDeceased: false, dateOfDeath: '', deathLunarDate: '',
  placeOfBirth: '', currentAddress: '',
  education: '', occupation: '', biography: '', note: '',
  avatarUrl: ''
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


  const familyId = useFamily();
  const dispatch = useDispatch();
  const persons = useSelector(state => state.members.persons);
  const relationships = useSelector(state => state.members.relationships);
  const loading = useSelector(state => state.members.loading);
  const error = useSelector(state => state.members.error);
  const familyInfo = useSelector(state => state.members.familyInfo);
  
  // Mặc định gọi ID từ params

  useEffect(() => {
    if (familyId) {
      dispatch(fetchFamilyTree(familyId));
    }
  }, [dispatch, familyId]);

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
    try {
      // Gọi API thêm member
      const newMember = await dispatch(addMemberToFamily({
        familyId: familyId,
        memberData: {
          fullName: submittedData.fullName,
          otherName: submittedData.otherName,
          gender: submittedData.gender,
          generation: submittedData.generation,
          role: submittedData.role || null,
          isInLaw: submittedData.isInLaw || false,
          dateOfBirth: submittedData.dateOfBirth || null,
          isDeceased: submittedData.isDeceased || false,
          dateOfDeath: submittedData.dateOfDeath || null,
          placeOfBirth: submittedData.placeOfBirth || null,
          currentAddress: submittedData.currentAddress || null,
          education: submittedData.education || null,
          occupation: submittedData.occupation || null,
          biography: submittedData.biography || null,
          note: submittedData.note || null,
          avatarUrl: submittedData.avatarUrl || null,
        }
      })).unwrap();

      const newId = newMember.id;

      // Xử lý quan hệ
      if (submittedData.fatherId) {
        await dispatch(addParentChildRelation({
          parentId: submittedData.fatherId,
          childId: newId,
          relationType: 'biological_child'
        })).unwrap();
      }
      if (submittedData.motherId) {
        await dispatch(addParentChildRelation({
          parentId: submittedData.motherId,
          childId: newId,
          relationType: 'biological_child'
        })).unwrap();
      }
      if (submittedData.spouseId) {
        await dispatch(addMarriageRelation({
          memberAId: submittedData.spouseId,
          memberBId: newId
        })).unwrap();
      }

      setIsModalOpen(false);
      setNewMember(EMPTY_MEMBER);
      toast.success('Thêm thành viên thành công!');
    } catch (err) {
      console.error('Lỗi khi thêm thành viên:', err);
      toast.error('Có lỗi xảy ra khi thêm thành viên!');
    }
  }, [dispatch, familyId]);

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

  // Tính toán dữ liệu đồ thị — lấy từ Redux selector (đã được memoize)
  const { personsMap, adj, roots } = useSelector(selectFamilyTreeGraphData);

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
    if (!loading && !error && roots.length > 0) {
      const timer = setTimeout(centerTree, 100);
      return () => clearTimeout(timer);
    }
  }, [centerTree, loading, error, roots.length]);

  let status = 'success';
  if (loading) status = 'loading';
  else if (error) status = 'error';
  else if (roots.length === 0) status = 'empty';

  if (status !== 'success') {
    return (
      <FeatureState 
        status={status} 
        error={error} 
        emptyMessage="Chưa có dữ liệu gia phả. Hãy thêm thành viên đầu tiên trong trang Quản trị."
        onRetry={() => dispatch(fetchFamilyTree(familyId))}
      />
    );
  }

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
