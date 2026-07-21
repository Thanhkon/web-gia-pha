import React, { useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as XLSX from 'xlsx';
import MemberForm from '../../components/Admin/MemberForm/MemberForm';
import MemberProfileModal from '../../components/MemberProfileModal';
import MembersFilterBar from '../../components/Admin/MembersFilterBar';
import MembersTable from '../../components/Admin/MembersTable';
import Pagination from '../../components/Pagination';
import ConfirmModal from '../../components/common/ConfirmModal';
import { addMember, updateMember, deleteMember, addRelationship, addMembersBulk } from '../../store/slices/membersSlice';
import useDebounce from '../../hooks/useDebounce';
import '../../css/pages/AdminMembers.css';

const AdminMembers = () => {
  const dispatch = useDispatch();
  const persons = useSelector(state => state.members.persons);
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
    generation: 1, birthOrder: 1, branch: '', isInLaw: false, 
    fatherId: '', motherId: '', spouseId: '',
    birthDate: '', 
    isDeceased: false, deathDate: '', deathLunarDate: '',
    birthPlace: '', address: '', 
    education: '', occupation: '', biography: '', notes: ''
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

  const handleAddSubmit = (submittedData) => {
    if (editingId) {
      dispatch(updateMember({ ...submittedData }));
    } else {
      const newId = Date.now().toString();
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
    }
    
    setIsModalOpen(false);
    setEditingId(null);
    setNewMember(emptyMember);
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

  const confirmDelete = (isHardDelete) => {
    if (deleteConfirm.id) {
      dispatch(deleteMember({ id: deleteConfirm.id, hardDelete: isHardDelete }));
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
            birthDate: row.NgaySinh ? String(row.NgaySinh) : '',
            deathDate: row.NgayMat ? String(row.NgayMat) : '',
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

        dispatch(addMembersBulk({ newPersons, newRelationships }));
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
