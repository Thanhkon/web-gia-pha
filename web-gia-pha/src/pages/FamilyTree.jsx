import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';

import { useSelector, useDispatch } from 'react-redux';
import { useParams, useLocation } from 'react-router-dom';
import { useFamily } from '../hooks/useFamily';
import { usePanZoom } from '../hooks/usePanZoom';
import MemberForm from '../components/Members/MemberForm/MemberForm';
import {
  fetchFamilyTree,
  addMemberToFamily,
  addParentChildRelation,
  addMarriageRelation,
  selectFamilyTreeGraphData,
  uploadMemberAvatar
} from '../store/slices/membersSlice';
import { buildAdjacencyLists } from '../utils/familyTreeUtils';
import TreeToolbar from '../components/FamilyTree/TreeToolbar';
import TreeGraph from '../components/FamilyTree/TreeGraph';
import MemberProfileModal from '../components/Members/MemberProfileModal';
import KinshipModal from '../components/FamilyTree/KinshipModal';
import MemberStatisticsWidget from '../components/Members/MemberStatisticsWidget';
import { getTreeData } from '../utils/familyTreeUtils';
import FeatureState from '../components/common/FeatureState';
import { buildMemberPayload } from '../utils/memberPayload';
import { useTreeExport } from '../hooks/useTreeExport';
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
  const location = useLocation();
  const isAdminView = location.pathname.includes('/admin');

  // Mặc định gọi ID từ params

  useEffect(() => {
    if (familyId) {
      dispatch(fetchFamilyTree(familyId));
    }
  }, [dispatch, familyId]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newMember, setNewMember] = useState(EMPTY_MEMBER);
  const [viewingMember, setViewingMember] = useState(null);
  const [showStats, setShowStats] = useState(false);

  // Tra cứu quan hệ xưng hô
  const [isKinshipMode, setIsKinshipMode] = useState(false);
  const [kinshipNodeA, setKinshipNodeA] = useState(null);
  const [kinshipNodeB, setKinshipNodeB] = useState(null);
  const [kinshipResult, setKinshipResult] = useState(null);
  const [isKinshipModalOpen, setIsKinshipModalOpen] = useState(false);

  const onAddChild = useCallback((person) => {
    // Tìm người phối ngẫu (spouse) trong mảng relationships
    const marriage = relationships.find(r =>
      r.type === 'marriage' && (r.person_a === person.id || r.person_b === person.id)
    );
    let spouseId = null;
    if (marriage) {
      spouseId = marriage.person_a === person.id ? marriage.person_b : marriage.person_a;
    }

    const initial = {
      ...EMPTY_MEMBER,
      generation: Number(person.generation) + 1
    };

    if (person.gender === 'male') {
      initial.fatherId = person.id;
      if (spouseId) initial.motherId = spouseId;
    } else {
      initial.motherId = person.id;
      if (spouseId) initial.fatherId = spouseId;
    }

    setNewMember(initial);
    setIsModalOpen(true);
  }, [relationships]);

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
        memberData: buildMemberPayload(submittedData)
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

      if (submittedData.avatarFile) {
        try { await dispatch(uploadMemberAvatar({ memberId: newId, file: submittedData.avatarFile })).unwrap(); } catch (e) { console.error('Upload avatar failed', e); }
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
      setKinshipNodeA(null);
      setKinshipNodeB(null);
      setKinshipResult(null);
      setIsKinshipModalOpen(false);
    }
  };

  const { isExporting, handleExportPNG: exportPNG, handleExportPDF: exportPDF } = useTreeExport();

  const filterExportNodes = (node) => {
    if (node.classList && (
      node.classList.contains('toggle-collapse-btn') ||
      node.classList.contains('node-add-btn-wrapper')
    )) {
      return false;
    }
    return true;
  };

  const handleExportPNG = () => exportPNG('exportable-tree-container', filterExportNodes);
  const handleExportPDF = () => exportPDF('exportable-tree-container', filterExportNodes);

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
        onToggleStats={() => setShowStats(!showStats)}
        onExportPNG={handleExportPNG}
        onExportPDF={handleExportPDF}
      />

      {showStats && (
        <MemberStatisticsWidget
          persons={persons}
          onClose={() => setShowStats(false)}
        />
      )}

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
            canEdit={isAdminView}
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
