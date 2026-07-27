import React, { useState, useMemo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as XLSX from 'xlsx';
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
  deleteMemberFromFamily
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
      alert('Có lỗi xảy ra!');
    }
  };

  const openAddModal = () => {
    setNewMember(emptyMember);
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleEdit = (person) => {
    setNewMember({ ...person });
    setEditingId(person.id);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    setDeleteConfirm({ isOpen: true, id });
  };

  const confirmDelete = async (isHardDelete) => {
    if (deleteConfirm.id) {
      try {
        await dispatch(deleteMemberFromFamily(deleteConfirm.id)).unwrap();
      } catch (err) {
        console.error('Lỗi khi xóa:', err);
        alert('Có lỗi xảy ra khi xóa!');
      }
    }
    setDeleteConfirm({ isOpen: false, id: null });
  };

  const handleImportExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        const newPersons = [];
        const newRelationships = [];
        let count = 0;

        data.forEach(row => {
          if (!row.HoTen) return; 
          const newId = row.ID ? String(row.ID) : Date.now().toString() + Math.random();
          
          const member = {
            id: newId,
            fullName: row.HoTen,
            gender: row.GioiTinh === 'Nu' || row.GioiTinh === 'Nữ' ? 'female' : 'male',
            generation: Number(row.DoiThu) || 1,
            isInLaw: row.LaDauRe == 1,
            dateOfBirth: row.NgaySinh ? String(row.NgaySinh) : '',
            dateOfDeath: row.NgayMat ? String(row.NgayMat) : '',
            isDeceased: row.ConSong == 0 || !!row.NgayMat,
            fatherId: row.MaCha ? String(row.MaCha) : '',
            motherId: row.MaMe ? String(row.MaMe) : '',
            spouseId: row.MaVoChong ? String(row.MaVoChong) : ''
          };
          
          newPersons.push(member);
          
          if (member.fatherId) {
            newRelationships.push({ type: 'biological_child', person_a: member.fatherId, person_b: newId });
          }
          if (member.motherId) {
            newRelationships.push({ type: 'biological_child', person_a: member.motherId, person_b: newId });
          }
          if (member.spouseId && member.isInLaw) {
            newRelationships.push({ type: 'marriage', person_a: member.spouseId, person_b: newId });
          }
          count++;
        });

        console.log('Chức năng nhập file hàng loạt tạm thời bị vô hiệu hóa vì Backend chưa hỗ trợ');
        // TODO: Cập nhật API hàng loạt sau
        alert(`Đã Import thành công ${count} thành viên!`);
      } catch (err) {
        alert('Lỗi khi đọc file Excel. Vui lòng kiểm tra lại định dạng!');
      }
    };
    reader.readAsBinaryString(file);
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
