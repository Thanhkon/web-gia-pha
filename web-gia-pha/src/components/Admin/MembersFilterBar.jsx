import React, { useRef } from 'react';
import { Search, Filter, Plus, Upload, HelpCircle, Download } from 'lucide-react';

const MembersFilterBar = ({
  searchTerm,
  setSearchTerm,
  filterGender,
  setFilterGender,
  filterGeneration,
  setFilterGeneration,
  onAddMember,
  onImportExcel,
  onDownloadTemplate,
  persons = [], // Cần để tính số đời tối đa động
  hideHeader = false
}) => {
  const fileInputRef = useRef(null);

  // Tính số đời tối đa từ dữ liệu thực tế, thay vì hard-code
  const maxGeneration = persons.length > 0
    ? Math.max(...persons.map(p => p.generation || 1))
    : 4;

  return (
    <>
      {!hideHeader && (
        <header className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Quản lý Thành viên</h1>
          <p className="admin-page-subtitle">Xem, thêm mới và chỉnh sửa hồ sơ thành viên trong Gia phả.</p>
        </div>
        {(onImportExcel || onDownloadTemplate || onAddMember) && (
          <div className="admin-header-actions">
            {onImportExcel && (
              <input 
                type="file" 
                accept=".xlsx, .xls, .csv" 
                style={{ display: 'none' }} 
                ref={fileInputRef} 
                onChange={onImportExcel} 
              />
            )}
            
            {(onImportExcel || onDownloadTemplate) && (
              <div className="import-excel-wrapper">
                {onImportExcel && (
                  <button className="btn btn-outline" onClick={() => fileInputRef.current.click()}>
                    <Upload size={18} style={{ marginRight: '8px' }} />
                    Import Excel
                  </button>
                )}
                
                {onDownloadTemplate && (
                  <button 
                    className="btn-icon" 
                    onClick={onDownloadTemplate} 
                    title="Tải file mẫu (Template)"
                    style={{ marginLeft: '0.25rem', backgroundColor: 'var(--bg-hover)' }}
                  >
                    <Download size={18} />
                  </button>
                )}

                <div className="excel-tooltip-container">
                  <HelpCircle size={18} className="excel-help-icon" />
                  <div className="excel-tooltip">
                    <strong>Cột Excel bắt buộc:</strong>
                    <ul>
                      <li><code>ID</code>: Mã (VD: 1, A1...)</li>
                      <li><code>HoTen</code>: Họ và tên</li>
                      <li><code>GioiTinh</code>: Nam/Nữ</li>
                      <li><code>DoiThu</code>: Đời thứ mấy</li>
                    </ul>
                    <strong>Cột mở rộng (Tùy chọn):</strong>
                    <ul>
                      <li><code>MaCha</code>: ID của Cha</li>
                      <li><code>MaMe</code>: ID của Mẹ</li>
                      <li><code>MaVoChong</code>: ID Vợ/Chồng</li>
                      <li><code>LaDauRe</code>: 1 (Nếu là Dâu/Rể)</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
            
            {onAddMember && (
              <button className="btn btn-primary" onClick={onAddMember}>
                <Plus size={18} style={{ marginRight: '8px' }} />
                Thêm mới
              </button>
            )}
          </div>
        )}
      </header>
      )}

      <div className="admin-toolbar">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Tìm theo tên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <Filter size={16} style={{ color: 'var(--text-muted)' }} />
          <select 
            className="admin-select"
            value={filterGender}
            onChange={(e) => setFilterGender(e.target.value)}
          >
            <option value="">Tất cả Giới tính</option>
            <option value="male">Nam</option>
            <option value="female">Nữ</option>
          </select>

          <select 
            className="admin-select"
            value={filterGeneration}
            onChange={(e) => setFilterGeneration(e.target.value)}
          >
            <option value="">Tất cả Đời</option>
            {Array.from({ length: maxGeneration }, (_, i) => i + 1).map(gen => (
              <option key={gen} value={String(gen)}>Đời {gen}</option>
            ))}
          </select>
        </div>
      </div>
    </>
  );
};

export default MembersFilterBar;
