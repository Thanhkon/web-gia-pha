import { useState, useMemo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { buildMemberPayload } from '../utils/memberPayload';
import {
  fetchFamilyTree,
  addMemberToFamily,
  addParentChildRelation,
  addMarriageRelation,
  updateMemberToFamily,
  deleteMemberFromFamily,
  softDeleteMember,
  uploadMemberAvatar
} from '../store/slices/membersSlice';
import useDebounce from './useDebounce';
import { useFamily } from './useFamily';

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

export const useAdminMembers = () => {
  const familyId = useFamily();
  const dispatch = useDispatch();

  useEffect(() => {
    if (familyId) {
      // @ts-ignore
      dispatch(fetchFamilyTree(familyId));
    }
  }, [dispatch, familyId]);

  // @ts-ignore
  const allPersons = useSelector(state => state.members.persons);
  // @ts-ignore
  const persons = useMemo(() => allPersons.filter((p: any) => !p.isDeleted), [allPersons]);
  // @ts-ignore
  const relationships = useSelector(state => state.members.relationships);

  const [viewMode, setViewMode] = useState('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGeneration, setFilterGeneration] = useState('');
  const [filterGender, setFilterGender] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [viewingMember, setViewingMember] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | number | null }>({ isOpen: false, id: null });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [newMember, setNewMember] = useState(emptyMember);

  const debouncedSearch = useDebounce(searchTerm, 300);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, filterGeneration, filterGender]);

  const filteredPersons = useMemo(() => {
    return persons.filter((p: any) => {
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

  const handleAddSubmit = async (submittedData: any) => {
    try {
      if (editingId) {
        // @ts-ignore
        await dispatch(updateMemberToFamily({
          memberId: editingId,
          memberData: buildMemberPayload(submittedData)
        })).unwrap();

        const currentParents = relationships
          .filter((r: any) => r.type === 'biological_child' && r.person_b === editingId)
          .map((r: any) => r.person_a);

        if (submittedData.fatherId && !currentParents.includes(submittedData.fatherId)) {
          try { 
            // @ts-ignore
            await dispatch(addParentChildRelation({ parentId: submittedData.fatherId, childId: editingId, relationType: 'biological_child' })).unwrap(); 
          } catch (e) { console.error(e); }
        }
        if (submittedData.motherId && !currentParents.includes(submittedData.motherId)) {
          try { 
            // @ts-ignore
            await dispatch(addParentChildRelation({ parentId: submittedData.motherId, childId: editingId, relationType: 'biological_child' })).unwrap(); 
          } catch (e) { console.error(e); }
        }

        const currentSpouses = relationships
          .filter((r: any) => r.type === 'marriage' && (r.person_a === editingId || r.person_b === editingId))
          .flatMap((r: any) => [r.person_a, r.person_b])
          .filter((id: any) => id !== editingId);

        if (submittedData.spouseId && !currentSpouses.includes(submittedData.spouseId)) {
          try { 
            // @ts-ignore
            await dispatch(addMarriageRelation({ memberAId: submittedData.spouseId, memberBId: editingId })).unwrap(); 
          } catch (e) { console.error(e); }
        }

        if (submittedData.avatarFile) {
          try { 
            // @ts-ignore
            await dispatch(uploadMemberAvatar({ memberId: editingId, file: submittedData.avatarFile })).unwrap(); 
          } catch (e) { console.error('Upload avatar failed', e); }
        }

        toast.success('Cập nhật thành công!');
      } else {
        // @ts-ignore
        const addedMember = await dispatch(addMemberToFamily({
          familyId: familyId,
          memberData: buildMemberPayload(submittedData)
        })).unwrap();

        const newId = addedMember.id;

        if (submittedData.fatherId) {
          // @ts-ignore
          await dispatch(addParentChildRelation({ parentId: submittedData.fatherId, childId: newId, relationType: 'biological_child' })).unwrap();
        }
        if (submittedData.motherId) {
          // @ts-ignore
          await dispatch(addParentChildRelation({ parentId: submittedData.motherId, childId: newId, relationType: 'biological_child' })).unwrap();
        }
        if (submittedData.spouseId) {
          // @ts-ignore
          await dispatch(addMarriageRelation({ memberAId: submittedData.spouseId, memberBId: newId })).unwrap();
        }

        if (submittedData.avatarFile) {
          try { 
            // @ts-ignore
            await dispatch(uploadMemberAvatar({ memberId: newId, file: submittedData.avatarFile })).unwrap(); 
          } catch (e) { console.error('Upload avatar failed', e); }
        }
        toast.success('Thêm thành viên thành công!');
      }

      setIsModalOpen(false);
      setEditingId(null);
      setNewMember(emptyMember);
    } catch (err: any) {
      console.error('Lỗi khi lưu:', err);
      toast.error(err?.message || 'Có lỗi xảy ra! Không có quyền truy cập?');
    }
  };

  const openAddModal = () => {
    setNewMember(emptyMember);
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleEdit = (person: any) => {
    const personParents = relationships
      .filter((r: any) => r.type === 'biological_child' && r.person_b === person.id)
      .map((r: any) => r.person_a);

    let fatherId = '';
    let motherId = '';

    if (personParents.length > 0) {
      personParents.forEach((parentId: any) => {
        const parent = persons.find((p: any) => p.id === parentId);
        if (parent) {
          if (parent.gender === 'male') fatherId = parent.id;
          else motherId = parent.id;
        }
      });
    }

    const marriage = relationships.find((r: any) => r.type === 'marriage' && (r.person_a === person.id || r.person_b === person.id));
    let spouseId = '';
    if (marriage) {
      spouseId = marriage.person_a === person.id ? marriage.person_b : marriage.person_a;
    }

    setNewMember({
      ...emptyMember,
      ...person,
      fatherId,
      motherId,
      spouseId
    });
    setEditingId(person.id);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string | number) => {
    setDeleteConfirm({ isOpen: true, id });
  };

  const confirmDelete = async (isHardDelete: boolean) => {
    if (deleteConfirm.id) {
      try {
        if (isHardDelete) {
          // @ts-ignore
          await dispatch(deleteMemberFromFamily(deleteConfirm.id)).unwrap();
          toast.success('Xóa vĩnh viễn thành công!');
        } else {
          // @ts-ignore
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

  const handleImportExcel = (e: any) => {
    toast.error('Chức năng Import file hàng loạt đang được nâng cấp ở phía Backend. Vui lòng thử lại sau!');
    e.target.value = null;
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      {
        "Mã (ID)": '1',
        "Họ và tên": 'Nguyễn Văn A',
        "Tên gọi khác": '',
        "Giới tính": 'Nam',
        "Đời thứ": 1,
        "Vai trò": 'Trưởng họ',
        "Dâu/Rể": 0,
        "Mã Cha": '',
        "Mã Mẹ": '',
        "Mã Vợ/Chồng": '',
        "Ngày sinh": '01/01/1950',
        "Nơi sinh": 'Hà Nội',
        "Ngày mất": '',
        "Ngày mất (Âm lịch)": '',
        "Còn sống": 1,
        "Nghề nghiệp": 'Giáo viên',
        "Trình độ": 'Đại học',
        "Địa chỉ hiện tại": 'Hà Nội',
        "Tiểu sử": '',
        "Ghi chú": ''
      }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Mau_Nhap_Gia_Pha");
    XLSX.writeFile(wb, "Mau_Nhap_Gia_Pha.xlsx");
  };

  const handleExportExcel = () => {
    if (!persons || persons.length === 0) {
      toast('Không có dữ liệu để xuất!', { icon: '⚠️' });
      return;
    }
    
    const exportData = persons.map((p: any) => {
      const personParents = relationships
        .filter((r: any) => r.type === 'biological_child' && r.person_b === p.id)
        .map((r: any) => r.person_a);
      let fatherId = '';
      let motherId = '';
      personParents.forEach((parentId: any) => {
        const parent = persons.find((x: any) => x.id === parentId);
        if (parent) {
          if (parent.gender === 'male') fatherId = parent.id;
          else motherId = parent.id;
        }
      });
      const marriage = relationships.find((r: any) => r.type === 'marriage' && (r.person_a === p.id || r.person_b === p.id));
      let spouseId = '';
      if (marriage) {
        spouseId = marriage.person_a === p.id ? marriage.person_b : marriage.person_a;
      }
      
      return {
        "Mã (ID)": p.id,
        "Họ và tên": p.fullName || '',
        "Tên gọi khác": p.otherName || '',
        "Giới tính": p.gender === 'male' ? 'Nam' : (p.gender === 'female' ? 'Nữ' : ''),
        "Đời thứ": p.generation || 1,
        "Vai trò": p.role || '',
        "Dâu/Rể": p.isInLaw ? 1 : 0,
        "Mã Cha": fatherId,
        "Mã Mẹ": motherId,
        "Mã Vợ/Chồng": spouseId,
        "Ngày sinh": p.dateOfBirth || '',
        "Nơi sinh": p.placeOfBirth || '',
        "Ngày mất": p.dateOfDeath || '',
        "Ngày mất (Âm lịch)": p.deathLunarDate || '',
        "Còn sống": p.isDeceased ? 0 : 1,
        "Nghề nghiệp": p.occupation || '',
        "Trình độ": p.education || '',
        "Địa chỉ hiện tại": p.currentAddress || '',
        "Tiểu sử": p.biography || '',
        "Ghi chú": p.note || ''
      };
    });
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Danh_Sach_Thanh_Vien");
    XLSX.writeFile(wb, "Danh_Sach_Thanh_Vien.xlsx");
    toast.success('Xuất dữ liệu thành công!');
  };

  const refreshMembers = () => {
    if (familyId) {
      // @ts-ignore
      dispatch(fetchFamilyTree(familyId));
    }
  };

  return {
    state: {
      persons,
      relationships,
      viewMode,
      searchTerm,
      filterGeneration,
      filterGender,
      isModalOpen,
      editingId,
      viewingMember,
      deleteConfirm,
      currentPage,
      newMember,
      paginatedPersons,
      totalPages
    },
    actions: {
      setViewMode,
      setSearchTerm,
      setFilterGeneration,
      setFilterGender,
      setIsModalOpen,
      setViewingMember,
      setDeleteConfirm,
      setCurrentPage,
      handleAddSubmit,
      openAddModal,
      handleEdit,
      handleDelete,
      confirmDelete,
      handleImportExcel,
      handleDownloadTemplate,
      handleExportExcel,
      refreshMembers
    }
  };
};
