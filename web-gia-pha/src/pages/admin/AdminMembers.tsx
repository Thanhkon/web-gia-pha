import MemberForm from '../../components/Members/MemberForm/MemberForm';
import MemberProfileModal from '../../components/Members/MemberProfileModal';
import MembersFilterBar from '../../components/Members/MembersFilterBar';
import MembersTable from '../../components/Members/MembersTable';
import Pagination from '../../components/common/Pagination';
import ConfirmModal from '../../components/common/ConfirmModal';
import { useAdminMembers } from '../../hooks/useAdminMembers';
import '../../css/pages/AdminMembers.css';

const AdminMembers = () => {
  const { state, actions } = useAdminMembers();
  
  const {
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
  } = state;

  const {
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
    handleExportExcel
  } = actions;

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
        onExportExcel={handleExportExcel}
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
          onEdit={(member: any) => handleEdit(member)}
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
