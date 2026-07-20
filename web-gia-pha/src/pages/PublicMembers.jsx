import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import MemberProfileModal from '../components/MemberProfileModal';
import MembersFilterBar from '../components/Admin/MembersFilterBar';
import MembersTable from '../components/Admin/MembersTable';
import Pagination from '../components/Pagination';
import useDebounce from '../hooks/useDebounce';
import '../css/pages/AdminMembers.css';
import '../css/pages/PublicMembers.css';

const PublicMembers = () => {
  const persons = useSelector(state => state.members.persons.filter(p => !p.isDeleted));
  
  const [viewMode, setViewMode] = useState('table');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [filterGeneration, setFilterGeneration] = useState('');
  const [filterGender, setFilterGender] = useState('');

  const [viewingMember, setViewingMember] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  return (
    <div className="admin-page animate-fade-in public-members-page">
      <header className="public-members-header">
        <h1 className="public-members-title">Danh sách Thành viên Gia tộc</h1>
        <p className="admin-page-subtitle">Tìm kiếm và xem thông tin chi tiết về các thành viên trong dòng họ.</p>
      </header>

      <MembersFilterBar 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterGender={filterGender}
        setFilterGender={setFilterGender}
        filterGeneration={filterGeneration}
        setFilterGeneration={setFilterGeneration}
        persons={persons}
        // No add/import/export for public view
      />

      <MembersTable 
        filteredPersons={paginatedPersons}
        viewMode={viewMode}
        setViewMode={setViewMode}
        setViewingMember={setViewingMember}
      />

      <Pagination 
        currentPage={currentPage} 
        totalPages={totalPages} 
        onPageChange={setCurrentPage} 
      />

      {viewingMember && (
        <MemberProfileModal 
          person={viewingMember} 
          persons={persons} 
          onClose={() => setViewingMember(null)} 
        />
      )}
    </div>
  );
};

export default PublicMembers;
