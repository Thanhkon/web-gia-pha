import React, { useState } from 'react';
import { Minus, Plus, RefreshCw, Filter, Users } from 'lucide-react';

const TreeToolbar = ({
  filters,
  setFilters,
  zoomIn,
  zoomOut,
  centerTree,
  isKinshipMode,
  onToggleKinshipMode
}) => {
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const toggleFilter = (key) => {
    setFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="tree-toolbar">
      <div className="filter-dropdown-container">
        <button className="btn btn-outline" onClick={() => setShowFilterMenu(!showFilterMenu)}>
          <Filter size={16} style={{ display: 'inline', marginRight: '4px' }} />
          Bộ lọc hiển thị
        </button>

        {showFilterMenu && (
          <div className="filter-dropdown-menu">
            <h4>Tùy chỉnh sơ đồ</h4>
            <label className="filter-checkbox-label">
              <input type="checkbox" checked={filters.hideDaughtersInLaw || false} onChange={() => toggleFilter('hideDaughtersInLaw')} />
              Ẩn Con dâu / Cháu dâu
            </label>
            <label className="filter-checkbox-label">
              <input type="checkbox" checked={filters.hideSonsInLaw || false} onChange={() => toggleFilter('hideSonsInLaw')} />
              Ẩn Con rể / Cháu rể
            </label>
            <label className="filter-checkbox-label">
              <input type="checkbox" checked={filters.hideDaughters || false} onChange={() => toggleFilter('hideDaughters')} />
              Ẩn Con gái
            </label>
            <label className="filter-checkbox-label">
              <input type="checkbox" checked={filters.hideSons || false} onChange={() => toggleFilter('hideSons')} />
              Ẩn Con trai
            </label>
            <label className="filter-checkbox-label" style={{ borderTop: '1px solid #e5e7eb', paddingTop: '8px', marginTop: '4px' }}>
              <input type="checkbox" checked={filters.groupChildrenBySpouse || false} onChange={() => toggleFilter('groupChildrenBySpouse')} />
              Hiện con theo vợ/chồng
            </label>
          </div>
        )}
      </div>

      <div className="zoom-controls">
        <button className="btn-icon" onClick={zoomIn} title="Phóng to">
          <Plus size={18} />
        </button>
        <button className="btn-icon" onClick={zoomOut} title="Thu nhỏ">
          <Minus size={18} />
        </button>
      </div>

      <button 
        className={`btn ${isKinshipMode ? 'btn-primary' : 'btn-outline'}`} 
        onClick={onToggleKinshipMode}
      >
        <Users size={16} style={{ display: 'inline', marginRight: '4px' }} />
        {isKinshipMode ? 'Hủy tra cứu' : 'Tra cứu quan hệ'}
      </button>

      <button className="btn btn-secondary" onClick={centerTree}>
        <RefreshCw size={16} style={{ display: 'inline', marginRight: '4px' }} />
        Căn giữa
      </button>
    </div>
  );
};

export default TreeToolbar;
