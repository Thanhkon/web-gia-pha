import React, { useState, useMemo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import MemberForm from '../../components/Admin/MemberForm/MemberForm';
import MemberProfileModal from '../../components/MemberProfileModal';
import MembersFilterBar from '../../components/Admin/MembersFilterBar';
import MembersTable from '../../components/Admin/MembersTable';
import Pagination from '../../components/Pagination';
import ConfirmModal from '../../components/common/ConfirmModal';
import { 
  fetchFamilyTree,
  addMemberToFamily,
  addParentChildRelation,
  addMarriageRelation,
  updateMemberToFamily,
  deleteMemberFromFamily,
  softDeleteMember
} from '../../store/slices/membersSlice';
import useDebounce from '../../hooks/useDebounce';
import { useFamily } from '../../hooks/useFamily';
import '../../css/pages/AdminMembers.css';

const AdminMembers = () => {
  const familyId = useFamily();
  const dispatch = useDispatch();

  useEffect(() => {
    if (familyId) {
      dispatch(fetchFamilyTree(familyId));
    }
  }, [dispatch, familyId]);

  const persons = useSelector(state => state.members.persons.filter(p => !p.isDeleted));
  const relationships = useSelector(state => state.members.relationships);
  
  const [viewMode, setViewMode] = useState('table');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [filterGeneration, setFilterGeneration] = useState('');
  const [filterGender, setFilterGender] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewingMember, setViewingMember] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const emptyMember = {
    fullName: '', otherName: '', gender: 'male', 
    generation: 1, role: '', isInLaw: false, 
    fatherId: '', motherId: '', spouseId: '',
    dateOfBirth: '', 
    isDeceased: false, dateOfDeath: '', deathLunarDate: '',
    placeOfBirth: '', currentAddress: '', 
    education: '', occupation: '', biography: '', note: '',
    avatarUrl: ''
  };

  const [newMember, setNewMember] = useState(emptyMember);

  // Debounce 300ms để tránh filter chạy mỗi keystroke
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, filterGeneration, filterGender]);

  const filteredPersons = useMemo(() => {
    return persons.filter(p => {
      const matchName = p.fullName.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchGen = filterGeneration ? p.generation.toString() === filterGeneration : true;
      const matchGender = filterGender ? p.gender === filterGender : true;
      return matchName && matchGen && matchGender;
    });
  }, [persons, debouncedSearch, filterGeneration, filterGender]);

  const totalPages = Math.ceil(filteredPersons.length / itemsPerPage);
  const paginatedPersons = filteredPersons.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleAddSubmit = async (submittedData) => {
    try {
      if (editingId) {
        await dispatch(updateMemberToFamily({ 
          memberId: editingId, 
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

        // Frontend patch: Thêm quan hệ cha mẹ/vợ chồng nếu có thay đổi (chỉ thêm mới vì backend không có API xoá)
        const currentParents = relationships
          .filter(r => r.type === 'biological_child' && r.person_b === editingId)
          .map(r => r.person_a);
        
        if (submittedData.fatherId && !currentParents.includes(submittedData.fatherId)) {
          try { await dispatch(addParentChildRelation({ parentId: submittedData.fatherId, childId: editingId, relationType: 'biological_child' })).unwrap(); } catch(e) { console.error(e); }
        }
        if (submittedData.motherId && !currentParents.includes(submittedData.motherId)) {
          try { await dispatch(addParentChildRelation({ parentId: submittedData.motherId, childId: editingId, relationType: 'biological_child' })).unwrap(); } catch(e) { console.error(e); }
        }
        
        const currentSpouses = relationships
          .filter(r => r.type === 'marriage' && (r.person_a === editingId || r.person_b === editingId))
          .flatMap(r => [r.person_a, r.person_b])
          .filter(id => id !== editingId);

        if (submittedData.spouseId && !currentSpouses.includes(submittedData.spouseId)) {
          try { await dispatch(addMarriageRelation({ memberAId: submittedData.spouseId, memberBId: editingId })).unwrap(); } catch(e) { console.error(e); }
        }

        toast.success('Cập nhật thành công!');
      } else {
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
        
        if (submittedData.fatherId) {
          await dispatch(addParentChildRelation({ parentId: submittedData.fatherId, childId: newId, relationType: 'biological_child' })).unwrap();
        }
        if (submittedData.motherId) {
          await dispatch(addParentChildRelation({ parentId: submittedData.motherId, childId: newId, relationType: 'biological_child' })).unwrap();
        }
        if (submittedData.spouseId) {
          await dispatch(addMarriageRelation({ memberAId: submittedData.spouseId, memberBId: newId })).unwrap();
        }
      }
      
      setIsModalOpen(false);
      setEditingId(null);
      setNewMember(emptyMember);
    } catch (err) {
      console.error('Lỗi khi thêm:', err);
      toast.error('Có lỗi xảy ra!');
    }
  };

  const openAddModal = () => {
    setNewMember(emptyMember);
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleEdit = (person) => {
    // Tìm cha mẹ từ relationships
    const personParents = relationships
      .filter(r => r.type === 'biological_child' && r.person_b === person.id)
      .map(r => r.person_a);

    let fatherId = '';
    let motherId = '';

    if (personParents.length > 0) {
      personParents.forEach(parentId => {
        const parent = persons.find(p => p.id === parentId);
        if (parent) {
          if (parent.gender === 'male') fatherId = parent.id;
          else motherId = parent.id;
        }
      });
    }

    // Tìm vợ/chồng từ relationships
    const marriage = relationships.find(r => r.type === 'marriage' && (r.person_a === person.id || r.person_b === person.id));
    let spouseId = '';
    if (marriage) {
      spouseId = marriage.person_a === person.id ? marriage.person_b : marriage.person_a;
    }

    setNewMember({ 
      ...emptyMember, // để đảm bảo có đủ các trường rỗng mặc định
      ...person,
      fatherId,
      motherId,
      spouseId
    });
    setEditingId(person.id);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    setDeleteConfirm({ isOpen: true, id });
  };

  const confirmDelete = async (isHardDelete) => {
    if (deleteConfirm.id) {
      try {
        if (isHardDelete) {
          await dispatch(deleteMemberFromFamily(deleteConfirm.id)).unwrap();
          toast.success('Xóa vĩnh viễn thành công!');
        } else {
          await dispatch(softDeleteMember(deleteConfirm.id)).unwrap();
          toast.success('Đã chuyển thành viên vào thùng rác (Xóa tạm)!');
        }
      } catch (err) {
        console.error('Lỗi khi xóa:', err);
        toast.error('Có lỗi xảy ra khi xóa!');
      }
    }
    setDeleteConfirm({ isOpen: false, id: null });
  };

  const handleImportExcel = (e) => {
    toast.error('Chức năng Import file hàng loạt đang được nâng cấp ở phía Backend. Vui lòng thử lại sau!');
    e.target.value = null; 
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      {
        ID: '1', HoTen: 'Nguyễn Văn A', GioiTinh: 'Nam', DoiThu: 1,
        LaDauRe: 0, NgaySinh: '01/01/1950', NgayMat: '', ConSong: 1,
        MaCha: '', MaMe: '', MaVoChong: ''
      },
      {
        ID: '2', HoTen: 'Lê Thị B', GioiTinh: 'Nữ', DoiThu: 1,
        LaDauRe: 1, NgaySinh: '02/02/1955', NgayMat: '', ConSong: 1,
        MaCha: '', MaMe: '', MaVoChong: '1'
      }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Mau_Gia_Pha");
    XLSX.writeFile(wb, "Mau_Nhap_Gia_Pha.xlsx");
  };

  return (
    <div className="admin-page">
      <MembersFilterBar 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterGender={filterGender}
        setFilterGender={setFilterGender}
        filterGeneration={filterGeneration}
        setFilterGeneration={setFilterGeneration}
        onAddMember={openAddModal}
        onImportExcel={handleImportExcel}
        onDownloadTemplate={handleDownloadTemplate}
        persons={persons}
      />

      <MembersTable 
        filteredPersons={paginatedPersons}
        viewMode={viewMode}
        setViewMode={setViewMode}
        setViewingMember={setViewingMember}
        handleEdit={handleEdit}
        handleDelete={handleDelete}
      />
      
      <Pagination 
        currentPage={currentPage} 
        totalPages={totalPages} 
        onPageChange={setCurrentPage} 
      />

      {isModalOpen && (
        <MemberForm 
          initialData={newMember} 
          persons={persons}
          relationships={relationships}
          isEditing={!!editingId}
          onSubmit={handleAddSubmit}
          onCancel={() => setIsModalOpen(false)}
        />
      )}

      {viewingMember && (
        <MemberProfileModal
          member={viewingMember}
          persons={persons}
          relationships={relationships}
          onClose={() => setViewingMember(null)}
          onEdit={(member) => handleEdit(member)}
        />
      )}

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="Xóa thành viên"
        message="Bạn có chắc chắn muốn xóa thành viên này? Bạn có thể Xóa tạm (ẩn đi) hoặc Xóa vĩnh viễn khỏi hệ thống."
        onConfirm={() => confirmDelete(true)}
        confirmText="Xóa vĩnh viễn"
        onSecondaryConfirm={() => confirmDelete(false)}
        secondaryText="Xóa tạm (An toàn)"
        onCancel={() => setDeleteConfirm({ isOpen: false, id: null })}
        isDanger={true}
      />
    </div>
  );
};

export default AdminMembers;
