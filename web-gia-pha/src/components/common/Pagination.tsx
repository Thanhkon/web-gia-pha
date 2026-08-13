import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import '../../css/components/Pagination.css';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="pagination-container">
      <button
        className="pagination-btn"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <ChevronLeft size={18} />
      </button>

      <span className="pagination-info">
        Trang {currentPage} / {totalPages}
      </span>

      <button
        className="pagination-btn"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
};

export default Pagination;
